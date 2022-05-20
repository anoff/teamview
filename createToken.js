require('dotenv').config()
const Token = require('./lib/data/token')
const logger = require('./lib/logger').child({ module: __filename })

async function main () {
  const password = process.env.TOKEN_PASSWORD
  const value = await Token.generateValue()
  const t = new Token('shared', value, Token.hashPassword(password))
  await t.save()
  console.log(`Created token. Password=${password}, Token=${value}, Object=${JSON.stringify(t.data)}`)
}

main().then(() => {
  logger.info('Done creating new player entries from stats')
  process.exit()
})
