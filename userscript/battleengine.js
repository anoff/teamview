const gameUtils = require('./gameUtils')

function calculateAttack (attackers, defenders, debugLog = false) {
  const FLEET2DF = 0.4
  const DEF2DF = 0
  const MAX_ROUNDS = 6

  // calculate resources at start of the game
  const resourcesInFight = {
    attacker: {
      total: 0,
      metal: 0,
      crystal: 0,
      deuterium: 0
    },
    defender: {
      total: 0,
      metal: 0,
      crystal: 0,
      deuterium: 0
    }
  }
  for (const fleet of attackers) {
    for (const [id, count] of Object.entries(fleet.unitsById)) {
      const stats = gameUtils.getUnitStatsById(id)
      resourcesInFight.attacker.metal += stats.metal * count
      resourcesInFight.attacker.crystal += stats.crystal * count
      resourcesInFight.attacker.deuterium += stats.deuterium * count
    }
  }

  let defenseSnapshot = null
  for (const fleet of defenders) {
    for (const [id, count] of Object.entries(fleet.unitsById)) {
      const stats = gameUtils.getUnitStatsById(id)
      resourcesInFight.attacker.metal += stats.metal * count
      resourcesInFight.attacker.crystal += stats.crystal * count
      resourcesInFight.attacker.deuterium += stats.deuterium * count
      // snapshot of the defenses at start
      if (id >= 400 && defenseSnapshot === null) {
        defenseSnapshot = Object.assign({}, fleet.unitsById)
        for (const key in defenseSnapshot) {
          if (key < 400) delete defenseSnapshot[key]
        }
      }
    }
  }

  // initialize fleet units
  for (const fleet of attackers.concat(defenders)) {
    fleet.spawnUnits()
  }

  if (debugLog) {
    console.log('Attackers:')
    attackers.forEach(f => console.log(`${f.slot}: Weapons=${f.battleTechs.weapons}, Shield=${f.battleTechs.shield}, Armor=${f.battleTechs.armor}`))
    console.log('Defenders:')
    defenders.forEach(f => console.log(`${f.slot}: Weapons=${f.battleTechs.weapons}, Shield=${f.battleTechs.shield}, Armor=${f.battleTechs.armor}`))
  }
  // start fighting
  const roundStats = []
  let round = 0
  for (round = 1; round <= MAX_ROUNDS; round++) {
    const attackersPower = attackers.reduce((p, f) => p + f.attackPower, 0)
    const defendersPower = defenders.reduce((p, f) => p + f.attackPower, 0)
    if (attackersPower <= 0 || defendersPower <= 0) {
      round -= 1
      break
    }
    const stats = fight(attackers, defenders)
    roundStats.push(stats)
    for (const fleet of attackers.concat(defenders)) {
      fleet.destroy()
      fleet.restoreShields()
    }
    const attackersCount = attackers.reduce((p, f) => p + f.unitCount, 0)
    const defendersCount = defenders.reduce((p, f) => p + f.unitCount, 0)
    if (debugLog) {
      console.log(`Round ${round}:`)
      console.log(`Attackers deals ${stats.statsAttacker.totalDamage} total damage, ${stats.statsAttacker.absorbedByShields} absorbed by enemy shields`)
      console.log(`Defenders deals ${stats.statsDefender.totalDamage} total damage, ${stats.statsDefender.absorbedByShields} absorbed by enemy shields`)
      console.log(`Remaining units: Attackers=${attackersCount} Defenders=${defendersCount}`)
      const attackersLost = attackers.reduce((p, c) => Fleet.sumUnitsById(p, c.lostUnitsById), {})
      const attackersLostStr = Object.entries(attackersLost)
        .map(elm => `${gameUtils.getUnitStatsById(elm[0]).name}=${elm[1]}`)
        .join(', ')
      const defendersLost = defenders.reduce((p, c) => Fleet.sumUnitsById(p, c.lostUnitsById), {})
      const defendersLostStr = Object.entries(defendersLost)
        .map(elm => `${gameUtils.getUnitStatsById(elm[0]).name}=${elm[1]}`)
        .join(', ')
      console.log(`Attacker lost: ${attackersLostStr}`)
      console.log(`Defenders lost: ${defendersLostStr}`)
    }
  }

  function calculateLosses (attackers, defenders) {
    const stats = {
      attackers: {
        lostUnits: {},
        lostRes: { metal: 0, crystal: 0, deuterium: 0 },
        debris: { metal: 0, crystal: 0, deuterium: 0 }
      },
      defenders: {
        lostUnits: {},
        lostRes: { metal: 0, crystal: 0, deuterium: 0 },
        debris: { metal: 0, crystal: 0, deuterium: 0 }
      }
    }
    // calculate losses & debris field
    function calcLostUnits (fleets) {
      return fleets.reduce((p, fleet) => Fleet.sumUnitsById(p, fleet.lostUnitsById), {})
    }
    stats.attackers.lostUnits = calcLostUnits(attackers)
    stats.defenders.lostUnits = calcLostUnits(defenders)
    function calcLostRes (lostUnits) {
      return Object.keys(lostUnits)
        .reduce((p, id) => {
          const stats = gameUtils.getUnitStatsById(id)
          p.metal += stats.metal * lostUnits[id]
          p.crystal += stats.crystal * lostUnits[id]
          p.deuterium += stats.deuterium * lostUnits[id]
          return p
        }, { metal: 0, crystal: 0, deuterium: 0 })
    }
    stats.attackers.lostRes = calcLostRes(stats.attackers.lostUnits)
    stats.defenders.lostRes = calcLostRes(stats.defenders.lostUnits)

    function calcDebris (lostUnits) {
      const debris = Object.keys(lostUnits)
        .reduce((p, id) => {
          const stats = gameUtils.getUnitStatsById(id)
          p.metal += stats.metal * lostUnits[id] * (id < 400 ? FLEET2DF : DEF2DF)
          p.crystal += stats.crystal * lostUnits[id] * (id < 400 ? FLEET2DF : DEF2DF)
          return p
        }, { metal: 0, crystal: 0 })
      return debris
    }
    stats.attackers.debris = calcDebris(stats.attackers.lostUnits)
    stats.defenders.debris = calcDebris(stats.defenders.lostUnits)
    stats.debris = {
      metal: stats.attackers.debris.metal + stats.defenders.debris.metal,
      crystal: stats.attackers.debris.crystal + stats.defenders.debris.crystal
    }
    return stats
  }

  // define winner
  const attackersPower = attackers.reduce((p, f) => p + f.attackPower, 0)
  const defendersPower = defenders.reduce((p, f) => p + f.attackPower, 0)
  let winner = 'draw'
  if (attackersPower <= 0 && defendersPower > 0) {
    winner = 'defender'
  } else if (attackersPower > 0 && defendersPower <= 0) {
    winner = 'attacker'
  }

  const losses = calculateLosses(attackers, defenders)
  if (debugLog) {
    console.log(`Done fighting ${round}/${MAX_ROUNDS} rounds`)
    console.log(`Winner: ${winner}`)
    console.log(`Attackers lost: ${losses.attackers.lostRes.metal + losses.attackers.lostRes.crystal} units`)
    console.log(`Defenders lost: ${losses.defenders.lostRes.metal + losses.defenders.lostRes.crystal} units`)
    console.log('\n')
  }

  return {
    winner,
    losses,
    roundStats
  }
}
module.exports.calculateAttack = calculateAttack

