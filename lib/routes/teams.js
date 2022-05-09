const express = require('express')
const { body, validationResult } = require('express-validator')
const router = express.Router()
const Team = require('../data/team')
const Token = require('../data/token')

const middlewares = [
  body('name').isString(),
  body('token').isString()
]
router.post('/v1/teams', ...middlewares, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  const token = req.body.token
  const name = req.body.name
  if (!await Token.isValid(token)) {
    // token is not valid
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }

  const teamCode = Team.generateCode()
  const t = new Team(name, teamCode)
  try {
    await t.save()
    res.json({ message: 'Team generated. Please remember your team code, it is needed to join a new team', teamCode: t.code, name: t.name })
  } catch (e) {
    res.status(400).json({ message: 'Error occured while creating team in database', error: e.message, full: e })
  }
})

module.exports = router
