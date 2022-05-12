const logger = require('../logger').child({ module: __filename })

const knex = require('../db')

module.exports = class Research {
  constructor (r = {}) {
    // id indicates that the token already exists in the DB and will use UPDATE instead of INSERT
    this.id = r.id || -1
    this.name = r.name
    this.alliance = r.alliance
    this.rank = r.rank
    this.pointsResearch = r.pointsResearch
    this.pointsDefense = r.pointsDefense
    this.pointsFleet = r.pointsFleet
    this.points = r.points
    this.unitsDestroyed = r.unitsDestroyed
    this.unitsLost = r.unitsLost
    this.battlesLost = r.battlesLost
    this.battlesWon = r.battlesWon
    this.battlesDraw = r.battlesDraw
    this.research = r.research
  }

  get data () {
    const data = this
    delete data.id
    if (this.id >= 0) {
      data.id = this.id
    }
    return data
  }

  async save (teamForAccess) {
    if (this.id < 0) {
      const response = await knex('research').insert({ ...this.data, access: teamForAccess }, ['*'])
      const id = response[0].id
      this.id = id
      logger.info({ player: response[0] }, 'Stored new player in database')
    } else {
      const response = await knex('research')
        .where({ id: this.id })
        .update(this.data, ['id'])
      console.log(response)
    }
    return this
  }
}
