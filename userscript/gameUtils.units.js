class Unit {
  /**
   * A basic ingame Unit.
   * @param {int} id unit id e.g. 202
   * @param {string} name simple unit name e.g. lightCargo
   * @param {Cost} cost instance of Cost for (initial) building cost
   */
  constructor (id, name, cost) {
    this.id = parseInt(id)
    this.name = name
    this.cost = cost
  }

  get type () {
    switch (Math.floor(this.id / 100)) {
      case 0:
        return 'building'
      case 1:
        return 'tech'
      case 2:
        return 'ship'
      case 4:
        return 'defense'
      case 9:
        return 'resource'
      default:
        return 'unknown'
    }
  }

  get isShip () {
    return this.type === 'ship'
  }

  get isDefense () {
    return this.type === 'defense'
  }

  hasRapidFire (targetId) {
    targetId = parseInt(targetId)
    if (!this.rapidFires || this.rapidFires.length === 0) return false
    return this.rapidFires.filter(e => e.targetId === targetId).length > 0
  }
}

class Units {
  units = []
  constructor (units = []) {
    this.units = []
    units.forEach(s => this.addUnit(s))
  }

  /**
   * Add a unit to the collection
   * @param {Unit} unit a single ingame unit
   */
  addUnit (unit) {
    this.units.push(unit)
  }

  /**
   * Add several units at once.
   * @param {Array<Unit>} units multiple units
   */
  addUnits (units) {
    units.forEach(u => this.addUnit(u))
  }

  /**
   * Retrieve single unit by its id
   * @param {int} id ingame id e.g. 202
   * @returns {Unit} the unit with the given id
   */
  getById (id) {
    id = parseInt(id)
    return this.units.find(u => u.id === id)
  }

  /**
   * Retrieve single ship by its id
   * @param {int} id ingame id e.g. 202
   * @returns {Ship} the unit with the given id
   */
  getShipById (id) {
    id = parseInt(id)
    const unit = this.units.find(u => u.id === id)
    if (unit && unit.isShip) return unit
  }
}

class Ship extends Unit {
  constructor (id, name, cost, shield, attack, cargo, rapidFires, speeds) {
    super(id, name, cost)
    this.shield = shield
    this.attack = attack
    this.cargo = cargo
    this.rapidFires = rapidFires
    this.speeds = speeds
  }

  get armor () {
    return (this.cost.metal + this.cost.crystal) / 10
  }
}

class Cost {
  constructor (metal, crystal, deuterium) {
    this.metal = metal
    this.crystal = crystal
    this.deuterium = deuterium
  }
}

class Speed {
  constructor (value, tech, minLevel = 0) {
    this.value = value
    this.tech = tech
    this.minLevel = minLevel
  }
}

class RapidFire {
  constructor (targetId, value) {
    this.targetId = targetId
    this.value = value
  }
}
const RF = RapidFire

class Defense extends Unit {
  constructor (id, name, cost, shield, attack) {
    super(id, name, cost)
    this.shield = shield
    this.attack = attack
  }

  get armor () {
    return (this.cost.metal + this.cost.crystal) / 10
  }
}

const spioSatRF = [new RF(210, 5), new RF(212, 5)]
const ships = [
  new Ship(202, 'lightCargo', new Cost(2000, 2000, 0), 10, 5, 5000, spioSatRF, [new Speed(5e3, 115), new Speed(10e3, 117, 5)]),
  new Ship(203, 'heavyCargo', new Cost(6000, 6000, 0), 25, 5, 25e3, spioSatRF, [new Speed(12e3, 115)]),
  new Ship(204, 'lightFighter', new Cost(3000, 1000, 0), 10, 50, 50, spioSatRF, [new Speed(12500, 115)]),
  new Ship(205, 'heavyFighter', new Cost(6000, 4000, 0), 25, 150, 100, [...spioSatRF, new RF(202, 3)], [new Speed(10e3, 117)]),
  new Ship(206, 'cruiser', new Cost(20e3, 7000, 2000), 50, 400, 800, [...spioSatRF, new RF(204, 6), new RF(401, 10)], [new Speed(15e3, 117)]),
  new Ship(207, 'battleship', new Cost(45e3, 15e3, 0), 200, 1000, 1500, spioSatRF, [new Speed(10e3, 118)]),
  new Ship(215, 'battleCruiser', new Cost(30e3, 40e3, 15e3), 400, 700, 750, [...spioSatRF, new RF(202, 3), new RF(203, 3), new RF(205, 4), new RF(206, 4), new RF(207, 7), new RF(210, 5), new RF(212, 5)], [new Speed(10e3, 118)]),
  new Ship(208, 'colonyShip', new Cost(10e3, 20e3, 10e3), 100, 50, 7500, spioSatRF, [new Speed(2500, 117)]),
  new Ship(209, 'recycler', new Cost(10e3, 6e3, 2e3), 10, 1, 20e3, spioSatRF, [new Speed(2000, 115), new Speed(4000, 117, 17), new Speed(6000, 118, 15)]),
  new Ship(210, 'spyProbe', new Cost(0, 1000, 0), 0, 0, 5, [], [new Speed(100e6, 115)]),
  new Ship(211, 'planetBomber', new Cost(50e3, 25e3, 15e3), 500, 1000, 500, [...spioSatRF, new RF(401, 20), new RF(402, 20), new RF(403, 10), new RF(405, 10)], [new Speed(4000, 117), new Speed(5000, 118, 8)]),
  new Ship(212, 'solarSatellite', new Cost(0, 2000, 500), 0, 0, 0, [], []),
  new Ship(213, 'starFighter', new Cost(60e3, 50e3, 15e3), 500, 2000, 2000, [...spioSatRF, new RF(402, 10), new RF(215, 2)], [new Speed(5000, 118)]),
  new Ship(214, 'battleFortress', new Cost(5e6, 4e6, 1e6), 50e3, 200e3, 1e6, [new RF(202, 250), new RF(203, 250), new RF(204, 200), new RF(205, 100), new RF(206, 33), new RF(207, 30), new RF(208, 250), new RF(209, 250), new RF(210, 1250), new RF(211, 25), new RF(212, 1250), new RF(213, 5), new RF(215, 15), new RF(401, 200), new RF(402, 200), new RF(403, 100), new RF(404, 50), new RF(405, 100)], [new Speed(100, 118)])
]

const defense = [
  new Defense(401, 'missileLauncher', new Cost(2000, 0, 0), 20, 80),
  new Defense(402, 'lightLaserTurret', new Cost(1500, 500, 0), 25, 100),
  new Defense(403, 'heavyLaserTurret', new Cost(6000, 2000, 0), 100, 250),
  new Defense(404, 'gaussCannon', new Cost(20e3, 15e3, 2000), 200, 1100),
  new Defense(405, 'ionCannon', new Cost(5000, 3000, 0), 500, 150),
  new Defense(406, 'plasmaCannon', new Cost(50e3, 50e3, 30e3), 300, 3000),
  new Defense(407, 'smallShieldDome', new Cost(10e3, 10e3, 0), 2000, 1),
  new Defense(408, 'largeShieldDome', new Cost(50e3, 50e3, 0), 10e3, 1),
  new Defense(502, 'interceptor', new Cost(8000, 0, 2000), 1, 1),
  new Defense(503, 'interplanetaryMissiles', new Cost(12500, 2500, 10e3), 1, 12e3)

]

/**
 *  Units instance containing all ingame ships
 */
const units = new Units(ships)
units.addUnits(defense)

module.exports = units
