require('dotenv').config()
const knexDriver = require('knex')

async function initDb () {
  const knex = knexDriver({
    client: 'pg',
    version: '7.2',
    connection: {
      host: process.env.POSTGRESSHOST,
      port: process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB
    }
  })

  try {
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
        })
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
          table.timestamps(false, true, true)
        })
    }
    await knex.schema.dropTableIfExists('planets')
    await knex.schema.dropTableIfExists('players')
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
          table.timestamps(false, true, true)
        })
    }

    tableExists = await knex.schema.hasTable('planets')
    if (!tableExists) {
      console.log('recreate planets')
      // Create a table
      await knex.schema
        .createTable('planets', table => {
          table.increments('id')
          table.integer('galaxy').unsigned().index()
          table.integer('system').unsigned().index()
          table.integer('position').unsigned().index()
          table.json('resources')
          table.json('buildings')
          table.json('fleet')
          table.json('defense')
          table.integer('teamId').unsigned().references('teams.id')
          table.integer('playerId').unsigned().references('players.id')
          table.timestamps(false, true, true)
        })
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
        })
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
