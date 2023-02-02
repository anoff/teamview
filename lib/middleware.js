const Token = require('./data/token')
const { validationResult } = require('express-validator')

const checkToken = async (req, res, next) => {
  const token = req.headers.token
  if (!await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }
  next()
}

const validateRequest = async (req, res, next) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() })
  }
  next()
}

module.exports = {
  checkToken,
  validateRequest
}
