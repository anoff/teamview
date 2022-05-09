const randomWords = require('random-words')
const logger = require('../logger').child({ module: __filename })

const knex = require('../db')

module.exports = class Team {
  constructor (name, code, id = -1) {
    // id indicates that the team already exists in the DB and will use UPDATE instead of INSERT
    this.name = name
    this.code = code
    this.id = id
  }

  get data () {
    const data = {
      name: this.name,
      code: this.code
    }
    if (this.id >= 0) {
      data.id = this.id
    }
    return data
  }

  async save () {
    if (this.id < 0) {
      const response = await knex('teams').insert(this.data, ['id'])
      const id = response[0].id
      this.id = id
      logger.info({ team: this.data }, 'Stored new team in database')
    } else {
      await knex('teams')
        .where({ id: this.id })
        .update(this.data, ['id'])
    }
    return this
  }

  static async getById (id) {
    const result = await knex('teams').where({ id: this.id })
    return result
  }

  static generateCode () {
    const random = randomWords({ exactly: 3, maxLength: 14, join: '-' })
    return `TEAM_${random}`
  }
}
