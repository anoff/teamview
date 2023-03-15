/**
 * Convert various game entities to other units.
 */
const { capitalCase } = require('change-case')
const gameUnits = require('./gameUtils.units')

/**
 * Object containing all items with name as key and ingame item id as value.
 * Prefixes: b = building, r = research, res = resources, r = research, sh = ship, def = defense
 */
const itemIds = {
  b_metalMine: 1,
  b_crystalMine: 2,
  b_deuteriumRefinery: 3,
  b_solarPowerPlant: 4,
  b_university: 6,
  b_deuteriumPowerPlant: 12,
  b_robotFactory: 14,
  b_naniteFactory: 15,
  b_shipyard: 21,
  b_metalStorage: 22,
  b_crystalStorage: 23,
  b_deuteriumStorage: 24,
  b_researchLab: 31,
  b_terraformer: 33,
  b_allianceDepot: 34,
  b_moonBase: 41,
  b_phalanxSensor: 42,
  b_jumpgate: 43,
  b_missileSilo: 44,
  // research
  r_spyTechnology: 106,
  r_computerTechnology: 108,
  r_weaponsTechnology: 109,
  r_shieldTechnology: 110,
  r_armourTechnology: 111,
  r_energyTechnology: 113,
  r_hyperspaceTechnology: 114,
  r_combustionEngine: 115,
  r_impulseEngine: 117,
  r_hyperspaceEngine: 118,
  r_laserTechnology: 120,
  r_ionTechnology: 121,
  r_plasmaTechnology: 122,
  r_intergalacticResearchNetwork: 123,
  r_expeditionResearch: 124,
  r_mineralResearch: 131,
  r_semiCrystalsResearch: 132,
  r_fuelResearch: 133,
  r_gravitonResearch: 199,
  // resources
  res_metal: 901,
  res_crystal: 902,
  res_deuterium: 903,
  res_energy: 911,
  // ships
  sh_lightCargo: 202,
  sh_heavyCargo: 203,
  sh_lightFighter: 204,
  sh_heavyFighter: 205,
  sh_cruiser: 206,
  sh_battleship: 207,
  sh_colonyShip: 208,
  sh_recycler: 209,
  sh_spyProbe: 210,
  sh_planetBomber: 211,
  sh_solarSatellite: 212,
  sh_starFighter: 213,
  sh_battleFortress: 214,
  sh_battleCruiser: 215,
  // defenses
  def_missileLauncher: 401,
  def_lightLaserTurret: 402,
  def_heavyLaserTurret: 403,
  def_gaussCannon: 404,
  def_ionCannon: 405,
  def_plasmaCannon: 406,
  def_smallShieldDome: 407,
  def_largeShieldDome: 408,
  def_interceptor: 502,
  def_interplanetaryMissiles: 503
}

