require('dotenv').config()
const { spawn } = require('node:child_process')
const CronJob = require('cron').CronJob
const server = new (require('./lib/server'))()
const logger = require('./lib/logger').child({ module: __filename })

function spawnStatsUpdate () {
  const updateStatsProc = spawn('node', ['importStats.js'])

  // updateStatsProc.stdout.on('data', (data) => {
  //   console.error(data.toString('ascii'))
  // })

  updateStatsProc.stderr.on('data', (data) => {
    logger.error('Error occured while running stats update')
    // console.error(data.toString('ascii'))
  })

  updateStatsProc.on('close', (code) => {
    logger.info('Terminated stats update child process')
  })
}

// start webserver
server.start()

// start cronjob to update stats.json
const updateStats = new CronJob(
  '7 */4 * * *',
  spawnStatsUpdate
)
updateStats.start()
