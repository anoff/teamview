const logger = require('../logger').child({ module: __filename })

const knex = require('../db')

module.exports = class Player {
  constructor (p) {
    // id indicates that the token already exists in the DB and will use UPDATE instead of INSERT
    this.id = p.id || -1
    this.ingameId = p.ingameId
    this.name = p.name
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
  }

  get data () {
    const data = { ...this }
    delete data.id
    if (this.id >= 0) {
      data.id = this.id
    }
    return data
  }

  async save () {
    if (this.id < 0) {
      const response = await knex('players').insert({ ...this.data }, ['*'])
      const id = response[0].id
      this.id = id
      logger.info({ player: response[0] }, 'Stored new player in database')
    } else {
      const response = await knex('players')
        .where({ id: this.id })
        .update(this.data, ['id'])
      console.log(response)
    }
    return this
  }

  static async getByName (name) {
    const response = await knex('players')
      .where({ name })
      .orderBy('id', 'desc')
      .limit(1)
    const p = new Player(response[0])
    return p
  }
}
