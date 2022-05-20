const logger = require('../logger').child({ module: __filename })

const res = require('express/lib/response')
const knex = require('../db')
const Planet = require('./planet')

module.exports = class Report {
  constructor (r = {}) {
    // id indicates that the token already exists in the DB and will use UPDATE instead of INSERT
    this.id = r.id || -1
    this.reportId = r.reportId
    this.reportType = r.reportType
    this.galaxy = r.galaxy
    this.system = r.system
    this.position = r.position
    this.date = r.date
    this.resources = r.resources
    this.buildings = r.buildings
    this.ships = r.ships
    this.research = r.research
    this.defense = r.defense
    this.planetId = r.planetId || -1
  }

  get data () {
    const data = { ...this }
    delete data.id
    delete data.galaxy
    delete data.position
    delete data.system
    if (this.id >= 0) {
      data.id = this.id
    }
    return data
  }

  async save () {
    // see if report was already added
    if (this.id < 0) {
      const response = await knex('reports')
        .select('*')
        .where({ reportId: this.reportId })
      // make sure it is really the same report, in case game was reset ids might reappear
      if (response[0] && response[0].date.toISOString() === this.date) {
        this.id = response[0].id
      }
    }
    if (this.planetId < 0) {
      // get planetId
      const another = (await Planet.getByLocation(this.galaxy, this.system, this.position))[0]
      if (another) {
        this.planetId = another.id
      }
    }

    if (this.id < 0) {
      const response = await knex('reports').insert(this.data, ['*'])
      const id = response[0].id
      this.id = id
      logger.info({ report: response[0] }, 'Stored new spy report in database')
    } else {
      const response = await knex('reports')
        .where({ id: this.id })
        .update(this.data, ['id', 'reportId', 'createdAt', 'planetId'])
      logger.info({ report: response[0] }, 'Updated spy report in database')
    }
    return this
  }

  async delete () {
    if (this.id >= 0) {
      await knex('reports').where({ id: this.id }).delete()
      logger.info({ report: this.data }, 'Deleted spy report from database')
    } else {
      logger.info({ report: this.data }, 'Failed to delete spy report, unknown id')
    }
    return this
  }
}
