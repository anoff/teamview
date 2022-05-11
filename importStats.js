require('dotenv').config()
const axios = require('axios').default
const Player = require('./lib/data/player')
const logger = require('./lib/logger').child({ module: __filename })

const STATS_URL = 'https://pr0game.com/stats.json'

async function main () {
  const result = await axios.get(STATS_URL)
  // console.log(result.data.length)
  const stats = result.data
  const len = stats.length
  logger.info('Found stats', { length: len })
  for (const s of stats) {
    const p = new Player({
      ingameId: s.playerId,
      name: s.playerName,
      alliance: s.allianceName,
      rank: parseInt(s.rank),
      pointsResearch: parseInt(s.researchScore),
      pointsDefense: parseInt(s.defensiveScore),
      pointsFleet: parseInt(s.fleetScore),
      pointsBuilding: parseInt(s.buildingScore),
      points: parseInt(s.score),
      unitsDestroyed: parseInt(s.unitsDestroyed),
      unitsLost: parseInt(s.unitsLost),
      battlesLost: parseInt(s.battlesLost),
      battlesWon: parseInt(s.battlesWon),
      battlesDraw: parseInt(s.battlesDraw)
    })
    // logger.info(`Processing ${n}/${len}`)
    await p.save()
  }
}

main().then(() => {
  logger.info('Done creating new player entries from stats')
  process.exit()
})
