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
    await knex.schema.dropTableIfExists('tokens')
    const tableExists = await knex.schema.hasTable('tokens')
    if (!tableExists) {
      // Create a table
      await knex.schema
        .createTable('tokens', table => {
          table.increments('id')
          table.string('name')
          table.string('value')
          table.string('password')
          table.unique('value')
          table.timestamps(false, true, true)
        })
    }
  } catch (e) {
    console.error(e)
  }
}

if (require.main === module) {
  initDb()
  console.log('Done.')
}
