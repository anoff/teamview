const express = require('express')
const { body, header, validationResult } = require('express-validator')
const router = express.Router()
const Token = require('./../data/token')

const middlewares = [
  header('password').isLength({ min: 14 }),
  body('name').isString()
]
router.post('/v1/tokens', ...middlewares, async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const tokenValue = await Token.generateValue()
  const passwordHash = Token.hashPassword(req.headers.password)
  const t = new Token(req.body.name, tokenValue, passwordHash)
  await t.save()
  res.json({ message: 'Token generated. Please remember your password and use the provided token (bunch of words) to setup the plugin', token: t.value, name: t.name })
})

module.exports = router
