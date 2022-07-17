const { camelCase, snakeCase } = require('change-case')
const logger = require('../logger').child({ module: __filename })

const knex = require('../db')
// see Planet import at the end

module.exports = class Report {
  constructor (r = {}, submittingToken) {
    // id indicates that the token already exists in the DB and will use UPDATE instead of INSERT
    this.id = r.id || -1
    this.reportId = r.reportId
    this.reportType = r.reportType
    this.galaxy = r.galaxy
    this.system = r.system
    this.position = r.position
    this.isMoon = r.isMoon
    this.date = r.date
    this.resources = r.resources
    this.buildings = r.buildings
    this.ships = r.ships
    this.research = r.research
    this.defense = r.defense
    this._submittingToken = submittingToken
    this._submittedBy = -1
    this.planetId = r.planetId || -1
    this.moonId = r.moonId || -1
    this._isSynced = false
    this.updatedAt = r.updatedAt
    this.createdAt = r.createdAt
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
    if (this.planetId < 0 && this.moonId < 0) {
      // get planetId
      const another = (await Planet.getByLocation(this.galaxy, this.system, this.position))[0]
      if (another) {
        if (this.isMoon) this.moonId = another.moonId
        else this.planetId = another.planetId
      }
    }
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
        const response = await knex('reports').insert(this.toDBformat(), ['*'])
        const id = response[0].id
        this.id = id
        logger.info({ report: response[0] }, 'Stored new spy report in database')
      } catch (e) {
        console.log(e)
        // TODO: link reports to planets via position.. only?
      }
    } else {
      const response = await knex('reports')
        .where({ id: this.id })
        .update(this.toDBformat(), ['id', 'report_id', 'planet_id'])
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
    const search = { 'reports.galaxy': galaxy, 'reports.system': system, 'reports.position': position, report_type: 'espionage' }
    if (parseInt(position) === 0) {
      delete search['reports.position']
    }
    let response
    switch (type.toLocaleLowerCase()) {
      // for latest group by location
      case 'latest':
        response = await knex
          .select(['date', 'resources', 'buildings', 'ships', 'research', 'defense', 'reports.galaxy', 'reports.system', 'reports.position', 'reports.report_id'])
          .from('reports')
          .join(knex.raw(`
            (
                SELECT r.planet_id, MAX(r.report_id) report_id
                FROM reports r
                WHERE r."system" = ${search['reports.system']} AND r.galaxy = ${search['reports.galaxy']}
                GROUP BY r.planet_id
            ) t
            ON reports.report_id = t.report_id
          `))
          .where(search)
          .orderBy('reports.date', 'desc')
          .limit(100)
        break
      case 'all':
      default:
        response = await knex
          .select(['date', 'resources', 'buildings', 'ships', 'research', 'defense', 'reports.galaxy', 'reports.system', 'reports.position', 'report_id'])
          .from('reports')
          .leftJoin('planets', 'reports.planet_id', 'planets.planet_id')
          .where(search)
          .orderBy('reports.date', 'desc')
          .limit(100)
        break
    }
    // const r = response.map(r => Report.fromDB(r))
    return response
  }

  /**
   * Search for reports by various attributes
   * @param {object} query
   * @param {integer} senderTokenId optional value used with the by_me parameter, to identify the senders reports by given senderTokenId
   * @returns Array[Report]
   */

  static async search (query, senderTokenId = -1) {
    /*
    SELECT r.*, COALESCE(t.allships, 0) allships
      FROM reports r
      LEFT JOIN  (
          SELECT r.id, SUM(l.value::int) allships
          FROM reports r
          CROSS JOIN LATERAL json_each_text(r.ships) l
          GROUP BY r.id
      ) t
      ON t.id = r.id
    */
    const cmd = knex
      .select(knex.raw('reports.*, EXTRACT(EPOCH FROM now() - reports.date)/3600 as report_age_hrs, planets.planet_name, players.player_name, players.alliance, players.rank, players.is_inactive, players.is_vacation, players.is_banned'))// , COALESCE(t.allships, 0) allships'))
      .from('reports')
      // .leftJoin(knex.raw(`
      //   (SELECT r.id, SUM(l.value::int) allships
      //   FROM reports r
      //   CROSS JOIN LATERAL json_each_text(r.ships) l
      //   GROUP BY r.id) AS t`))
      .leftJoin('planets', function () {
        this
          .on('reports.galaxy', '=', 'planets.galaxy')
          .on('reports.system', '=', 'planets.system')
          .on('reports.position', '=', 'planets.position')
      })
      .leftJoin('players', 'players.player_id', 'planets.player_id')
      .where(whereF => {
        whereF.where('reports.galaxy', '>', 0)
        whereF.where('reports.system', '>', 0)
        whereF.where('reports.position', '>', 0)
        whereF.where('reports.report_type', '=', 'espionage')
        if (query.galaxy_min) whereF.where('reports.galaxy', '>=', parseInt(query.galaxy_min))
        if (query.galaxy_max) whereF.where('reports.galaxy', '<=', parseInt(query.galaxy_max))
        if (query.system_min) whereF.where('reports.system', '>=', parseInt(query.system_min))
        if (query.system_max) whereF.where('reports.system', '<=', parseInt(query.system_max))
        if (query.player_name) whereF.where('players.player_name', 'ILIKE', `%${query.player_name.replaceAll('%', '\\%')}%`)
        if (query.alliance_name) whereF.where('alliance', 'ILIKE', `%${query.alliance_name.replaceAll('%', '\\%')}%`)
        if (query.rank_min) whereF.where('rank', '>=', parseInt(query.rank_min))
        if (query.rank_max) whereF.where('rank', '<=', parseInt(query.rank_max))
        if (query.min_crystal) whereF.where(knex.raw(`(reports.resources->>'crystal')::int >= ${parseInt(query.min_crystal) * 1e3}`))
        if (query.min_deuterium) whereF.where(knex.raw(`(reports.resources->>'deuterium')::int >= ${parseInt(query.min_deuterium) * 1e3}`))
        if (query.min_mse) whereF.where(knex.raw(`((resources->>'metal')::int + (resources->>'crystal')::int *4 + (resources->>'deuterium')::int* 4) >= ${parseInt(query.min_mse) * 1e3}`))
        if (query.max_tech) whereF.where(knex.raw(`GREATEST((research->>'weaponsTechnology')::int,(research->>'shieldTechnology')::int,(research->>'armourTechnology')::int) <= ${parseInt(query.max_tech)}`))
        if (query.system_min) whereF.where('reports.system', '>=', parseInt(query.system_min))
        if (query.by_me === 'true') whereF.where('reports.submitted_by', '=', senderTokenId)
        if (query.inactive === 'true') whereF.where('players.is_inactive', '>', 0)
        if (query.inactive === 'false') whereF.where('players.is_inactive', '=', 0)
        if (query.vacation === 'true') whereF.where('players.is_vacation', '=', true)
        if (query.vacation === 'false') whereF.where('players.is_vacation', '=', false)
        if (query.banned === 'true') whereF.where('players.is_banned', '=', true)
        if (query.banned === 'false') whereF.where('players.is_banned', '=', false)
        if (query.fleetpoints_min) whereF.where('players.points_fleet', '>=', parseInt(query.fleetpoints_min))
        if (query.defensepoints_max) whereF.where('players.points_defense', '<=', parseInt(query.defensepoints_max))
        if (query.report_maxage) whereF.where(knex.raw(`EXTRACT(EPOCH FROM now() - reports.date)/3600 <= ${parseInt(query.report_maxage)}`))
      })
      .orderBy('report_age_hrs', 'asc')
      .limit(Math.min(parseInt(query.limit) || 100, 1000))
    const response = await cmd
    // const r = response.map(r => Report.fromDB(r))
    return response.map(e => {
      const r = Report.fromDB(e)
      const data = { ...r.data }
      delete data.id // wrong id anyway
      if (e.planetName) data.planetName = e.planetName
      const player = Player.fromDB(e)
      if (player.playerName) {
        data.player = player
      }
      return data
    })
  }
}

// keep this here to prevent circular dependency issues
const Planet = require('./planet')
const Player = require('./player')
