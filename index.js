require('dotenv').config()
const { spawn } = require('child_process')
const CronJob = require('cron').CronJob
const server = new (require('./lib/server'))()
const logger = require('./lib/logger').child({ module: __filename })

const fs = require('fs');

function spawnStatsUpdate () {
  logger.info('Stats update started!')
  const updateStatsProc = spawn('node', ['importStats.js'])
  
  const stdOutStream = fs.createWriteStream('logs/importstats_stdout_stderr.log', { flags: 'a' });
  updateStatsProc.stdout.pipe(stdOutStream);
  updateStatsProc.stderr.pipe(stdOutStream);

  updateStatsProc.stderr.on('data', (data) => {
    logger.error('Error occured while running stats update')
  })

  updateStatsProc.on('close', (code) => {
    logger.info('Terminated stats update child process')
  })
}

// start webserver
server.start()

// start cronjob to update stats.json
const updateStats = new CronJob(
  '7 * * * *',
  spawnStatsUpdate
)
updateStats.start()
