const express = require('express')
const { body, header, validationResult } = require('express-validator')
const router = express.Router()
const Planet = require('../data/planet')
const Token = require('../data/token')
const logger = require('../logger')

const middlewares = [
  body('planets').isArray(),
  body('token').isString()
]
router.post('/v1/players', ...middlewares, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  const token = req.body.token
  const planets = req.body.planets
  if (!await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }

  for (const planetData of planets) {
    const playerName = planetData.playerName
    const p = new Planet(planetData)
    logger(p)
    // try {
    //   await p.save()
    //   res.json({ message: 'Data saved' })
    // } catch (e) {
    //   res.status(400).json({ message: 'Error occured while adding planet in database', error: e.message, full: e })
    // }
  }
})
/**
 * Retrieve information about a planet based on their ingame location
 * :location parameter can be multiple names separated by ,
 * each location in format "GALAXY:SYSTEM:POSITION"
 * response is an array of results
 */
router.get('/v1/planets/:location', header('token').isString(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
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