// ITEM TO POINTS
const shipValues = {
  lightCargo: {
    metal: 2e3,
    crystal: 2e3,
    deuterium: 0,
    shield: 10,
    armour: 400,
    attack: 5,
    cargo: 5000,
    rapid: {
      spyProbe: 5,
      solarSatellite: 5
    },
    speed: [
      { value: 5e3, tech: 115 },
      {
        value: 10e3,
        tech: 117,
        minLevel: 5
      }
    ]
  },
  heavyCargo: {
    metal: 6e3,
    crystal: 6e3,
    deuterium: 0,
    shield: 25,
    armour: 1200,
    attack: 5,
    cargo: 25e3,
    rapid: {
      spyProbe: 5,
      solarSatellite: 5
    },
    speed: [
      { value: 7500, tech: 115 }
    ]
  },
  lightFighter: {
    metal: 3e3,
    crystal: 1e3,
    deuterium: 0,
    shield: 10,
    armour: 400,
    attack: 50,
    cargo: 50,
    rapid: {
      spyProbe: 5,
      solarSatellite: 5
    },
    speed: [{ value: 12500, tech: 115 }]
  },
  heavyFighter: {
    metal: 6e3,
    crystal: 4e3,
    deuterium: 0,
    shield: 25,
    armour: 1000,
    attack: 150,
    cargo: 100,
    rapid: {
      lightCargo: 3,
      spyProbe: 5,
      solarSatellite: 5
    },
    speed: [{ value: 10e3, tech: 117 }]
  },
  cruiser: {
    metal: 20e3,
    crystal: 7e3,
    deuterium: 2e3,
    shield: 50,
    armour: 2700,
    attack: 400,
    cargo: 800,
    rapid: {
      lightFighter: 6,
      spyProbe: 5,
      solarSatellite: 5,
      missileLauncher: 10
    },
    speed: [{ value: 15e3, tech: 117 }]
  },
  battleship: {
    metal: 45e3,
    crystal: 15e3,
    deuterium: 0,
    shield: 200,
    armour: 6000,
    attack: 1000,
    cargo: 1500,
    rapid: {
      spyProbe: 5,
      solarSatellite: 5
    },
    speed: [{ value: 10e3, tech: 118 }]
  },
  colonyShip: {
    metal: 10e3,
    crystal: 20e3,
    deuterium: 10e3,
    shield: 100,
    armour: 3000,
    attack: 50,
    cargo: 7500,
    rapid: {
      spyProbe: 5,
      solarSatellite: 5
    },
    speed: [{ value: 2500, tech: 117 }]
  },
  recycler: {
    metal: 10e3,
    crystal: 6e3,
    deuterium: 2e3,
    shield: 10,
    armour: 1600,
    attack: 1,
    cargo: 20e3,
    rapid: {
      spyProbe: 5,
      solarSatellite: 5
    },
    speed: [{ value: 2000, tech: 115 }, { value: 4000, tech: 117, minLevel: 17 }, { value: 6000, tech: 118, minLevel: 15 }]
  },
  spyProbe: {
    metal: 0,
    crystal: 1e3,
    deuterium: 0,
    shield: 0,
    armour: 100,
    attack: 0,
    rapid: {},
    cargo: 5,
    speed: [{ value: 100e6, tech: 115 }]
  },
  planetBomber: {
    metal: 50e3,
    crystal: 25e3,
    deuterium: 15e3,
    shield: 500,
    armour: 7500,
    attack: 1000,
    cargo: 500,
    rapid: {
      spyProbe: 5,
      solarSatellite: 5,
      missileLauncher: 20,
      lightLaserTurret: 20,
      heavyLaserTurret: 10,
      ionCannon: 10
    },
    speed: [{ value: 4000, tech: 117 }, { value: 5000, minLevel: 8, tech: 118 }]
  },
  solarSatellite: {
    metal: 0,
    crystal: 2e3,
    deuterium: 500,
    shield: 0,
    armour: 200,
    attack: 0,
    cargo: 0
  },
  starFighter: {
    metal: 60e3,
    crystal: 50e3,
    deuterium: 15e3,
    shield: 500,
    armour: 11e3,
    attack: 2e3,
    cargo: 2e3,
    rapid: {
      spyProbe: 5,
      solarSatellite: 5,
      battleCruiser: 2,
      lightLaserTurret: 10
    },
    speed: [{ value: 5000, tech: 118 }]
  },
  battleFortress: {
    metal: 5e6,
    crystal: 4e6,
    deuterium: 1e6,
    shield: 50e3,
    armour: 900e3,
    attack: 200e3,
    cargo: 1e6,
    rapid: {
      lightCargo: 250,
      heavyCargo: 250,
      lightFighter: 200,
      heavyFighter: 100,
      cruiser: 33,
      battleship: 30,
      colonyShip: 250,
      recycler: 250,
      spyProbe: 1250,
      planetBomber: 25,
      solarSatellite: 1250,
      starFighter: 5,
      battleCruiser: 15,
      missileLauncher: 200,
      lightLaserTurret: 200,
      heavyLaserTurret: 100,
      gaussCannon: 50,
      ionCannon: 100
    },
    speed: [{ level: 100, tech: 118 }]
  },
  battleCruiser: {
    metal: 30e3,
    crystal: 40e3,
    deuterium: 15e3,
    shield: 400,
    armour: 7000,
    attack: 700,
    cargo: 750,
    rapid: {
      lightCargo: 3,
      heavyCargo: 3,
      heavyFighter: 4,
      cruiser: 4,
      battleship: 7,
      spyProbe: 5,
      solarSatellite: 5
    },
    speed: [{ value: 10e3, tech: 118 }]
  }
}

