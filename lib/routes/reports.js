const express = require('express')
const { body, header, validationResult } = require('express-validator')
const router = express.Router()
const Report = require('../data/report')
const Token = require('../data/token')
const logger = require('../logger').child({ module: __filename })

/**
 * @apiDefine Report Report
 * All the api points to interact with reports
 */

/**
 * @api {post} /v1/reports Upload reports
 * @apiName UploadReports
 * @apiGroup Report
 * @apiDescription Stores a list of reports
 *
 * @apiHeader {string} content-type='application/json; charset=utf-8' Encode as JSON
 * @apiHeader {string} token A valid API token (starting with `TOKEN_`)
 * @apiBody {object} reports The list of reports
 * @apiBody {int} reports.reportId The id of the report
 * @apiBody {string} reports.reportType The type of the report
 * @apiBody {int} reports.galaxy The galaxy the planet is in
 * @apiBody {int} reports.system The system the planet is in
 * @apiBody {int} reports.position The position the planet has in its system
 * @apiBody {date} reports.date The time this report was generated
 * @apiBody {object} reports.buildings The list of buildings in this report
 * @apiBody {int} reports.buildings.metalMine Current building level
 * @apiBody {int} reports.buildings.crystalMine Current building level
 * @apiBody {int} reports.buildings.deuteriumRefinery Current building level
 * @apiBody {int} reports.buildings.solarPowerPlant Current building level
 * @apiBody {int} reports.buildings.university Current building level
 * @apiBody {int} reports.buildings.deuteriumPowerPlant Current building level
 * @apiBody {int} reports.buildings.robotFactory Current building level
 * @apiBody {int} reports.buildings.naniteFactory Current building level
 * @apiBody {int} reports.buildings.shipyard Current building level
 * @apiBody {int} reports.buildings.metalStorage Current building level
 * @apiBody {int} reports.buildings.crystalStorage Current building level
 * @apiBody {int} reports.buildings.deuteriumStorage Current building level
 * @apiBody {int} reports.buildings.researchLab Current building level
 * @apiBody {int} reports.buildings.terraformer Current building level
 * @apiBody {int} reports.buildings.allianceDepot Current building level
 * @apiBody {int} reports.buildings.moonBase Current building level
 * @apiBody {int} reports.buildings.phalanxSensor Current building level
 * @apiBody {int} reports.buildings.jumpgate Current building level
 * @apiBody {int} reports.buildings.missileSilo Current building level
 * @apiBody {object} reports.resources The list of resources in this report
 * @apiBody {int} reports.resources.metal The amount of metal on the planet
 * @apiBody {int} reports.resources.crystal The amount of crystal on the planet
 * @apiBody {int} reports.resources.deuterium The amount of deuterium on the planet
 * @apiBody {int} reports.resources.energy The amount of energy on the planet
 * @apiBody {object} reports.ships The list of ships in this report
 * @apiBody {int} reports.ships.lightCargo The number of ships on the planet
 * @apiBody {int} reports.ships.heavyCargo The number of ships on the planet
 * @apiBody {int} reports.ships.lightFighter The number of ships on the planet
 * @apiBody {int} reports.ships.heavyFighter The number of ships on the planet
 * @apiBody {int} reports.ships.cruiser The number of ships on the planet
 * @apiBody {int} reports.ships.battleship The number of ships on the planet
 * @apiBody {int} reports.ships.colonyShip The number of ships on the planet
 * @apiBody {int} reports.ships.recycler The number of ships on the planet
 * @apiBody {int} reports.ships.spyProbe The number of ships on the planet
 * @apiBody {int} reports.ships.planetBomber The number of ships on the planet
 * @apiBody {int} reports.ships.solarSatellite The number of ships on the planet
 * @apiBody {int} reports.ships.starFighter The number of ships on the planet
 * @apiBody {int} reports.ships.battleFortress The number of ships on the planet
 * @apiBody {int} reports.ships.battleCruiser The number of ships on the planet
 * @apiBody {object} reports.defense The list of defense in this report
 * @apiBody {int} reports.defense.missileLauncher The number of defense units on the planet
 * @apiBody {int} reports.defense.lightLaserTurret The number of defense units on the planet
 * @apiBody {int} reports.defense.heavyLaserTurret The number of defense units on the planet
 * @apiBody {int} reports.defense.gaussCannon The number of defense units on the planet
 * @apiBody {int} reports.defense.ionCannon The number of defense units on the planet
 * @apiBody {int} reports.defense.plasmaCannon The number of defense units on the planet
 * @apiBody {int} reports.defense.smallShieldDome The number of defense units on the planet
 * @apiBody {int} reports.defense.largeShieldDome The number of defense units on the planet
 * @apiBody {int} reports.defense.interceptor The number of defense units on the planet
 * @apiBody {int} reports.defense.interplanetaryMissiles The number of defense units on the planet
 * @apiBody {object} reports.research The list of research in this report
 * @apiBody {int} reports.research.spyTechnology Current research level
 * @apiBody {int} reports.research.computerTechnology Current research level
 * @apiBody {int} reports.research.weaponsTechnology Current research level
 * @apiBody {int} reports.research.shieldTechnology Current research level
 * @apiBody {int} reports.research.armourTechnology Current research level
 * @apiBody {int} reports.research.energyTechnology Current research level
 * @apiBody {int} reports.research.hyperspaceTechnology Current research level
 * @apiBody {int} reports.research.combustionEngine Current research level
 * @apiBody {int} reports.research.impulseEngine Current research level
 * @apiBody {int} reports.research.hyperspaceEngine Current research level
 * @apiBody {int} reports.research.laserTechnology Current research level
 * @apiBody {int} reports.research.ionTechnology Current research level
 * @apiBody {int} reports.research.plasmaTechnology Current research level
 * @apiBody {int} reports.research.intergalacticResearchNetwork Current research level
 * @apiBody {int} reports.research.expeditionResearch Current research level
 * @apiBody {int} reports.research.mineralResearch Current research level
 * @apiBody {int} reports.research.semiCrystalsResearch Current research level
 * @apiBody {int} reports.research.fuelResearch Current research level
 * @apiBody {int} reports.research.gravitonResearc Current research level
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
 *      "message": "Failed to save reports",
 *      "successCount": 0,
 *      "totalCount": 10
 *    }
 * @apiError Unauthorized The provided token in the header is invalid
 * @apiError InternalServerError Something went wrong. See the error text in the json response
 */
