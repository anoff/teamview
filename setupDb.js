require('dotenv').config()
const knexDriver = require('knex')

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
    let tableExists = false
    // await knex.schema.dropTableIfExists('tokens')
    tableExists = await knex.schema.hasTable('tokens')
    if (!tableExists) {
      // Create a table
      await knex.schema
        .createTable('tokens', table => {
          table.increments('id')
          table.string('name')
          table.string('value').unique().index()
          table.string('password')
          table.timestamps(false, true, true)
        }).raw(`
          CREATE TRIGGER update_tokens_updated_at BEFORE UPDATE
          ON tokens FOR EACH ROW EXECUTE PROCEDURE 
          update_updated_at_column();`)
    }

    // await knex.schema.dropTableIfExists('teams')
    tableExists = await knex.schema.hasTable('teams')
    if (!tableExists) {
      console.log('recreate teams')
      // Create a table
      await knex.schema
        .createTable('teams', table => {
          table.increments('id')
          table.string('name').unique()
          table.string('code').unique().index()
          table.timestamps(false, true)
        }).raw(`
        CREATE TRIGGER update_teams_updated_at BEFORE UPDATE
        ON teams FOR EACH ROW EXECUTE PROCEDURE 
        update_updated_at_column();`)
    }
    // await knex.schema.dropTableIfExists('planets')
    // await knex.schema.dropTableIfExists('players')
    tableExists = await knex.schema.hasTable('players')
    if (!tableExists) {
      console.log('recreate players')
      // Create a table
      await knex.schema
        .createTable('players', table => {
          table.increments('id')
          table.integer('ingameId').unsigned()
          table.string('name').index()
          table.string('alliance')
          table.integer('rank').unsigned()
          table.integer('pointsResearch').unsigned()
          table.integer('pointsDefense').unsigned()
          table.integer('pointsFleet').unsigned()
          table.integer('pointsBuilding').unsigned()
          table.integer('points').unsigned()
          table.integer('unitsDestroyed').unsigned()
          table.integer('unitsLost').unsigned()
          table.integer('battlesLost').unsigned()
          table.integer('battlesWon').unsigned()
          table.integer('battlesDraw').unsigned()
          table.timestamps(false, true)
        }).raw(`
          CREATE TRIGGER update_players_updated_at BEFORE UPDATE
          ON players FOR EACH ROW EXECUTE PROCEDURE 
          update_updated_at_column();`)
    }

    tableExists = await knex.schema.hasTable('planets')
    if (!tableExists) {
      console.log('recreate planets')
      // Create a table
      await knex.schema
        .createTable('planets', table => {
          table.increments('id')
          table.string('name')
          table.integer('galaxy').unsigned().index()
          table.integer('system').unsigned().index()
          table.integer('position').unsigned().index()
          table.bool('hasMoon')
          table.integer('debrisMetal').unsigned()
          table.integer('debrisCrystal').unsigned()
          table.integer('teamId').unsigned().references('teams.id')
          table.integer('playerIngameId').unsigned()
          table.timestamps(false, true, true)
        }).raw(`
          CREATE TRIGGER update_planets_updated_at BEFORE UPDATE
          ON planets FOR EACH ROW EXECUTE PROCEDURE 
          update_updated_at_column();`)
    }
    // await knex.schema.dropTableIfExists('teamMembers')
    tableExists = await knex.schema.hasTable('teamMembers')
    if (!tableExists) {
      console.log('recreate teamMembers')
      // Create a table
      await knex.schema
        .createTable('teamMembers', table => {
          table.increments('id')
          table.integer('tokenId').unsigned().references('tokens.id')
          table.integer('teamId').unsigned().references('teams.id')
          table.timestamps(false, true, true)
        }).raw(`
          CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE
          ON team_members FOR EACH ROW EXECUTE PROCEDURE 
          update_updated_at_column();`)
    }

    await knex.schema.dropTableIfExists('reports')
    tableExists = await knex.schema.hasTable('reports')
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
          table.json('resources')
          table.json('buildings')
          table.json('ships')
          table.json('research')
          table.json('defense')
          table.integer('planets_id').unsigned().references('planets.id')
          table.timestamps(false, true)
        }).raw(`
          CREATE TRIGGER update_reports_updated_at BEFORE UPDATE
          ON reports FOR EACH ROW EXECUTE PROCEDURE 
          update_updated_at_column();`)
    }
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
