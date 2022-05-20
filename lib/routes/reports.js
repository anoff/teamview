const express = require('express')
const { body, header, validationResult } = require('express-validator')
const router = express.Router()
const Report = require('../data/report')
const Token = require('../data/token')
const logger = require('../logger').child({ module: __filename })

const middlewares = [
  body('reports').isArray(),
  header('token').isString()
]
router.post('/v1/reports', ...middlewares, async (req, res) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() })
  }
  const token = req.headers.token
  const reports = req.body.reports
  if (!token || !await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }

  let successCount = 0
  const errors = []
  for (const reportData of reports) {
    const r = new Report(reportData)
    try {
      await r.save()
      successCount += 1
    } catch (e) {
      logger.error(e)
      errors.push(e)
    }
  }
  const totalCount = reports.length
  if (successCount === 0 && totalCount > 0) {
    logger.error({ errors, successCount, totalCount }, 'Failed to store reports in database')
    return res.json(500, { message: 'Failed to save reports', successCount, totalCount })
  }
  logger.info({ errors, successCount, totalCount }, 'Stored reports in database')
  res.json({ message: 'Data saved', successCount, totalCount })
})

module.exports = router
