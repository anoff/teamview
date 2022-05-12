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
    this.resources = p.resources
    this.buildings = p.buildings
    this.fleet = p.fleet
    this.defense = p.defense
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
      const response = await knex('planets').insert(this.data, ['*'])
      const id = response[0].id
      this.id = id
      logger.info({ player: response[0] }, 'Stored new planet in database')
    } else {
      const response = await knex('planets')
        .where({ id: this.id })
        .update(this.data, ['id'])
      console.log(response)
    }
    return this
  }

  static async getByLocation (galaxy, system, position) {
    console.log(galaxy, system, position)
    const response = await knex('planets')
      .where({ galaxy, system, position })
      .orderBy('id', 'desc')
      .limit(1)
    const p = new Planet(response[0])
    return p
  }
}
