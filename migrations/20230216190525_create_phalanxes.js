/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('phalanxes')
  if (exists) return

  return knex.schema.createTable('phalanxes', (table) => {
    table.integer('sensor')
    table.integer('galaxy').notNullable()
    table.integer('system').notNullable()
    table.integer('position').notNullable()
    table.timestamp('updated_at')
    table.integer('moon_id').unique().index()
    table.primary(['moon_id'])
  }).raw(`CREATE 
  OR REPLACE FUNCTION "public"."update_phalanxes" ( ) RETURNS "pg_catalog"."trigger" AS $BODY$ BEGIN
  IF
    NEW.moon_id IS NOT NULL THEN
    IF
      EXISTS ( SELECT * FROM phalanxes WHERE moon_id = NEW.moon_id ) THEN
        UPDATE phalanxes 
        SET sensor = ( NEW.buildings ->> 'phalanxSensor' ) :: NUMERIC,
        updated_at = GREATEST ( NEW.DATE, phalanxes.updated_at ) 
      WHERE
        moon_id = NEW.moon_id 
        AND ( phalanxes.updated_at IS NULL OR NEW.DATE > phalanxes.updated_at );
      ELSE INSERT INTO phalanxes ( sensor, galaxy, SYSTEM, POSITION, moon_id, updated_at )
      VALUES
        (
          ( NEW.buildings ->> 'phalanxSensor' ) :: NUMERIC,
          NEW.galaxy,
          NEW.SYSTEM,
          NEW.POSITION,
          NEW.moon_id,
          NEW.DATE 
        );
      
    END IF;
    
  END IF;
  RETURN NEW;
  
  END;
  $BODY$ LANGUAGE plpgsql VOLATILE COST 100;
`)
.raw(`
  DO $$ BEGIN
    IF
      NOT EXISTS ( SELECT 1 FROM pg_trigger WHERE tgname = 'update_phalanx' AND tgrelid = 'public.reports' :: REGCLASS ) THEN
        CREATE TRIGGER update_phalanx AFTER INSERT 
        OR UPDATE ON PUBLIC.reports FOR EACH ROW
        
        WHEN ( NEW.moon_id IS NOT NULL AND NEW.moon_id > 0 ) EXECUTE FUNCTION update_phalanxes ( );
      
    END IF;
    
  END;
  $$;
`)
.raw(`INSERT INTO phalanxes ( sensor, galaxy, SYSTEM, POSITION, moon_id, updated_at ) SELECT
  ( buildings ->> 'phalanxSensor' ) :: NUMERIC AS sensor,
  galaxy,
  SYSTEM,
  POSITION,
  moon_id,
  DATE 
  FROM
    reports 
  WHERE
    moon_id IS NOT NULL 
    AND DATE = ( SELECT MAX ( DATE ) FROM reports r WHERE r.moon_id = reports.moon_id ) ON CONFLICT ( moon_id ) DO
  UPDATE 
    SET sensor = EXCLUDED.sensor,
    updated_at = GREATEST ( EXCLUDED.updated_at, phalanxes.updated_at );
`)
}

/**
   * @param { import("knex").Knex } knex
   * @returns { Promise<void> }
   */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('phalanxes')
    .raw('DROP TRIGGER IF EXISTS update_phalanx ON reports;')
    .raw('DROP FUNCTION IF EXISTS update_phalanxes() CASCADE;')
}
