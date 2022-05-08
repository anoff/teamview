require('dotenv').config()
const server = new (require('./lib/server'))()
const db = require('./lib/db')

server.start()