/**
 * Fight one round.
 * @param {[Fleet]} attackers list of attacker Fleets
 * @param {[Fleet]} defenders list of defender Fleets
 */
function fight (attackers, defenders) {
  const statsAttacker = { totalDamage: 0, absorbedByShields: 0 }
  const statsDefender = { totalDamage: 0, absorbedByShields: 0 }

  for (const fleet of attackers) {
    for (const unit of fleet.units) {
      shoot(unit, defenders, statsAttacker)
    }
  }

  for (const fleet of defenders) {
    for (const unit of fleet.units) {
      shoot(unit, attackers, statsDefender)
    }
  }

  return {
    statsAttacker,
    statsDefender
  }
}
module.exports.fight = fight

/**
 * Fire shot of a single ship against opposing fleets.
 * Check for rapidfire and shoot again if possible.
 * Checks for explosion on target ship.
 * PHP code _attackers_ is not needed for sim-only
 * @param {Unit} unit the firing unit
 * @param {[Fleet]} enemies array containing all target Fleets
 * @param {Object[string,int]} shooterStats stats for totalDamage and absorbedByShield
 */
function shoot (unit, enemies, shooterStats) {
  const enemyUnitCount = enemies
    .map(f => f.unitCount)
    .reduce((p, c) => p + c, 0)
  const randomEnemyUnitIx = Math.round(Math.random() * (enemyUnitCount - 1))

  // select target unit
  let unitCount = 0
  let victimUnit = null
  for (const fleet of enemies) {
    unitCount += fleet.unitCount
    if (randomEnemyUnitIx < unitCount) {
      const victimUnitIx = Math.round(Math.random() * (fleet.unitCount - 1))
      victimUnit = fleet.units[victimUnitIx]
      break
    }
  }

  // deal damage to shield/armor
  shooterStats.totalDamage += unit.attack
  if (unit.attack * 100 > victimUnit.shield) {
    const penetration = unit.attack - victimUnit.shield
    if (penetration >= 0) {
      // shields penetrated
      shooterStats.absorbedByShields += victimUnit.shield
      victimUnit.shield = 0
      victimUnit.armor -= penetration
    } else {
      shooterStats.absorbedByShields += unit.attack
      victimUnit.shield -= unit.attack
    }

    // check explosion
    if (victimUnit.isShip() && !victimUnit.isExploded) {
      if (victimUnit.armor > 0 && victimUnit.armor < 0.7 * victimUnit.fullArmor) {
        const boom = Math.random() > victimUnit.armor / victimUnit.fullArmor
        if (boom) {
          victimUnit.isExploded = true
        }
      }
    }
  } // else bounce off of shields

  // check for rapidfire
  const rapidFire = gameUtils.getUnitStatsById(unit.id)?.rapid?.[victimUnit.id]
  if (rapidFire > 0) {
    const chance = Math.random()
    if (chance < (rapidFire - 1) / rapidFire) { // TODO: check if this is the same chance as the php implementation of `rand(0, $count) < $count`
    // if (Math.round(Math.random() * rapidFire) < rapidFire) { // PHP-like implementation
      shoot(unit, enemies, shooterStats)
    }
  }
}

