const { camelCase, snakeCase } = require('change-case')
const logger = require('../logger').child({ module: __filename })

const knex = require('../db')

module.exports = class Planet {
  constructor (p = {}) {
    // id indicates that the token already exists in the DB and will use UPDATE instead of INSERT
    this.id = p.id || -1
    this.name = p.name
    this.galaxy = p.galaxy
    this.system = p.system
    this.position = p.position
    this.hasMoon = p.hasMoon
    this.debrisMetal = p.debrisMetal
    this.debrisCrystal = p.debrisCrystal
    this.playersIngameId = p.playersIngameId
  }

  toDBformat () {
    const data = { ...this }
    Object.keys(data).forEach(k => {
      data[snakeCase(k)] = data[k]
      if (snakeCase(k) !== k) {
        delete data[k]
      }
    })
    delete data.id
    delete data.created_at
    if (this.id >= 0) {
      data.id = this.id
    }
    return data
  }

  async save () {
    if (this.id < 0) {
      // check if planet exists
      const another = (await Planet.getByLocation(this.galaxy, this.system, this.position))[0]
      if (another) {
        this.id = another.id
      }
    }

    // check again if id is still unknown => planet not in DB
    if (this.id < 0) {
      const response = await knex('planets').insert(this.toDBformat(), ['*'])
      const id = response[0].id
      this.id = id
      logger.info({ planet: response[0] }, 'Stored new planet in database')
    } else {
      const response = await knex('planets')
        .where({ id: this.id })
        .update(this.toDBformat(), ['id', 'name', 'created_at', 'players_ingame_id'])
      logger.info({ planet: response[0] }, 'Updated planet in database')
    }
    return this
  }

  async delete () {
    if (this.id < 0) {
      // check if planet exists
      const another = await Planet.getByLocation(this.galaxy, this.system, this.position)[0]
      if (another) {
        this.id = another.id
      }
    }

    if (this.id >= 0) {
      await knex('planets').where({ id: this.id }).delete()
      logger.info({ planet: this }, 'Deleted planet from database')
    } else {
      logger.info({ planet: this }, 'Failed to delete planet, unknown id')
    }
    return this
  }

  static async getByLocation (galaxy, system, position = 0, type = 'full') {
    const search = { galaxy, system, position }
    if (position === 0) {
      delete search.position
    }
    let query = ''
    switch (type.toLocaleLowerCase()) {
      case 'exists':
        query = ['updated_at', 'id', 'position', 'galaxy', 'system']
        break
      default:
        query = '*'
    }
    const response = await knex('planets')
      .select(query)
      .where(search)
      .limit(50)
      .orderBy('id', 'desc')
    const r = []
    switch (type.toLocaleLowerCase()) {
      case 'exists':
        r.push(...response)
        break
      default:
        r.push(...response.map(e => Planet.fromDB(e)))
    }
    return r
  }

  static fromDB (data) {
    Object.keys(data).forEach(k => {
      data[camelCase(k)] = data[k]
      if (camelCase(k) !== k) {
        delete data[k]
      }
    })
    return new Planet(data)
  }
}
