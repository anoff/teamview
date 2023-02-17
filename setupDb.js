require('dotenv').config()
const knexDriver = require('knex')

async function tableTokens (knex, forceDrop = false) {
  if (forceDrop) await knex.schema.dropTableIfExists('tokens')
  const tableExists = await knex.schema.hasTable('tokens')
  if (!tableExists) {
    console.log('recreate tokens')
    // Create a table
    await knex.schema
      .createTable('tokens', table => {
        table.increments('id')
        table.string('name')
        table.string('value').unique().index()
        table.string('password')
        table.timestamps(false, true)
      }).raw(`
          CREATE OR REPLACE TRIGGER update_tokens_updated_at BEFORE UPDATE
          ON tokens FOR EACH ROW EXECUTE PROCEDURE 
          update_updated_at_column();`)
  }
}

async function tablePlayers (knex, forceDrop = false) {
  if (forceDrop) await knex.schema.dropTableIfExists('players')
  const tableExists = await knex.schema.hasTable('players')
  if (!tableExists) {
    console.log('recreate players')
    // Create a table
    await knex.schema
      .createTable('players', table => {
        table.increments('id')
        table.integer('player_id').unique().index()
        table.string('player_name').index()
        table.string('alliance').index()
        table.integer('rank').index()
        table.integer('points_research')
        table.integer('points_defense').index()
        table.integer('points_fleet').index()
        table.integer('points_building')
        table.integer('points')
        table.integer('units_destroyed')
        table.integer('units_lost')
        table.integer('battles_lost')
        table.integer('battles_won')
        table.integer('battles_draw')
        table.integer('is_inactive') // 0 = no, 1 = short, 2 = long
        table.bool('is_banned')
        table.bool('is_vacation')
        table.timestamps(false, true)
      }).raw(`
          CREATE OR REPLACE TRIGGER update_players_updated_at BEFORE UPDATE
          ON players FOR EACH ROW EXECUTE PROCEDURE 
          update_updated_at_column();`)
  }
}

async function tablePlayersHistory (knex, forceDrop = false) {
  if (forceDrop) await knex.schema.dropTableIfExists('players_history')
  const tableExists = await knex.schema.hasTable('players_history')
  if (!tableExists) {
    console.log('recreate players_history')
    // Create a table
    await knex.schema
      .createTable('players_history', table => {
        table.increments('id')
        table.integer('player_id').index()
        table.string('player_name').index()
        table.string('alliance').index()
        table.integer('rank')
        table.integer('points_research')
        table.integer('points_defense')
        table.integer('points_fleet')
        table.integer('points_building')
        table.integer('points')
        table.integer('units_destroyed')
        table.integer('units_lost')
        table.integer('battles_lost')
        table.integer('battles_won')
        table.integer('battles_draw')
        table.timestamps(false, true)
      }).raw(`
          CREATE OR REPLACE TRIGGER update_players_updated_at BEFORE UPDATE
          ON players FOR EACH ROW EXECUTE PROCEDURE 
          update_updated_at_column();`)
      .raw('CREATE INDEX players_history_created_at_index ON players_history (created_at DESC);')
  }
}

async function tablePlanets (knex, forceDrop = false) {
  if (forceDrop) await knex.schema.dropTableIfExists('planets')
  const tableExists = await knex.schema.hasTable('planets')
  if (!tableExists) {
    console.log('recreate planets')
    // Create a table
    await knex.schema
      .createTable('planets', table => {
        table.increments('id')
        table.integer('planet_id').index()
        table.integer('moon_id').index()
        table.string('planet_name')
        table.integer('galaxy').index()
        table.integer('system').index()
        table.integer('position').index()
        table.integer('debris_metal')
        table.integer('debris_crystal')
        table.integer('player_id')
        table.timestamps(false, true)
      }).raw(`
        CREATE OR REPLACE TRIGGER update_planets_updated_at BEFORE UPDATE
        ON planets FOR EACH ROW EXECUTE PROCEDURE 
        update_updated_at_column();`)
      .raw('ALTER TABLE planets ADD location int GENERATED ALWAYS AS (galaxy * 1000000 + system * 1000 + position) STORED')
  }
}

