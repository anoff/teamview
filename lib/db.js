const knexDriver = require('knex')

function init () {
  const knex = knexDriver({
    client: 'pg',
    connection: {
      host: process.env.POSTGRESSHOST,
      port: process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB
    }
  })
  return knex
}

module.exports = init()
