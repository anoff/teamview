require('dotenv').config()
const { spawn } = require('node:child_process')
const CronJob = require('cron').CronJob
const server = new (require('./lib/server'))()
const logger = require('./lib/logger').child({ module: __filename })

const fs = require('fs');

function spawnStatsUpdate () {
  logger.info('Stats update started!')
  const updateStatsProc = spawn('node', ['importStats.js'])

  const stderrStream = fs.createWriteStream('error.log', { flags: 'a' });
  updateStatsProc.stderr.pipe(stderrStream);

  updateStatsProc.on('close', (code) => {
    logger.info('Terminated stats update child process')
  })
}

// start webserver
server.start()

// start cronjob to update stats.json
const updateStats = new CronJob(
  '*/2 * * * *',
  spawnStatsUpdate
)
updateStats.start()
