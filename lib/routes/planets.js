const express = require('express')
const { body, header, validationResult } = require('express-validator')
const router = express.Router()
const Planet = require('../data/planet')
const Player = require('../data/player')
const Token = require('../data/token')
const logger = require('../logger')

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
    const playerName = planetData.playerName
    const [player, planet] = await Promise.all([Player.getByName(playerName), Planet.getByLocation(planetData.galaxy, planetData.system, planetData.position)])
    if (player.id > -1) {
      const p = new Planet(planetData)
      if (planet.id > -1) {
        p.id = planet.id
      }
      p.playerId = player.id
      logger.info({ player, planet: p }, 'Found player for planet, updating database.')
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
  if (successCount === 0) {
    logger.error({ errors, successCount, totalCount }, 'Failed to store planets in database')
    res.json(500, { message: 'Failed to save planets', successCount, totalCount })
  }
  logger.info({ errors, successCount, totalCount }, 'Stored planets in database')
  res.json({ message: 'Data saved', successCount, totalCount })
})
/**
 * Retrieve information about a planet based on their ingame location
 * :location parameter can be multiple names separated by ,
 * each location in format "GALAXY:SYSTEM:POSITION"
 * response is an array of results
 */
router.get('/v1/planets/:location', header('token').isString(), async (req, res) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() })
  }
  const token = req.headers.token
  const location = req.params.location
  if (!await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }
  const p = await Promise.all(location.split(',').map(async n => {
    const [g, s, pos] = location.split(':')
    await Planet.getByLocation(g, s, pos)
  }))
  res.json(p)
})

module.exports = router
