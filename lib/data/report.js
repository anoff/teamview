const { camelCase } = require('change-case')
const logger = require('../logger').child({ module: __filename })

const knex = require('../db')
const Planet = require('./planet')

module.exports = class Report {
  constructor (r = {}, submittingToken) {
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
    this.submittingToken = submittingToken
    this.submittedBy = -1
    this.planetId = r.planetId || -1
    this.isSynced = false
  }

  /**
   * sync info with database
   *  convert submittingToken (token) -> submittedBy (id of a token)
   *  check if report id already exists in DB and set .id
   *  convert coordinates to .planetId
   */
  async sync () {
    // see if report was already added
    if (this.id < 0) {
      const response = await knex('reports')
        .select('*')
        .where({ report_id: this.reportId })
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
        delete this.galaxy
        delete this.system
        delete this.position
      }
    }
    if (this.submittedBy < 0) {
      const response = await knex('tokens')
        .select('id')
        .where({ value: this.submittingToken })
      if (response[0]) {
        this.submittedBy = response[0].id
        delete this.submittingToken
      } else {
        logger.error({ report: this }, 'Cannot find id for .submittingToken. This should not happen.')
      }
    }
    this.isSynced = true
  }

  toDBformat () {
    const data = {
      report_id: this.reportId,
      report_type: this.reportType,
      submitted_by: this.submittedBy,
      date: this.date,
      resources: this.resources,
      buildings: this.buildings,
      ships: this.ships,
      research: this.research,
      defense: this.defense,
      planets_id: this.planetId
    }
    if (this.id > -1) {
      data.id = this.id
    }
    return data
  }

  async save () {
    if (!this.isSynced) {
      await this.sync()
    }
    if (this.id < 0) {
      const response = await knex('reports').insert(this.toDBformat(), ['*'])
      const id = response[0].id
      this.id = id
      logger.info({ report: response[0] }, 'Stored new spy report in database')
    } else {
      const response = await knex('reports')
        .where({ id: this.id })
        .update(this.toDBformat(), ['id', 'report_id', 'planets_id'])
      logger.info({ report: response[0] }, 'Updated spy report in database')
    }
    return this
  }

  async delete () {
    if (this.id >= 0) {
      await knex('reports').where({ id: this.id }).delete()
      logger.info({ report: this.toDBformat() }, 'Deleted spy report from database')
    } else {
      logger.info({ report: this.toDBformat() }, 'Failed to delete spy report, unknown id')
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
    return new Report(data)
  }

  /**
   * Get the latest report ids that were submitted by a token
   * @param {string} tokenId the tokenId that submitted the reports
   * @param {limit} limit maximum items to return, default: 11
   * @returns Array of [reportId]
   */
  static async getReportIdsByTokenId (tokenId, limit = 11) {
    const response = await knex('reports')
      .select(['id', 'report_id'])
      .where({ submitted_by: tokenId })
      .orderBy('id', 'desc')
      .limit(limit)
    const ids = response.map(e => e.report_id)
    return ids
  }

  /**
   * Fetch spy report(s) by location
   * @param {integer} galaxy
   * @param {integer} system
   * @param {integer} position
   * @param {string} type speciy if 'all' or only 'latest' report should be returned, defaults to 'latest'
   * @returns Array[Report]
   */
  static async getByLocation (galaxy, system, position = 0, type = 'latest') {
    const search = { galaxy, system, position, report_type: 'espionage' }
    if (position === 0) {
      delete search.position
    }
    let select = ''
    switch (type.toLocaleLowerCase()) {
      // for latest group by location
      case 'latest':
        select = knex.raw('distinct on (CONCAT(galaxy, \':\', system, \':\', position)) date, resources, buildings, ships, research, defense, galaxy, system, position, report_id')
        break
      case 'all':
      default:
        select = ['date', 'resources', 'buildings', 'ships', 'research', 'defense', 'galaxy', 'system', 'position', 'report_id']
        break
    }
    const response = await knex
      .select(select)
      .from('reports')
      .leftJoin('planets', 'reports.planets_id', 'planets.id')
      .where(search)
      .limit(15)
    // const r = response.map(r => Report.fromDB(r))
    return response
  }
}
