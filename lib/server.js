const express = require('express')
const logger = require('./logger').child({ module: __filename })
const pino = require('pino-http')({ logger })
const morgan = require('morgan')

const isProduction = process.env.NODE_ENV.toLowerCase() === 'production'
class Server {
  constructor () {
    this.app = express()
    this.app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))
    this.app.use(express.json())
    this.app.use(express.static('public', { maxAge: isProduction ? 1000 * 3600 * 1 : 0 })) // 1 hour caching
    if (isProduction) {
      this.app.use(pino)
    }
    this.isInit = false
    this.logger = logger
  }

  init () {
    this.loadRoutes()
    this.isInit = true
  }

  loadRoutes () {
    const routesPath = require('path').join(__dirname, 'routes')
    require('fs').readdirSync(routesPath).forEach((file) => {
      const route = require('./routes/' + file)
      logger.info({ route: file }, 'Loading route')
      this.app.use('/', route)
    })
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
