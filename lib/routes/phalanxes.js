const express = require('express')
const { header } = require('express-validator')
const router = express.Router()
const Phalanx = require('../data/phalanx')
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
 * @apiBody {object[]} Phalanxes List of phalanxes
 * @apiBody {int} phalanx.sensor Level of the Sensor Phalanx
 * @apiBody {int} phalanx.moon_id The id of the relevant Moon
 * @apiBody {int} phalanx.galaxy The galaxy the phalanx is in
 * @apiBody {int} phalanx.system The system the phalanx is in
 * @apiBody {int} phalanx.position The position the phalanx has in its system
 *
 * @apiSuccessExample (type="report") {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "sensor": 1,
 *      "moonId": 32493,
 *      "galaxy": 7,
 *      "system": 81,
 *      "position": 7,
 *      "updatedAt": ,
 *    }
 *
 * @apiError Unauthorized The provided token in the header is invalid
 * @apiError InternalServerError Something went wrong. See the error text in the json response
*/
router.get('/v1/phalanxes', header('token').isString(), validateRequest, checkToken, async (req, res) => {
  const phalanxes = await Phalanx.getAll()
  res.json(phalanxes)
})

module.exports = router
