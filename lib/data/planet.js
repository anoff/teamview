const { camelCase, snakeCase } = require('change-case')
const logger = require('../logger').child({ module: __filename })

const knex = require('../db')
// see Report import at the end

module.exports = class Planet {
  constructor (p = {}) {
    this.id = p.id || -1
    this.planetId = p.planetId
    this.moonId = p.moonId
    this.planetName = p.planetName
    this.galaxy = p.galaxy
    this.system = p.system
    this.position = p.position
    this.debrisMetal = p.debrisMetal
    this.debrisCrystal = p.debrisCrystal
    this.playerId = p.playerId
    this.updatedAt = p.updatedAt
    this.createdAt = p.createdAt
  }

  /**
   * Return own fields, removing _private style attributes.
   */
  get data () {
    const d = { ...this }
    for (const k in d) {
      if (k.split('')[0] === '_') {
        delete d[k]
      }
    }
    return d
  }

  toDBformat () {
    const data = { ...this.data }
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
        .update(this.toDBformat(), ['id', 'planet_id', 'planet_name', 'created_at', 'player_id'])
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
    if (parseInt(position) === 0) {
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

  static async getByPlanetId (planetId, type = 'full') {
    let query = ''
    switch (type.toLocaleLowerCase()) {
      case 'exists':
        query = ['updated_at', 'planet_id', 'position', 'galaxy', 'system']
        break
      default:
        query = '*'
    }
    const response = await knex('planets')
      .select(query)
      .where({ planet_id: planetId })
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
   * @returns Array[Planet] including .report and .flight data
   */
  static async search (query) {
    const cmd = knex
      .select(knex.raw("DISTINCT on (location) '' as flights_data, flights.*, '' as reports_data, reports.*, '' as planets_data, planets.*, EXTRACT(EPOCH FROM now() - reports.created_at)/3600 as report_age_hrs, flights.date as flight_date")) // put planets last so they overwrite (potentially) missing info from reports
      .from('planets')
      .leftJoin('players', 'planets.player_id', 'players.player_id')
      .leftJoin('reports', 'reports.planet_id', 'planets.planet_id')
      .leftJoin(knex.raw(`(
              SELECT *
              FROM flights AS f
              WHERE f.mission = 'attack'
              ORDER BY id DESC
          ) AS flights
          ON planets.location = flights.to_location`))
      .where(whereF => {
        whereF.whereRaw('planets.location > 0') // ensure that some data exists
        if (query.galaxy_min) whereF.where('planets.galaxy', '>=', parseInt(query.galaxy_min))
        if (query.galaxy_max) whereF.where('planets.galaxy', '<=', parseInt(query.galaxy_max))
        if (query.system_min) whereF.where('planets.system', '>=', parseInt(query.system_min))
        if (query.system_max) whereF.where('planets.system', '<=', parseInt(query.system_max))
        if (query.player_name) whereF.where('players.player_name', 'ILIKE', `%${query.player_name.replaceAll('%', '\\%')}%`)
        if (query.alliance_name) whereF.where('alliance', 'ILIKE', `%${query.alliance_name.replaceAll('%', '\\%')}%`)
        if (query.rank_min) whereF.where('rank', '>=', parseInt(query.rank_min))
        if (query.rank_max) whereF.where('rank', '<=', parseInt(query.rank_max))
        if (query.require_report === 'true') whereF.where('reports.report_id', '>', 0)
        if (query.require_report === 'true') whereF.where('reports.report_type', '=', 'espionage')
        if (query.inactive === 'true') whereF.where('players.is_inactive', '>', 0)
        if (query.inactive === 'false') whereF.where('players.is_inactive', '=', 0)
        if (query.vacation === 'true') whereF.where('players.is_vacation', '=', true)
        if (query.vacation === 'false') whereF.where('players.is_vacation', '=', false)
        if (query.banned === 'true') whereF.where('players.is_banned', '=', true)
        if (query.banned === 'false') whereF.where('players.is_banned', '=', false)
        if (query.has_moon === 'true') whereF.where('planets.moon_id', '>', 0)
        if (query.has_moon === 'false') whereF.where('planets.moon_id', '=', 0)
        if (query.fleetpoints_min) whereF.where('players.points_fleet', '>=', parseInt(query.fleetpoints_min))
        if (query.defensepoints_max) whereF.where('players.points_defense', '<=', parseInt(query.defensepoints_max))
        if (query.require_report === 'true' && query.report_maxage) whereF.where(knex.raw(`EXTRACT(EPOCH FROM now() - reports.created_at)/3600 <= ${parseInt(query.report_maxage)}`))
      })
      .orderBy('location', 'asc')
      .orderBy('report_age_hrs', 'asc')
      .limit(Math.min(parseInt(query.limit) || 100, 1000))
    const response = await cmd
    // const r = response.map(r => Report.fromDB(r))
    return response.map(e => {
      const p = Planet.fromDB(e)
      delete p.id // wrong id anyway
      const player = Player.fromDB(e)
      if (player.playerName) {
        p.player = player
      }
      const r = Report.fromDB(e)
      if (r.id > -1 && r.reportType === 'espionage') {
        p.report = r.data
      }
      return p
    })
  }
}

// keep this here to prevent circular dependency issues
const Report = require('./report')
const Player = require('./player')
