const express = require('express')
const { body, header, validationResult } = require('express-validator')
const router = express.Router()
const Planet = require('../data/planet')
const Player = require('../data/player')
const Report = require('../data/report')
const Token = require('../data/token')
const logger = require('../logger').child({ module: __filename })

/**
 * @apiDefine Planet Planet
 * All the api points to interact with planets
 */

/**
 * @api {post} /v1/planets Upload planet data
 * @apiName UploadPlanets
 * @apiGroup Planet
 * @apiDescription Stores a list of planets
 *
 * @apiHeader {string} content-type='application/json; charset=utf-8' Encode as JSON
 * @apiHeader {string} token A valid API token (starting with `TOKEN_`)
 * @apiBody {object[]} planets List of planets
 * @apiBody {int} planets.planetId Ingame ID of the planet
 * @apiBody {string} planets.planetName The name of the planet
 * @apiBody {string} planets.playerName The name of the player owning this planet
 * @apiBody {int} planets.playerId Ingame ID of the player, -1 if unknown
 * @apiBody {string='longinactive'|'inactive'|'banned'|'vacation'} planets.playerStatus A list of status attributes (longinactive, inactive, banned, vacation)
 * @apiBody {int} planets.galaxy The galaxy the planet is in
 * @apiBody {int} planets.system The system the planet is in
 * @apiBody {int} planets.position The position the planet has in its system
 * @apiBody {int} planets.moonId Ingame ID of the moon, 0 if there is none
 * @apiBody {int} planets.debrisMetal The metal in this debris field (0 if there is none)
 * @apiBody {int} planets.debrisCrystal The crystal in this debris field (0 if there is none)
 *
 * @apiSuccessExample {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "message": "Data saved",
 *      "successCount": 8,
 *      "totalCount": 10
 *    }
 *
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500
 *    {
 *      "message": "Failed to save planets",
 *      "successCount": 0,
 *      "totalCount": 10
 *    }
 * @apiError Unauthorized The provided token in the header is invalid
 * @apiError InternalServerError Something went wrong. See the error text in the json response
*/
router.post('/v1/planets', body('planets').isArray(), header('token').isString(), async (req, res) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() })
  }
  const token = req.headers.token
  const planets = req.body.planets
  if (!token || !await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }

  let successCount = 0
  const errors = []
  for (const planetData of planets) {
    const playerName = planetData.playerName
    let playerId = planetData.playerId
    // update player status
    if (playerId === -1) {
      const player = await Player.getByName(playerName)
      if (player.playerId > -1) {
        playerId = player.playerId
      }
    }
    if (playerId > -1) {
      const player = await Player.getById(playerId)
      player.isBanned = false
      player.isVacation = false
      player.isInactive = 0
      // update player status
      if (planetData.playerStatus.includes('inactive')) {
        player.isInactive = 1
      } else if (planetData.playerStatus.includes('longinactive')) {
        player.isInactive = 2
      } else {
        player.isInactive = 0
      }
      if (planetData.playerStatus.includes('banned')) {
        player.isBanned = true
      }
      if (planetData.playerStatus.includes('vacation')) {
        player.isVacation = true
      }
      await player.save()
    }
    planetData.playerId = playerId

    let planet = await Planet.getByPlanetId(planetData.planetId)
    if (!planet?.id) {
      const p = await Planet.getByLocation(planetData.galaxy, planetData.system, planetData.position)
      if (p[0]) {
        planet = p[0]
      }
    }
    if (playerId > -1) {
      const p = new Planet(planetData)
      if (planet?.id > -1) {
        p.id = planet.id
      }
      // logger.info({ planet: p }, 'Found player for planet, updating database.')
      try {
        await p.save()
        successCount += 1
      } catch (e) {
        logger.error(e)
        errors.push(e)
      }
    } else {
      logger.warn({ playerName: planetData.playerName }, 'Could not find player with this name in the database')
    }
  }
  const totalCount = planets.length
  if (successCount === 0 && totalCount > 0) {
    logger.error({ errors, successCount, totalCount }, 'Failed to store planets in database')
    return res.status(500).json({ message: 'Failed to save planets', successCount, totalCount })
  }
  logger.info({ errors, successCount, totalCount }, 'Stored planets in database')
  res.json({ message: 'Data saved', successCount, totalCount })
})

