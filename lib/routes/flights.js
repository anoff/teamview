const express = require('express')
const { header, validationResult } = require('express-validator')
const router = express.Router()
const Flight = require('../data/flights')
const Token = require('../data/token')
const logger = require('../logger').child({ module: __filename })

/**
 * @apiDefine Flight Flight
 * All the api points to interact with flights data
 */

/**
 * @api {post} /v1/flights Upload flight
 * @apiName Uploadflight
 * @apiGroup flight
 * @apiDescription Upload a new flight
 *
 * @apiHeader {string} content-type='application/json; charset=utf-8' Encode as JSON
 * @apiHeader {string} token A valid API token (starting with `TOKEN_`)
 * @apiBody {date} date The time this flight was started
 * @apiBody {string} mission The type of the flight
 * @apiBody {int} fromGalaxy The galaxy the flight was started
 * @apiBody {int} fromSystem The system
 * @apiBody {int} fromPosition Planets location in the system
 * @apiBody {bool} fromIsMoon Start location is the planet's moon
 * @apiBody {int} toGalaxy The galaxy the flight was started
 * @apiBody {int} toSystem The system
 * @apiBody {int} toPosition Planets location in the system
 * @apiBody {bool} toIsMoon Start location is the planet's moon
 *
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "message": "Data saved"
 *    }
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500
 *    {
 *      "message": "Failed to save flight"
 *    }
 * @apiError Unauthorized The provided token in the header is invalid
 * @apiError InternalServerError Something went wrong. See the error text in the json response
 */
router.post('/v1/flights', header('token').isString(), async (req, res) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() })
  }
  const token = req.headers.token
  const flight = req.body
  if (!token || !await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }

  const f = new Flight(flight, token)
  try {
    await f.save()
  } catch (e) {
    logger.error({ error: e }, 'Failed to store flight in database')
    return res.json(500, { message: 'Failed to save flight' })
  }
  logger.info('Stored flight in database')
  res.json({ message: 'Data saved' })
})

module.exports = router
