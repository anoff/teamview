const express = require('express')
const { body, validationResult } = require('express-validator')
const router = express.Router()
const Team = require('../data/team')
const Player = require('../data/player')
const Token = require('../data/token')

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

module.exports = router
