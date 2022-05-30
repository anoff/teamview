const express = require('express')
const { header, validationResult } = require('express-validator')
const router = express.Router()
const Player = require('../data/player')
const Token = require('../data/token')
const logger = require('../logger').child({ module: __filename })

/**
 * @apiDefine Player Player
 * All the api points to interact with players
 */

/**
 * @api {get} /v1/players/:names Get players by their name
 * @apiName GetPlayers
 * @apiGroup Player
 * @apiDescription Returns a list of players
 *
 * @apiHeader {string} content-type='application/json; charset=utf-8' Encode as JSON
 * @apiHeader {string} token A valid API token (starting with `TOKEN_`)
 * @apiParam {string[]} names The names of the players, separated by , if more than one
 * @apiParamExample {string} Example with multiple names
 *        joghurtrucksack,Nero
 *
 * @apiSuccess {object[]} players List of players
 * @apiSuccess {int} players.id The Id of the player
 * @apiSuccess {int} players.playerId The Id of the player
 * @apiSuccess {string} players.name The name of the player
 * @apiSuccess {string} players.alliance The name of the alliance of the player or "" if he has none
 * @apiSuccess {int} players.rank The rank of the player
 * @apiSuccess {int} players.pointsResearch The research points of the player
 * @apiSuccess {int} players.pointsDefense The defense points of the player
 * @apiSuccess {int} players.pointsFleet The fleet points of the player
 * @apiSuccess {int} players.pointsBuilding The building points of the player
 * @apiSuccess {int} players.points The points of the player
 * @apiSuccess {int} players.unitsDestroyed The units the player has destroyed
 * @apiSuccess {int} players.unitsLost The units the player has lost
 * @apiSuccess {int} players.battlesLost The number of battles the player lost
 * @apiSuccess {int} players.battlesWon The number of battles the player won
 * @apiSuccess {int} players.battlesDraw The number of battles the player draw
 *
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *     [
 *       {
 *         "id": 3008,
 *         "playerId": 3008,
 *         "name": "n00n3kn0w5",
 *         "alliance": "The Brotherhood",
 *         "rank": 206,
 *         "pointsResearch": 13476,
 *         "pointsDefense": 15766,
 *         "pointsFleet": 21237,
 *         "pointsBuilding": 60394,
 *         "points": 110873,
 *         "unitsDestroyed": 6007000,
 *         "unitsLost": 2081000,
 *         "battlesLost": 7,
 *         "battlesWon": 2533,
 *         "battlesDraw": 2
 *       },
 *       {
 *         "id": 2726,
 *         "playerId": 2726,
 *         "name": "BlueheartedHummingbird",
 *         "alliance": "",
 *         "rank": 786,
 *         "pointsResearch": 1909,
 *         "pointsDefense": 50,
 *         "pointsFleet": 0,
 *         "pointsBuilding": 9172,
 *         "points": 11131,
 *         "unitsDestroyed": 1707000,
 *         "unitsLost": 9874000,
 *         "battlesLost": 203,
 *         "battlesWon": 124,
 *         "battlesDraw": 4
 *       }
 *     ]
 *
 * @apiError Unauthorized The provided token in the header is invalid
 * @apiError InternalServerError Something went wrong. See the error text in the json response
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
    const ps = await Promise.all(name.split(',').map(async n => await Player.getByName(n)))
    res.json(ps)
  } else {
    const p = await Player.getByName(name)
    logger.info(p, name)
    res.json([p])
  }
})

module.exports = router
