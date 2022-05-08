const express = require('express')
const routes = require('./routes')

class Server {
  constructor () {
    this.app = express()
    this.app.use(express.json())
    this.isInit = false
  }

  init () {
    for (const rname in routes) {
      this.app.use('/', routes[rname])
    }
    this.isInit = true
  }

  start (port = process.env.PORT) {
    const app = this.app
    if (!this.isInit) {
      this.init()
    }

    app.listen(port, () => {
      console.log(`Server started on port ${port}`)
    })
  }
}

module.exports = Server