/**
 * @api {get} /v1/planets/:locations?type={type} Get planets by location
 * @apiName GetPlanets
 * @apiGroup Planet
 * @apiDescription Returns a list of planets
 *
 * @apiHeader {string} content-type='application/json; charset=utf-8' Encode as JSON
 * @apiHeader {string} token A valid API token (starting with `TOKEN_`)
 * @apiParam {string} locations The location of the planets in format GALAXY:SYSTEM:LOCATION separated by `,` if multiple
 * @apiQuery {string='report'|''} type The type of planet list
 * @apiSuccessExample (type="report") {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "id": 759,
 *      "planetId": null,
 *      "moonId": 0,
 *      "planetName": "Hauptplanet",
 *      "galaxy": 7,
 *      "system": 81,
 *      "position": 7,
 *      "debrisMetal": 0,
 *      "debrisCrystal": 0,
 *      "playerId": 2482,
 *      "report": {
 *        "date": ,
 *        "resources": {
 *          "metal": 123,
 *          "crystal": 456,
 *          "deuterium" 789,
 *        },
 *        "buildings": {
 *          "metalMine": 24,
 *          "crystalMine": 20,
 *          "solarPowerPlant": 26
 *        },
 *        "ships": {},
 *        "research": {},
 *        "defense": {},
 *        "galaxy": 7,
 *        "system": 1,
 *        "position": 8,
 *        "reportId": 12345
 *      }
 *    }
 *
 * @apiError Unauthorized The provided token in the header is invalid
 * @apiError InternalServerError Something went wrong. See the error text in the json response
 */
router.get('/v1/planets/:location', header('token').isString(), async (req, res) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() })
  }
  const type = req.query.type || 'full'
  const token = req.headers.token
  const location = req.params.location
  if (!await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }
  const p = await Promise.all(location.split(',').map(async l => {
    const [g, s, pos] = l.split(':')
    if (!g || !s) {
      logger.info({ l }, 'Invalid location request.')
      return res.status(400).json({ message: 'Invalid location requested. Must specify at least galaxy and system.', location: l })
    }
    if (req.query.type === 'report') {
      const [planets, reports] = await Promise.all([await Planet.getByLocation(g, s, pos, type), await Report.getByLocation(g, s, pos, 'latest')])
      for (const p of planets) {
        const report = reports.find(e => e.galaxy === p.galaxy && e.system === p.system && e.position === p.position)
        if (report) {
          p.report = report
        }
      }
      return planets
    } else {
      const planets = await Planet.getByLocation(g, s, pos, type)
      return planets
    }
  }))
  res.json(p.flat(1))
})

/**
 * @api {get} /v1/planets Search for planets
 * @apiName SearchPlanets
 * @apiGroup Planet
 * @apiDescription Returns a list of planets
 *
 * @apiHeader {string} content-type='application/json; charset=utf-8' Encode as JSON
 * @apiHeader {string} token A valid API token (starting with `TOKEN_`)
 * @apiQuery {string="exists",""} type The type of planet list
 * @apiSuccessExample (type="exists") {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    {
 *      "g": 7,
 *      "s": 81,
 *      "p": 7
 *    }
 *
 * @apiError Unauthorized The provided token in the header is invalid
 * @apiError InternalServerError Something went wrong. See the error text in the json response
 */
router.get('/v1/planets', header('token').isString(), async (req, res) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() })
  }
  const token = req.headers.token
  if (!await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }
  const response = await Planet.search(req.query)
  if (req.query?.type === 'exists') {
    res.json(response.map(e => {
      return { g: e.galaxy, s: e.system, p: e.position, d: e.updatedAt }
    }))
  } else {
    res.json(response)
  }
})

/**
 * @api {delete} /v1/planets/:location Delete a planet
 * @apiName DeletePlanet
 * @apiGroup Planet
 * @apiDescription Delete a planet from the database
 *
 * @apiHeader {string} content-type='application/json; charset=utf-8' Encode as JSON
 * @apiHeader {string} token A valid API token (starting with `TOKEN_`)
 * @apiParam {string} location The location of the planet in format GALAXY:SYSTEM:LOCATION
 *
 * @apiError Unauthorized The provided token in the header is invalid
 * @apiError InternalServerError Something went wrong. See the error text in the json response
 */
router.delete('/v1/planets/:location', header('token').isString(), async (req, res) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() })
  }
  const token = req.headers.token
  const location = req.params.location
  if (!await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }
  const [g, s, pos] = location.split(':')
  const planets = await Planet.getByLocation(g, s, pos) // hopefully only one..
  let deleteCount = 0
  for (const p of planets) {
    await p.delete()
    deleteCount += 1
  }
  res.json({ message: 'OK', deleteCount })
})
module.exports = router
