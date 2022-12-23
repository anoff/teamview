const express = require('express')
const routes = require('./routes')
const logger = require('./logger').child({ module: __filename })
const pino = require('pino-http')({ logger })

const isProduction = process.env.NODE_ENV.toLowerCase() === 'production'
class Server {
  constructor () {
    this.app = express()
    this.app.use(express.json())
    this.app.use(express.static('public', { maxAge: isProduction ? 1000 * 3600 * 1 : 0 })) // 1 hour caching
    if (isProduction) {
      this.app.use(pino)
    }
    this.isInit = false
    this.logger = logger
  }

  init () {
    for (const rname in routes) {
      this.app.use('/', routes[rname])
      logger.info({ routeName: rname }, 'Loading route')
    }
    this.isInit = true
  }

  start (port = process.env.APP_PORT) {
    const app = this.app
    if (!this.isInit) {
      this.init()
    }

    app.listen(port, '0.0.0.0', () => {
      logger.info(`Server started on port ${port}`)
    })
  }
}

module.exports = Server
