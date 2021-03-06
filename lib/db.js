const knexDriver = require('knex')

function init () {
  const knex = knexDriver({
    client: 'pg',
    version: '14.2',
    debug: process.env.NODE_ENV === 'development',
    connection: {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB
    }
  })
  return knex
}

module.exports = init()
