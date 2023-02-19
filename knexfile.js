require('dotenv').config();

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'localhost',
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      port: process.env.POSTGRES_PORT
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  },
  production: {
    client: 'pg',
    connection: {
      host: process.env.POSTGRES_HOST,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      port: process.env.POSTGRES_PORT,
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  }
}
