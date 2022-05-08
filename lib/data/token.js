const randomWords = require('random-words')
const { createHmac } = require('node:crypto')

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
      const response = await knex('tokens').insert(this.data, ['id'])
      const id = response[0].id
      this.id = id
    } else {
      const response = await knex('tokens')
        .where({ id: this.id })
        .update(this.data, ['id'])
      console.log(response)
    }
  }

  static getById (id) {

  }

  static generateValue () {
    return randomWords({ exactly: 4, maxLength: 10, join: '-' })
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
