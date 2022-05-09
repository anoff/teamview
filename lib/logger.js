const pino = require('pino')

const redact = [
  // json paths for data that should be removed from logger
  '*.headers.password',
  'token.value'
]
const logger = pino({ redact })

module.exports = logger