router.post('/v1/reports', body('reports').isArray(), header('token').isString(), async (req, res) => {
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
  const failedReports = []
  for (const reportData of reports) {
    const r = new Report(reportData, token)
    try {
      await r.save()
      successCount += 1
    } catch (e) {
      logger.error(e)
      errors.push(e)
      failedReports.push(r)
    }
  }
  const totalCount = reports.length
  if (successCount === 0 && totalCount > 0) {
    logger.error({ errors, successCount, totalCount }, 'Failed to store reports in database')
    return res.json(500, { message: 'Failed to save reports', successCount, totalCount })
  }
  logger.info({ errors, successCount, totalCount, failedReports }, 'Stored reports in database')
  res.json({ message: 'Data saved', successCount, totalCount })
})

/**
 * @api {get} /v1/reports?type={type} Get list of reports
 * @apiName GetReports
 * @apiGroup Report
 * @apiDescription Returns a list of reports
 *
 * @apiHeader {string} content-type='application/json; charset=utf-8' Encode as JSON
 * @apiHeader {string} token A valid API token (starting with `TOKEN_`)
 * @apiQuery {string="mine"} type The type of reports
 * @apiSuccess (type="mine") {int[]} reportIds List of IDs the user uploaded
 * @apiSuccessExample (type="mine") {json} Success-Response:
 *    HTTP/1.1 200 OK
 *    [591138, 546978, 491472]
 *
 * @apiError Unauthorized The provided token in the header is invalid
 * @apiError InternalServerError Something went wrong. See the error text in the json response
 */
router.get('/v1/reports', header('token').isString(), async (req, res) => {
  const validationErrors = validationResult(req)
  if (!validationErrors.isEmpty()) {
    return res.status(400).json({ errors: validationErrors.array() })
  }
  const token = req.headers.token
  if (!token || !await Token.isValid(token)) {
    return res.status(401).json({ message: 'Provided token is invalid.' })
  }
  switch (req.query.type) {
    case 'mine':
      // check reports submitted by me
      //    used for coloring reports in message window
      try {
        const t = await Token.getByValue(token)
        const ids = await Report.getReportIdsByTokenId(t.id)
        logger.info({ token }, 'Fetched existing reports')
        res.status(200).json(ids)
      } catch (e) {
        logger.error(e, 'Failed to fetch existing reports')
        return res.status(500).json({ message: 'Failed to fetch existing reports', error: e })
      }
      break
    case 'search':
      try {
        const t = await Token.getByValue(token)
        const response = await Report.search(req.query, t.id)
        res.json(response)
      } catch (e) {
        logger.error(e, 'Failed to search reports')
        return res.status(500).json({ message: 'Failed to search reports', error: e })
      }
  }
}
)

module.exports = router
