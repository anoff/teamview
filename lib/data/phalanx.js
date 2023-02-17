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

  static async getAll () {
    try {
      const response = await knex('phalanxes')
        .select('*')
        .where('sensor', '>', 0)
        .orderBy([
          { column: 'galaxy', order: 'asc' },
          { column: 'system', order: 'asc' },
          { column: 'position', order: 'asc' }
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
}