/**
 * Check if a given id is a battleship
 * @param {int} id ship id e.g. 202
 * @returns {boolean} true if id is a battleship
 */
function isBattleship (id) {
  id = parseInt(id)
  return [204, 205, 206, 207, 215, 211, 213, 214].includes(id)
}

const defenseValues = {
  missileLauncher: {
    metal: 2e3,
    crystal: 0,
    deuterium: 0,
    shield: 20,
    armour: 200,
    attack: 80
  },
  lightLaserTurret: {
    metal: 1500,
    crystal: 500,
    deuterium: 0,
    shield: 25,
    armour: 200,
    attack: 100
  },
  heavyLaserTurret: {
    metal: 6000,
    crystal: 2000,
    deuterium: 0,
    shield: 100,
    armour: 800,
    attack: 250
  },
  gaussCannon: {
    metal: 20e3,
    crystal: 15e3,
    deuterium: 2e3,
    shield: 200,
    armour: 3500,
    attack: 1100
  },
  ionCannon: {
    metal: 5e3,
    crystal: 3e3,
    deuterium: 0,
    shield: 500,
    armour: 800,
    attack: 150
  },
  plasmaCannon: {
    metal: 50e3,
    crystal: 50e3,
    deuterium: 30e3,
    shield: 300,
    armour: 10e3,
    attack: 3000
  },
  smallShieldDome: {
    metal: 10e3,
    crystal: 10e3,
    deuterium: 0,
    shield: 2000,
    armour: 2000,
    attack: 1
  },
  largeShieldDome: {
    metal: 50e3,
    crystal: 50e3,
    deuterium: 0,
    shield: 10e3,
    armour: 10e3,
    attack: 1
  },
  interceptor: {
    metal: 8e3,
    crystal: 0,
    deuterium: 2e3,
    shield: 1,
    armour: 800,
    attack: 1
  },
  interplanetaryMissiles: {
    metal: 12500,
    crystal: 2500,
    deuterium: 10e3,
    shield: 1,
    armour: 15e2,
    attack: 12e3
  }
}

const obj2StructurePoints = obj => Object.keys(obj).map(k => {
  const r = {}
  r[k] = obj[k].metal + obj[k].crystal
  return r
})
  .reduce((p, c) => Object.assign(p, c), {})

const shipStructurePoints = obj2StructurePoints(shipValues)
const defenseStructurePoints = obj2StructurePoints(defenseValues)

/**
 * Convert itemIds, shipValues and defenseValues into a Map(id -> values)
 */
function getStatsByItemId () {
  const stats = new Map()
  for (const [k, v] of Object.entries(itemIds)) {
    const name = k.split('_').slice(1).join('_')
    const data = {}
    if (v >= 200 && v < 300) {
      Object.assign(data, shipValues[name])
      // convert rapidfire names to ship ids
      for (const [rfN, rfV] of Object.entries(data.rapid || {})) {
        const rfId = itemIds[`sh_${rfN}`] || itemIds[`def_${rfN}`]
        data.rapid[rfId] = rfV
        delete data.rapid[rfN]
      }
    } else if (v >= 400 && v < 500) {
      Object.assign(data, defenseValues[name])
    }

    data.name = name
    stats.set(v, data)
  }
  return id => stats.get(parseInt(id))
}
/** Costs & battle stats of each ship/defense unit, by id. */
const getUnitStatsById = getStatsByItemId()

/**
 * Returns common name for given ingame entity id, e.g. 202 => 'lightCargo'
 * @param {int} id unit, tech, building id
 */
function itemId2name (id) {
  id = parseInt(id)
  const item = Object.entries(itemIds).find(e => e[1] === id)
  if (!item) return ''
  return item[0].split('_').slice(1).join('_')
}

