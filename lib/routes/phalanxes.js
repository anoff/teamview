const express = require('express')
const { header } = require('express-validator')
const router = express.Router()
const Phalanx = require('../data/phalanx')
const logger = require('../logger')
// const logger = require('../logger')
// const logger = require('../logger').child({ module: __filename })
const { checkToken, validateRequest } = require('../middleware')

/**
 * @apiDefine Phalanx Phalanx
 * All the api points to interact with phalanxes
 */

/**
 * @api {get} /v1/phalanxes Retrieve all Phalanxes
 * @apiName GetPhalanxes
 * @apiGroup Phalanx
 * @apiDescription Retrieve an array of Phalanxes
 *
 * @apiHeader {string} content-type='application/json; charset=utf-8' Encode as JSON
 * @apiHeader {string} token A valid API token (starting with `TOKEN_`)
 *
 * @apiQuery {int} galaxy Only retrieve Phalanxes of a certain Galaxy
 *
 * @apiBody {object[]} Phalanxes List of phalanxes
 * @apiBody {int} phalanx.sensor Level of the Sensor Phalanx
 * @apiBody {int} phalanx.moon_id The id of the relevant Moon
 * @apiBody {int} phalanx.galaxy The galaxy the phalanx is in
 * @apiBody {int} phalanx.system The system the phalanx is in
 * @apiBody {int} phalanx.position The position the phalanx has in its system
 * @apiBody {int} phalanx.range.from The system the phalanx range starts
 * @apiBody {int} phalanx.range.to The system the phalanx range ends
 *
 * @apiSuccessExample (type="report") {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "sensor": 1,
 *      "moonId": 32493,
 *      "galaxy": 7,
 *      "system": 81,
 *      "position": 7,
 *      "range": {
 *        from: 1
 *        to: 400
 *      }
 *      "updatedAt": ,
 *    }
 *
 * @apiError Unauthorized The provided token in the header is invalid
 * @apiError InternalServerError Something went wrong. See the error text in the json response
*/
router.get('/v1/phalanxes', header('token').isString(), validateRequest, checkToken, async (req, res) => {
  let galaxy = 0

  try {
    galaxy = parseInt(req.query.galaxy)
  } catch (error) {
    logger.error({ msg: 'There was a Problem parsing the galaxy query parameter to int', error })
  }

  let phalanxes = []
  if (galaxy === 0) {
    phalanxes = await Phalanx.getAll()
  } else {
    phalanxes = await Phalanx.getByGalaxy(galaxy)
  }

  res.json(phalanxes)
})

router.get('/v1/phalanxes/in_range/:location', header('token').isString(), validateRequest, checkToken, async (req, res) => {
  const location = req.params.location
  const locationParts = location.split(':')
  const galaxy = parseInt(locationParts[0], 10)
  const system = parseInt(locationParts[1], 10)

  if (isNaN(galaxy) || isNaN(system)) {
    res.status(400).json({ message: 'Invalid location format: ' + location })
  }

  const phalanxesInRange = []
  const phalanxes = await Phalanx.getAll()
  phalanxes.forEach(phalanx => {
    if (phalanx.isInRange(galaxy, system)) {
      phalanxesInRange.push(phalanx)
    }
  })

  res.json(phalanxesInRange)
})

module.exports = router
