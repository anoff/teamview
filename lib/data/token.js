const randomWords = require('random-words')
const { createHmac } = require('node:crypto')
const logger = require('../logger').child({ module: __filename })

const knex = require('../db')

class Token {
  constructor (name, value, passwordHash, id = -1) {
    // id indicates that the token already exists in the DB and will use UPDATE instead of INSERT
    this.name = name
    this.value = value
    this.passwordHash = passwordHash
    this.id = id
  }

  get data () {
    const data = {
      name: this.name,
      value: this.value,
      password: this.passwordHash
    }
    if (this.id >= 0) {
      data.id = this.id
    }
    return data
  }

  async save () {
    if (this.id < 0) {
      const response = await knex('tokens').insert(this.data, ['*'])
      this.id = response[0].id
      logger.info({ token: response[0] }, 'Stored new token in database')
    } else {
      const response = await knex('tokens')
        .where({ id: this.id })
        .update(this.data, ['id'])
    }
    return this
  }

  static async getByValue (value) {
    const response = await knex('tokens')
      .where({ value })
    if (response.length > 0) {
      const r = response[0]
      const t = new Token(r.name, r.value, r.password, r.id)
      return t
    }
    return null
  }

  /**
 * Check if a given token is valid (=exists in the database)
 * @param {string} token value of a token (used for authorization)
 */
  static async isValid (token) {
    const response = await knex('tokens')
      .where({ value: token })
    return response.length === 1
  }

  static async generateValue () {
    const gen = () => `TOKEN_${randomWords({ exactly: 4, maxLength: 10, join: '-' })}`
    let value = gen()
    while (await Token.isValid(value)) {
      value = gen()
    }
    return value
  }

  static hashPassword (password) {
    const secret = process.env.HASH_SECRET
    const hash = createHmac('sha256', secret)
      .update(password)
      .digest('hex')
    return hash
  }
}

module.exports = Token
