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
    this.isVacation = p.isVacation
    this.isBanned = p.isBanned
    this.isInactive = p.isInactive // 0=active, 1=inactive, 2 =long
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

  static fromDB (data = {}) {
    Object.keys(data).forEach(k => {
      data[camelCase(k)] = data[k]
      if (camelCase(k) !== k) {
        delete data[k]
      }
    })
    return new Player(data)
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

  static async saveMany (players, tableName = 'players', ignoreStatus = false) {
    logger.info('Save many')
    const data = players.map((p) => {
      const d = p.toDBformat()

      if(ignoreStatus) {
        delete d.is_banned
        delete d.is_inactive
        delete d.is_vacation
      }

      return d
    })

    try {
      const response = await knex(tableName).insert(data).returning('*')

      logger.info(`Saved ${response.length} players to database`)

      return response.map(p => Player.fromDB(p))
    } catch (error) {
      logger.info(error)
      return []
    }
  }

  static async upsertMany (players, tableName = 'players', ignoreStatus = false) {
    const data = players.map((p) => {
      const d = p.toDBformat()

      if(ignoreStatus) {
        delete d.is_banned
        delete d.is_inactive
        delete d.is_vacation
      }
      return d
    })

    const response = await knex(tableName)
      .insert(data)
      .onConflict('player_id')
      .merge()
      .returning('*')

    return response.map(p => Player.fromDB(p))
  }

  /**
   * Get a single player by their name
   * @param {string} playerName - The name of the player to retrieve
   * @return {Player} - A Player instance
   */
  static async getByName (playerName) {
    const response = await knex('players')
      .select('*')
      .where({ player_name: playerName })
      .orderBy('id', 'desc')
      .limit(1)

    const player = Player.fromDB(response[0])

    return player
  }

  /**
   * Get multiple players by their names
   * @param {string[]} playerNames - An array of player names to retrieve
   * @return {Player[]} - An array of Player instances
   */
  static async getByNames (playerNames) {
    const response = await knex('players')
      .select('*')
      .whereIn('player_name', playerNames)
      .orderBy('id', 'desc')

    const players = []
    response.forEach(response => {
      players.push(Player.fromDB(response))
    })

    return players
  }

  /**
   * Get multiple players by the names of their alliances
   * @param {string[]} allianceNames - An array of alliance names
   * @return {Player[]} - An array of Player instances
   */
  static async getByAllianceNames (allianceNames) {
    const response = await knex('players')
      .whereIn('alliance', allianceNames)
      .select('*')
      .orderBy('id', 'desc')

    const players = []
    response.forEach(response => {
      players.push(Player.fromDB(response))
    })

    return players
  }

  /**
   * Get multiple players by the name of their alliance
   * @param {string} allianceName - The name of the alliance
   * @return {Player[]} - An array of Player instances
   */
  static async getByAllianceName (allianceName) {
    const response = await knex('players')
      .select('*')
      .where({ alliance: allianceName })
      .orderBy('id', 'desc')

    const players = []
    response.forEach(response => {
      players.push(Player.fromDB(response))
    })

    return players
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
}
