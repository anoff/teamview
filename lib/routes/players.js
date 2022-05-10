const express = require('express')
const { body, header, validationResult } = require('express-validator')
const router = express.Router()
const Player = require('../data/player')
const Token = require('../data/token')
const logger = require('../logger')

const middlewares = [
  body('data').isArray(),
  body('token').isString()
]
router.post('/v1/players', ...middlewares, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  const token = req.body.token
  const data = req.body.data
  if (!await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }

  for (const playerData of data) {
    const p = new Player(playerData)
    try {
      await p.save()
      res.json({ message: 'Data saved' })
    } catch (e) {
      res.status(400).json({ message: 'Error occured while adding player in database', error: e.message, full: e })
    }
  }
})
/**
 * Retrieve information about a player based on their ingame name
 * :name parameter can be multiple names separated by ,
 * if only one name is provided, response is an object, otherwise list of objects
 */
router.get('/v1/players/:name', header('token').isString(), async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  const token = req.headers.token
  const name = req.params.name
  if (!await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }
  if (name.includes(',')) {
    const p = await Promise.all(name.split(',').map(async n => await Player.getByName(n)))
    res.json(p)
  } else {
    const p = await Player.getByName(name)
    res.json(p)
  }
})

module.exports = router
