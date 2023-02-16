/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('phalanxes')
  if (exists) return

  return knex.schema.createTable('phalanxes', (table) => {
    table.decimal('phalanxsensor')
    table.integer('galaxy').notNullable()
    table.integer('system').notNullable()
    table.integer('position').notNullable()
    table.timestamp('updated_at')
    table.integer('moon_id').unique().index()
    table.primary(['moon_id'])
  }).raw(`      
      CREATE OR REPLACE FUNCTION update_phalanxes() RETURNS TRIGGER AS $BODY$
      BEGIN
          IF NEW.moon_id IS NOT NULL THEN
          IF EXISTS (SELECT * FROM phalanxes WHERE moon_id = NEW.moon_id) THEN
              UPDATE phalanxes
              SET phalanxsensor = (NEW.buildings ->> 'phalanxSensor')::numeric,
                  updated_at = GREATEST(NEW.date, phalanxes.updated_at)
              WHERE moon_id = NEW.moon_id AND (phalanxes.updated_at IS NULL OR NEW.date > phalanxes.updated_at);
          ELSE
              INSERT INTO phalanxes (phalanxsensor, galaxy, system, position, moon_id, updated_at)
              VALUES ((NEW.buildings ->> 'phalanxSensor')::numeric, NEW.galaxy, NEW.system, NEW.position, NEW.moon_id, NEW.date);
          END IF;
          END IF;
          RETURN NEW;
      END;
      $BODY$
      LANGUAGE plpgsql VOLATILE;
  
      CREATE TRIGGER update_phalanx AFTER INSERT OR UPDATE ON reports
      FOR EACH ROW
      WHEN (((new.moon_id IS NOT NULL) AND (new.moon_id > 0)))
      EXECUTE FUNCTION update_phalanxes();
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
