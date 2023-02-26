const { camelCase, snakeCase } = require('change-case')
const logger = require('../logger').child({ module: __filename })

const knex = require('../db')
// see Report import at the end

class DatabaseTable {
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
}

module.exports = class Phalanx extends DatabaseTable {
  constructor (p = {}) {
    super()
    this.sensor = p.sensor
    this.moonId = p.moonId
    this.galaxy = p.galaxy
    this.system = p.system
    this.position = p.position
    this.updatedAt = p.updatedAt
    this.isInactive = p.isInactive
    this.isBanned = p.isBanned
    this.isVacation = p.isVacation

    this.computeRange()
  }

  computeRange () {
    const phalanxRange = Math.pow(this.sensor, 2) - 1
    const lowerBoundRange = ((this.system + 400) - phalanxRange) % 400
    const upperBoundRange = (this.system + phalanxRange) % 400

    this.range = {
      from: lowerBoundRange,
      to: upperBoundRange
    }
  }

  toDBformat () {
    const data = { ...this.data }

    Object.keys(data).forEach(k => {
      data[snakeCase(k)] = data[k]
      if (snakeCase(k) !== k) {
        delete data[k]
      }
    })

    if (this.id >= 0) {
      data.id = this.id
    }
    return data
  }

  static async getAll () {
    try {
      const response = await knex
        .select('phalanx.*', 'player.*')
        .from('phalanxes as phalanx')
        .leftJoin('planets as planet', 'phalanx.moon_id', 'planet.moon_id')
        .leftJoin('players as player', 'planet.player_id', 'player.player_id')
        .where('sensor', '>', 0)
        .orderBy([
          { column: 'phalanx.galaxy', order: 'asc' },
          { column: 'phalanx.system', order: 'asc' },
          { column: 'phalanx.position', order: 'asc' }
        ])

      const phalanxes = []
      response.forEach(phalanxData => {
        phalanxes.push(Phalanx.fromDB(phalanxData))
      })

      return phalanxes
    } catch (error) {
      // logger.error(error)
      console.debug(error)
      return []
    }
  }

  static async getByGalaxy (galaxy) {
    if (typeof galaxy !== 'number') {
      throw new Error(`Parameter galaxy is not a number. It's type is ${typeof galaxy}`)
    }

    try {
      const response = await knex
        .select('phalanx.*', 'player.*')
        .from('phalanxes as phalanx')
        .leftJoin('planets as planet', 'phalanx.moon_id', 'planet.moon_id')
        .leftJoin('players as player', 'planet.player_id', 'player.player_id')
        .where('sensor', '>', 0)
        .where('phalanx.galaxy', '=', galaxy)
        .orderBy([
          { column: 'phalanx.galaxy', order: 'asc' },
          { column: 'phalanx.system', order: 'asc' },
          { column: 'phalanx.position', order: 'asc' }
        ])

      const phalanxes = []
      response.forEach(phalanxData => {
        phalanxes.push(Phalanx.fromDB(phalanxData))
      })

      return phalanxes
    } catch (error) {
      logger.error(error)
      return []
    }
  }

  static fromDB (data = {}) {
    if (!data) return new Phalanx({})
    Object.keys(data).forEach(k => {
      data[camelCase(k)] = data[k]
      if (camelCase(k) !== k) {
        delete data[k]
      }
    })
    return new Phalanx(data)
  }

  isInRange (galaxy, system) {
    if (typeof galaxy !== 'number') {
      throw new Error(`Parameter galaxy is not a number. It's type is ${typeof galaxy}`)
    }

    if (typeof system !== 'number') {
      throw new Error(`Parameter system is not a number. It's type is ${typeof system}`)
    }

    if (galaxy !== this.galaxy) return false

    // if true this means that we dont have an overflow on either side
    // if false we need to adapt
    if (this.range.from <= this.range.to) {
      // if between these range its in range
      return this.range.from <= system && system <= this.range.to
    } else {
      return this.range.from <= system || system <= this.range.to
    }
  }
}
