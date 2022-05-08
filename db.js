const knexDriver = require('knex')

async function initDb () {
  // const knex = knexDriver({
  //   client: 'sqlite3',
  //   connection: {
  //     filename: './data.db'
  //   }
  // })
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
    // await knex.schema.dropTableIfExists('accounts')
    // await knex.schema.dropTableIfExists('users')
    const tableExists = await knex.schema.hasTable('users') && await knex.schema.hasTable('accounts')
    if (!tableExists) {
      console.log('create new table')
      // Create a table
      await knex.schema
        .createTable('users', table => {
          table.increments('id')
          table.string('user_name')
          table.timestamps(false, true, true)
        })
        // ...and another
        .createTable('accounts', table => {
          table.increments('id')
          table.string('account_name')
          table
            .integer('user_id')
            .unsigned()
            .references('users.id')
          table.timestamps(false, true, true)
        })
    }

    // Then query the table...
    // const insertedRows = await knex('users').insert({ user_name: 'Tim' })
    // console.log(insertedRows)

    // ...and using the insert id, insert into the other table.
    // await knex('accounts').insert({ account_name: 'knex', user_id: insertedRows[0] })

    // Query both of the rows.
    const selectedRows = await knex('users')
      .select('*')
    console.log(selectedRows)
  } catch (e) {
    console.error(e)
  }
}

module.exports = initDb
