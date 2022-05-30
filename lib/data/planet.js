const { camelCase, snakeCase } = require('change-case')
const logger = require('../logger').child({ module: __filename })
const Report = require('./report')

const knex = require('../db')

module.exports = class Planet {
  constructor (p = {}) {
    this.id = p.id || -1
    this.ingameId = p.ingameId
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
        .update(this.toDBformat(), ['id', 'ingame_id', 'name', 'created_at', 'players_ingame_id'])
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

  static async getByIngameId (ingameId, type = 'full') {
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
      .where({ ingame_id: ingameId })
      .limit(1)
      .orderBy('id', 'desc')
    switch (type.toLocaleLowerCase()) {
      case 'exists':
        return response[0]
      default:
        return Planet.fromDB(response[0])
    }
  }

  static fromDB (data) {
    if (!data) return new Planet({})
    Object.keys(data).forEach(k => {
      data[camelCase(k)] = data[k]
      if (camelCase(k) !== k) {
        delete data[k]
      }
    })
    return new Planet(data)
  }

  /**
   * Search for planets by various attributes
   * @param {object} query
   * @param {string} type speciy if 'all' or only 'latest' report should be returned, defaults to 'latest'
   * @returns Array[Report]
   */
  static async search (query) {
    const cmd = knex
      .select(knex.raw('distinct on (CONCAT(galaxy, \':\', system, \':\', position)) players.name as playerName, planets.name as planetName, *'))
      .from('planets')
      .leftJoin('players', 'planets.players_ingame_id', 'players.ingame_id')
      .leftJoin('reports', 'reports.planets_id', 'planets.id')
      .where(whereF => {
        if (query.galaxyMin) whereF.where('galaxy', '>', query.galaxyMin)
        if (query.galaxyMax) whereF.where('galaxy', '<', query.galaxyMax)
        if (query.systemMin) whereF.where('system', '>', query.systemMin)
        if (query.systemMax) whereF.where('system', '<', query.systemMax)
        if (query.playerName) whereF.where('players.name', 'ILIKE', `%${query.playerName.replaceAll('%', '\\%')}%`)
        if (query.allianceName) whereF.where('alliance', 'ILIKE', `%${query.allianceName.replaceAll('%', '\\%')}%`)
        if (query.rankMin) whereF.where('rank', '>', query.rankMin)
        if (query.rankMax) whereF.where('rank', '<', query.rankMax)
      })
      .limit(100)
    const response = await cmd
    // const r = response.map(r => Report.fromDB(r))
    return response.map(e => {
      const p = Planet.fromDB(e)
      delete p.id // wrong id anyway
      const r = Report.fromDB(e)
      if (r.id > -1) {
        delete r.id
        p.report = r.data
      }
      return p
    })
  }
}
