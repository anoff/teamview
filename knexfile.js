module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: 'localhost',
      user: process.env.POSTGRES_USER,
      password: process.env.DB_PASSWORD,
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
      password: process.env.DB_PASSWORD,
      database: process.env.POSTGRES_DB,
      port: process.env.POSTGRES_PORT,
      ssl: { rejectUnauthorized: false }
    },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations'
    }
  }
}