async function tableReports (knex, forceDrop = false) {
  if (forceDrop) await knex.schema.dropTableIfExists('reports')
  const tableExists = await knex.schema.hasTable('reports')
  if (!tableExists) {
    console.log('recreate reports')
    // Create a table
    await knex.schema.createTable('reports', table => {
      table.increments('id')
      table.bigint('report_id').index()
      table.string('report_type').index()
      table.integer('submitted_by').references('tokens.id')
      table.datetime('date').index()
      table.integer('galaxy').index()
      table.integer('system').index()
      table.integer('position').index()
      table.boolean('is_moon')
      table.json('resources')
      table.json('buildings')
      table.json('ships')
      table.json('research')
      table.json('defense')
      table.integer('planet_id')
      table.integer('moon_id')
      table.timestamps(false, true)
    }).raw(`
          CREATE OR REPLACE TRIGGER update_reports_updated_at BEFORE UPDATE
          ON reports FOR EACH ROW EXECUTE PROCEDURE 
          update_updated_at_column();`)
      .raw('ALTER TABLE reports ADD location int GENERATED ALWAYS AS (galaxy * 1000000 + system * 1000 + position) STORED')
      .raw(`
      CREATE OR REPLACE FUNCTION "public"."update_phalanxes"()
      RETURNS "pg_catalog"."trigger" AS $BODY$
      BEGIN
        IF NEW.moon_id IS NOT NULL THEN
          IF EXISTS (SELECT * FROM phalanxes WHERE moon_id = NEW.moon_id) THEN
            UPDATE phalanxes
            SET sensor = (NEW.buildings ->> 'phalanxSensor')::numeric,
                updated_at = GREATEST(NEW.date, phalanxes.updated_at)
            WHERE moon_id = NEW.moon_id AND (phalanxes.updated_at IS NULL OR NEW.date > phalanxes.updated_at);
          ELSE
            INSERT INTO phalanxes (sensor, galaxy, system, position, moon_id, updated_at)
            VALUES ((NEW.buildings ->> 'phalanxSensor')::numeric, NEW.galaxy, NEW.system, NEW.position, NEW.moon_id, NEW.date);
          END IF;
        END IF;
        RETURN NEW;
      END;
      $BODY$
        LANGUAGE plpgsql VOLATILE
      COST 100

      CREATE TRIGGER update_phalanx AFTER INSERT OR UPDATE ON reports
      FOR EACH ROW
      WHEN (((new.moon_id IS NOT NULL) AND (new.moon_id > 0)))
      EXECUTE FUNCTION update_phalanxes();
    `)
  }
}

async function tablePhalanxes (knex, forceDrop = false) {
  if (forceDrop) await knex.schema.dropTableIfExists('phalanxes')
  const tableExists = await knex.schema.hasTable('phalanxes')
  if (!tableExists) {
    console.log('recreate phalanxes')
    // Create a table
    await knex.schema.createTable('phalanxes', (table) => {
      table.integer('sensor')
      table.integer('galaxy').notNullable()
      table.integer('system').notNullable()
      table.integer('position').notNullable()
      table.timestamp('updated_at')
      table.integer('moon_id').unique().index()
      table.primary(['moon_id'])
    })
  }
}

async function initDb () {
  const knex = knexDriver({
    client: 'pg',
    version: '14.2',
    connection: {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB
    }
  })

  try {
    await knex.raw(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
     NEW."updated_at"=now(); 
     RETURN NEW;
    END;
    $$ language 'plpgsql';
  `)
    const forceDrop = false

    await tableTokens(knex, forceDrop)
    await tablePlayers(knex, forceDrop)
    await tablePlayersHistory(knex, forceDrop)
    await tablePlanets(knex, forceDrop)
    await tableReports(knex, forceDrop)
    await tablePhalanxes(knex, forceDrop)
  } catch (e) {
    console.error(e)
  }
}

async function main () {
  await initDb()
  console.log('Done.')
  process.exit()
}
if (require.main === module) {
  main()
}