class BattleTechs {
  constructor (weapons, shield, armor) {
    this.weapons = weapons
    this.shield = shield
    this.armor = armor
    this.bonus = {
      weapons: 1 + 0.1 * weapons,
      shield: 1 + 0.1 * shield,
      armor: 1 + 0.1 * armor
    }
  }
}
module.exports.BattleTechs = BattleTechs

class EngineTechs {
  constructor (combustion, impulse, hyperspace) {
    this.combustion = combustion
    this.impulse = impulse
    this.hyperspace = hyperspace
    this.bonus = {
      combustion: 1 + 0.1 * combustion,
      impulse: 1 + 0.2 * impulse,
      hyperspace: 1 + 0.3 * hyperspace
    }
  }
}
module.exports.EngineTechs = EngineTechs

class Player {
  constructor (id, name, battleTechs, engineTechs) {
    this.id = id
    this.name = name
    this.battleTechs = battleTechs
    this.engineTechs = engineTechs
  }
}
module.exports.Player = Player

class Location {
  constructor (galaxy, system, position, isMoon) {
    this.galaxy = galaxy
    this.system = system
    this.position = position
    this.isMoon = isMoon
  }
}
module.exports.Location = Location

class Unit {
  isExploded = false
  constructor (unitId, attack, shield, armor) {
    this.id = unitId
    this.shield = shield
    this.armor = armor
    this.attack = attack
    this.fullArmor = armor
    this.fullShield = shield
  }

  isShip () {
    const id = parseInt(this.id)
    return id >= 200 && id < 300
  }
}
module.exports.Unit = Unit

class Fleet {
  unitsById = {}
  lostUnitsById = {}
  units = []
  unitCount = 0

  constructor (battleTechs, slot = 0) {
    this.slot = slot
    this.battleTechs = battleTechs
  }

  /**
   * Add a number of one specific unit (ship or defense) id to the fleet.
   * @param {int} unitId The unit id to add e.g. 204 for light fighter
   * @param {int} count number of units of this id in the fleet
   */
  addUnitId (unitId, count) {
    if (unitId < 200 || unitId >= 500) return
    if (this.unitsById[unitId] === undefined) this.unitsById[unitId] = 0
    this.unitsById[unitId] += count
    this.unitCount += count
  }

  /**
   * Populate the .units property with one unit for each count of .unitsById.
   * Does nothing if .units already has elements.
   */
  spawnUnits () {
    if (this.units.length > 0) return
    for (const [id, count] of Object.entries(this.unitsById)) {
      for (let i = count; i > 0; i--) {
        const stats = gameUtils.getUnitStatsById(id)
        const bonus = this.battleTechs.bonus
        const unit = new Unit(parseInt(id), stats.attack * bonus.weapons, stats.shield * bonus.shield, stats.armour * bonus.armor)
        this.units.push(unit)
      }
    }
  }

  /**
   * Restore shield of each unit to full power.
   */
  restoreShields () {
    for (let i = this.units.length - 1; i >= 0; i--) {
      const unit = this.units[i]
      this.units[i].shield = unit.fullShield
    }
  }

  /**
   * Remove destroyed units.
   */
  destroy () {
    for (let i = this.units.length - 1; i >= 0; i--) {
      const unit = this.units[i]
      if (unit.armor <= 0 || unit.isExploded) {
        this.units.splice(i, 1)
        this.unitCount -= 1
        this.unitsById[unit.id] -= 1
        if (this.lostUnitsById[unit.id] === undefined) this.lostUnitsById[unit.id] = 0
        this.lostUnitsById[unit.id] += 1
      }
    }
  }

  get attackPower () {
    let attack = 0
    for (const [id, count] of Object.entries(this.unitsById)) {
      const stats = gameUtils.getUnitStatsById(id)
      const techBoost = this.battleTechs.bonus.weapons
      attack += stats.attack * techBoost * count
    }
    return attack
  }

  /**
   * Sum up two unit count objects.
   * @param {object} obj1 an object listing fleet unit count by id { '204': 4 }
   * @param {object} obj2 an object listing fleet unit count by id { '204': 4 }
   */
  static sumUnitsById (obj1, obj2) {
    const result = {}
    Object.assign(result, obj1)
    for (const [id, count] of Object.entries(obj2)) {
      if (result[id] === undefined) result[id] = 0
      result[id] += count
    }
    return result
  }
}

module.exports.Fleet = Fleet
