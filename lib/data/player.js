const { camelCase, snakeCase } = require('change-case')
const logger = require('../logger').child({ module: __filename })

const knex = require('../db')

module.exports = class Player {
  constructor (p = {}) {
    // id indicates that the token already exists in the DB and will use UPDATE instead of INSERT
    this.id = p.id || -1
    this.playerId = p.playerId
    this.playerName = p.playerName
    this.alliance = p.alliance
    this.rank = p.rank
    this.pointsResearch = p.pointsResearch
    this.pointsDefense = p.pointsDefense
    this.pointsFleet = p.pointsFleet
    this.pointsBuilding = p.pointsBuilding
    this.points = p.points
    this.unitsDestroyed = p.unitsDestroyed
    this.unitsLost = p.unitsLost
    this.battlesLost = p.battlesLost
    this.battlesWon = p.battlesWon
    this.battlesDraw = p.battlesDraw
    this.isVacation = p.isVacation || false
    this.isBanned = p.isBanned || false
    this.isInactive = p.isInactive || 0 // 0=active, 1=inactive, 2 =long
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
    if (this.id >= 0) {
      data.id = this.id
    }
    return data
  }

  /**
   * sync info with database
   *  check if id already exists in DB and set .id
   */
  async sync (tableName = 'players') {
    // see if report was already added
    if (this.id < 0) {
      const response = await knex(tableName)
        .select('*')
        .where({ player_id: this.playerId })
      // make sure it is really the same report, in case game was reset ids might reappear
      if (response[0]?.id) {
        this.id = response[0].id
      }
    }
  }

  async save (tableName = 'players') {
    if (this.id < 0) {
      const data = { ...this.toDBformat() }
      if (tableName === 'players_history') {
        // remove attributes not existing in history table
        delete data.is_banned
        delete data.is_inactive
        delete data.is_vacation
      }
      const response = await knex(tableName).insert(data, ['*'])
      const id = response[0].id
      this.id = id
      logger.info({ player: response[0] }, 'Stored new player in database')
    } else {
      const response = await knex(tableName)
        .where({ id: this.id })
        .update(this.toDBformat(), ['id'])
      logger.info({ player: response[0] }, 'Updated player in database')
    }
    return this
  }

  static async getByName (playerName) {
    const response = await knex('players')
      .select('*')
      .where({ player_name: playerName })
      .orderBy('id', 'desc')
      .limit(1)
    const p = Player.fromDB(response[0])
    return p
  }

  static async getById (playerId) {
    const response = await knex('players')
      .select('*')
      .where({ player_id: playerId })
      .orderBy('id', 'desc')
      .limit(1)
    const p = Player.fromDB(response[0])
    return p
  }

  static fromDB (data) {
    Object.keys(data).forEach(k => {
      data[camelCase(k)] = data[k]
      if (camelCase(k) !== k) {
        delete data[k]
      }
    })
    return new Player(data)
  }
}
