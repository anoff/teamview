require('dotenv').config()
const knexDriver = require('knex')

async function tableTokens (knex, forceDrop = false) {
  if (forceDrop) await knex.schema.dropTableIfExists('tokens')
  const tableExists = await knex.schema.hasTable('tokens')
  if (!tableExists) {
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
        table.integer('player_id').unsigned()
        table.string('player_name').index()
        table.string('alliance')
        table.integer('rank').unsigned()
        table.integer('points_research').unsigned()
        table.integer('points_defense').unsigned()
        table.integer('points_fleet').unsigned()
        table.integer('points_building').unsigned()
        table.integer('points').unsigned()
        table.integer('units_destroyed').unsigned()
        table.integer('units_lost').unsigned()
        table.integer('battles_lost').unsigned()
        table.integer('battles_won').unsigned()
        table.integer('battles_draw').unsigned()
        table.integer('is_inactive').unsigned() // 0 = no, 1 = short, 2 = long
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
        table.integer('player_id').unsigned()
        table.string('player_name').index()
        table.string('alliance')
        table.integer('rank').unsigned()
        table.integer('points_research').unsigned()
        table.integer('points_defense').unsigned()
        table.integer('points_fleet').unsigned()
        table.integer('points_building').unsigned()
        table.integer('points').unsigned()
        table.integer('units_destroyed').unsigned()
        table.integer('units_lost').unsigned()
        table.integer('battles_lost').unsigned()
        table.integer('battles_won').unsigned()
        table.integer('battles_draw').unsigned()
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
        table.integer('planet_id').unsigned().index()
        table.integer('moon_id').unsigned().index()
        table.string('planet_name')
        table.integer('galaxy').unsigned().index()
        table.integer('system').unsigned().index()
        table.integer('position').unsigned().index()
        table.integer('debris_metal').unsigned()
        table.integer('debris_crystal').unsigned()
        table.integer('player_id').unsigned()
        table.timestamps(false, true)
      }).raw(`
        CREATE OR REPLACE TRIGGER update_planets_updated_at BEFORE UPDATE
        ON planets FOR EACH ROW EXECUTE PROCEDURE 
        update_updated_at_column();`)
  }
}

async function tableReports (knex, forceDrop = false) {
  if (forceDrop) await knex.schema.dropTableIfExists('reports')
  const tableExists = await knex.schema.hasTable('reports')
  if (!tableExists) {
    console.log('recreate reports')
    // Create a table
    await knex.schema
      .createTable('reports', table => {
        table.increments('id')
        table.integer('report_id').unsigned()
        table.string('report_type')
        table.integer('submitted_by').references('tokens.id')
        table.datetime('date')
        table.integer('galaxy').unsigned().index()
        table.integer('system').unsigned().index()
        table.integer('position').unsigned().index()
        table.boolean('is_moon')
        table.json('resources')
        table.json('buildings')
        table.json('ships')
        table.json('research')
        table.json('defense')
        table.integer('planet_id').unsigned()
        table.integer('moon_id').unsigned()
        table.timestamps(false, true)
      }).raw(`
          CREATE OR REPLACE TRIGGER update_reports_updated_at BEFORE UPDATE
          ON reports FOR EACH ROW EXECUTE PROCEDURE 
          update_updated_at_column();`)
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
