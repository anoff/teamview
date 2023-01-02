const { camelCase, snakeCase } = require('change-case')
const logger = require('../logger').child({ module: __filename })

const knex = require('../db')
// see Planet import at the end

module.exports = class Flight {
  constructor (r = {}, submittingToken) {
    // id indicates that the record already exists in the DB
    this.id = r.id || -1
    this._submittingToken = submittingToken
    this._submittedBy = -1
    this.date = r.date
    this.mission = r.mission
    this.fromGalaxy = r.fromGalaxy
    this.fromSystem = r.fromSystem
    this.fromPosition = r.fromPosition
    this.fromIsMoon = r.fromIsMoon || false
    this.fromLocation = r.fromLocation || ''
    this.toGalaxy = r.toGalaxy
    this.toSystem = r.toSystem
    this.toPosition = r.toPosition
    this.toIsMoon = r.toIsMoon || false
    this.toLocation = r.toLocation || ''
    this.updatedAt = r.updatedAt
    this.createdAt = r.createdAt
    this._isSynced = r._isSynced
    if (!this.fromLocation && this.fromGalaxy && this.fromSystem && this.fromPosition) {
      this.fromLocation = `${r.fromGalaxy}:${r.fromSystem}:${r.fromPosition}`
    }
    if (!this.toLocation && this.toGalaxy && this.toSystem && this.toPosition) {
      this.toLocation = `${r.toGalaxy}:${r.toSystem}:${r.toPosition}`
    }
  }

  /**
   * sync info with database
   *  convert submittingToken (token) -> submittedBy (id of a token)
   */
  async sync () {
    if (this._submittedBy < 0) {
      const response = await knex('tokens')
        .select('id')
        .where({ value: this._submittingToken })
      if (response[0]) {
        this._submittedBy = response[0].id
        delete this._submittingToken
      } else {
        logger.error({ report: this }, 'Cannot find id for ._submittingToken. This should not happen.')
      }
    }
    this._isSynced = true
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
    data.submittedBy = this._submittedBy
    Object.keys(data).forEach(k => {
      data[snakeCase(k)] = data[k]
      if (snakeCase(k) !== k) {
        delete data[k]
      }
    })
    delete data.id
    if (this.id >= 0) {
      data.id = this.id
    }
    return data
  }

  async save () {
    if (!this._isSynced) {
      await this.sync()
    }
    if (this.id < 0) {
      try {
        const response = await knex('flights').insert(this.toDBformat(), ['*'])
        const id = response[0].id
        this.id = id
        logger.info({ report: response[0] }, 'Stored new flight in database')
      } catch (e) {
        console.log(e)
      }
    }
    return this
  }

  static fromDB (data) {
    Object.keys(data).forEach(k => {
      data[camelCase(k)] = data[k]
      if (camelCase(k) !== k) {
        delete data[k]
      }
    })
    return new Flight(data)
  }

  /**
   * Fetch flight(s) by target location
   * @param {integer} galaxy
   * @param {integer} system planet that is flight target
   * @param {integer} position
   * @param {string} mission flight mission type, e.g. attack, transport
   * @param {integer} limit maximum number of records, default: 2
   * @returns Array[Flight]
   */
  static async getByTargetLocation (galaxy, system, position, mission, limit = 2) {
    const search = { to_galaxy: galaxy, to_system: system, to_position: position, mission }
    const response = await knex
      .select('*')
      .from('flights')
      .where(search)
      .orderBy('id', 'desc')
      .limit(limit)
    const flights = response.map(r => Flight.fromDB(r))
    return flights
  }
}
