const express = require('express')
const { body, header, validationResult } = require('express-validator')
const router = express.Router()
const Planet = require('../data/planet')
const Player = require('../data/player')
const Report = require('../data/report')
const Token = require('../data/token')
const logger = require('../logger').child({ module: __filename })

const middlewares = [
  body('planets').isArray(),
  header('token').isString()
]
router.post('/v1/planets', ...middlewares, async (req, res) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() })
  }
  const token = req.headers.token
  const planets = req.body.planets
  if (!token || !await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }

  let successCount = 0
  const errors = []
  for (const planetData of planets) {
    console.log(planetData)
    const playerName = planetData.playerName
    let playerId = planetData.playerId
    if (playerId === -1) {
      const p = await Player.getByName(playerName)
      if (p.ingameId > -1) {
        playerId = p.ingameId
      }
    }
    planetData.playersIngameId = playerId
    delete planetData.playerId

    const planets = await Planet.getByIngameId(planetData.id)
    if (playerId > -1) {
      const p = new Planet(planetData)
      const planet = planets[0]
      if (planet?.id > -1) {
        p.id = planet.id
      }
      // logger.info({ player, planet: p }, 'Found player for planet, updating database.')
      try {
        await p.save()
        successCount += 1
      } catch (e) {
        logger.error(e)
        errors.push(e)
      }
    } else {
      logger.warn({ name: planetData.playerName }, 'Could not find player with this name in the database')
    }
  }
  const totalCount = planets.length
  if (successCount === 0 && totalCount > 0) {
    logger.error({ errors, successCount, totalCount }, 'Failed to store planets in database')
    return res.status(500).json({ message: 'Failed to save planets', successCount, totalCount })
  }
  logger.info({ errors, successCount, totalCount }, 'Stored planets in database')
  res.json({ message: 'Data saved', successCount, totalCount })
})
/**
 * Retrieve information about a planet based on their ingame location
 * :location parameter can be multiple names separated by ,
 * each location in format "GALAXY:SYSTEM[:POSITION]"
 * response is an array of results
 * Pass ?type=exists to only get information if a planet exists and his latest update time
 */
router.get('/v1/planets/:location', header('token').isString(), async (req, res) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() })
  }
  const type = req.query.type || 'full'
  const token = req.headers.token
  const location = req.params.location
  if (!await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }
  const p = await Promise.all(location.split(',').map(async l => {
    const [g, s, pos] = l.split(':')
    if (!g || !s) {
      logger.info({ l }, 'Invalid location request.')
      return res.status(400).json({ message: 'Invalid location requested. Must specify at least galaxy and system.', location: l })
    }
    if (req.query.type === 'report') {
      const [planets, reports] = await Promise.all([await Planet.getByLocation(g, s, pos, type), await Report.getByLocation(g, s, pos, 'latest')])
      for (const p of planets) {
        const report = reports.find(e => e.galaxy === p.galaxy && e.system === p.system && e.position === p.position)
        if (report) {
          p.report = report
        }
      }
      return planets
    } else {
      const planets = await Planet.getByLocation(g, s, pos, type)
      return planets
    }
  }))
  res.json(p.flat(1))
})

router.delete('/v1/planets/:location', header('token').isString(), async (req, res) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() })
  }
  const token = req.headers.token
  const location = req.params.location
  if (!await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }
  const [g, s, pos] = location.split(':')
  const planets = await Planet.getByLocation(g, s, pos) // hopefully only one..
  let deleteCount = 0
  for (const p of planets) {
    await p.delete()
    deleteCount += 1
  }
  res.json({ message: 'OK', deleteCount })
})
module.exports = router