// RESOURCES
/**
 * Calculate the resources created per hour, assuming 100% production and energy.
 * @param {'metal'|'crystal'|'deuterium'} mineType Which mine to calculate
 * @param {Number} mineLevel The level of the mine
 * @param {Number} planetPosition Planet position (relevant for deuterium), defaults to 8
 * @returns {Number} the amount of resources per hour
 */
function calculateHourlyMineProduction (mineType, mineLevel, planetPosition) {
  let result = 0
  let coefficient = 0

  if (mineType === 'metal') {
    coefficient = 30
  } else if (mineType === 'crystal') {
    coefficient = 20
  }

  if ((mineType === 'metal') || (mineType === 'crystal')) {
    result = Math.round(coefficient * mineLevel * Math.pow(1.1, mineLevel))
  } else if (mineType === 'deuterium') {
    coefficient = 10
    result = Math.round(coefficient * mineLevel * Math.pow(1.1, mineLevel) * (1.28 - 0.002 * getAverageMaxTemperature(planetPosition)))
  } else {
    return -1
  }

  return result
}

/**
 * Get the average maximum temperature for a given planet position.
 * @param {int} position Planet position in the system
 * @returns int average of maximum temperature
 */
function getAverageMaxTemperature (position) {
  const listAverageMaxTemperature = [240, 190, 140, 90, 80, 70, 60, 50, 40, 30, 20, 10, -30, -70, -110]
  const AverageMaxTemperature = listAverageMaxTemperature[position - 1]
  return AverageMaxTemperature
}

/** Object of mission types with key being the ingame id and name being the english mission name. */
const missionTypes = {
  // see https://codeberg.org/pr0game/pr0game/src/branch/development/includes/constants.php#L260
  1: 'attack',
  2: 'acs',
  3: 'transport',
  4: 'deploy',
  5: 'hold',
  6: 'spy',
  7: 'colonize',
  8: 'recycle',
  9: 'destroy',
  10: 'missile_attack',
  15: 'expo',
  16: 'trade',
  17: 'transfer'
}

// FORMATTING
/**
 * Format number of resources to thousands.
 * @param {int} value resource amount
 * @returns string formatted as '23.1k'
 */
function res2str (value) {
  value = isNaN(value) ? 0 : value
  return `${Math.floor(value / 100) / 10}k`
}
/**
 * Concatenate all items in an object with <br> for simple HTML print.
 * @param {Object} obj any object
 * @returns string containing all key: value items
 */
function obj2str (obj) {
  let str = ''
  for (const key in obj) {
    str += `${capitalCase(key)}: ${obj[key]}<br>`
  }
  return str
}

/**
 * Calculates the maximum speed of a ship based on its type and engine levels.
 * @param {string} shipType - The type of ship.
 * @param {object} engines - The levels of the ship's engines.
 * @param {number} engines.combustionEngine - The level of the combustion engine.
 * @param {number} engines.impulseEngine - The level of the impulse engine.
 * @param {number} engines.hyperspaceEngine - The level of the hyperspace engine.
 * @returns {number} The maximum speed of the ship.
 */
function calculateShipSpeed (shipType, engines = { combustionEngine: 0, impulseEngine: 0, hyperspaceEngine: 0 }) {
  engines = {
    115: { level: engines.combustionEngine, factor: 0.1 },
    117: { level: engines.impulseEngine, factor: 0.2 },
    118: { level: engines.hyperspaceEngine, factor: 0.2 }
  }

  const speeds = []
  shipValues[shipType].speed.forEach(speed => {
    const { value, tech } = speed
    const factor = engines[tech].factor
    const level = engines[tech].level
    if ('minLevel' in speed && speed.minLevel > level) return
    speeds.push(value * (1 + (level * factor)))
  })

  return Math.max(...speeds)
}

module.exports = {
  calculateHourlyMineProduction,
  defenseStructurePoints,
  defenseValues,
  gameUnits,
  getUnitStatsById,
  itemId2name,
  itemIds,
  isBattleship,
  missionTypes,
  obj2str,
  res2str,
  calculateShipSpeed,
  shipStructurePoints,
  shipValues
}
