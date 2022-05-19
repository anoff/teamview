const express = require('express')
const routes = require('./routes')
const logger = require('./logger').child({ module: __filename })
const pino = require('pino-http')({ logger })

class Server {
  constructor () {
    this.app = express()
    this.app.use(express.json())
    this.app.use(express.static('public'))
    if (process.env.NODE_ENV.toLowerCase() === 'production') {
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

  start (port = process.env.PORT) {
    const app = this.app
    if (!this.isInit) {
      this.init()
    }

    app.listen(port, () => {
      logger.info(`Server started on port ${port}`)
    })
  }
}

module.exports = Server
