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
    this.teamId = p.teamId
    this.playerId = p.playerId
  }

  get data () {
    const data = { ...this }
    delete data.id
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
      const response = await knex('planets').insert(this.data, ['*'])
      const id = response[0].id
      this.id = id
      logger.info({ planet: response[0] }, 'Stored new planet in database')
    } else {
      const response = await knex('planets')
        .where({ id: this.id })
        .update(this.data, ['id', 'name', 'createdAt', 'playerId'])
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
      logger.info({ planet: this.data }, 'Deleted planet from database')
    } else {
      logger.info({ planet: this.data }, 'Failed to delete planet, unknown id')
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
        query = ['updatedAt', 'id', 'position', 'galaxy', 'system']
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
        r.push(...response.map(e => new Planet(e)))
    }
    return r
  }
}
