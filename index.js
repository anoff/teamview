require('dotenv').config()
const server = new (require('./lib/server'))()

server.start()
