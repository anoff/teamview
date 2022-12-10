require('dotenv').config()
const crypto = require('crypto')
const { writeFileSync, readFileSync, existsSync } = require('fs')
const axios = require('axios').default
const Player = require('./lib/data/player')
const logger = require('./lib/logger').child({ module: __filename })
const STATS_URL = 'https://pr0game.com/stats_Universe_2.json'

const HASH_FILE = 'importStats.hash'

function isNewHash (hash) {
  const s = existsSync(HASH_FILE)
  if (!s) {
    return true
  } else {
    const oldHash = readFileSync(HASH_FILE, 'ascii')
    return oldHash !== hash
  }
}

async function main () {
  const result = await axios.get(STATS_URL)
  // console.log(result.data.length)
  const stats = result.data
  const len = stats.length
  const hash = crypto.createHash('sha256').update(JSON.stringify(stats)).digest('hex')
  logger.info({ length: len, hash }, 'Found stats')
  const isNew = isNewHash(hash)
  if (!isNew) {
    logger.info('Stats have not changed, not inserting any new data. (Hash is unchanged)')
  } else {
    writeFileSync(HASH_FILE, hash)
    for (const s of stats) {
      const data = {
        playerId: s.playerId,
        playerName: s.playerName,
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
      }
      const p1 = new Player(data)
      await p1.save('players_history')
      // logger.info(`Processing ${n}/${len}`)
      const p2 = new Player(data)
      await p2.sync('players')
      await p2.save('players')
    }
  }
}

main().then(() => {
  logger.info('Done creating new player entries from stats')
  process.exit()
})
