require('dotenv').config()
const dbInit = require('./db')
const server = new (require('./lib/server'))()

dbInit()

server.start()
