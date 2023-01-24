const gameUtils = require('./gameUtils')
// { itemIds, defenseValues, shipValues }

function calculateAttack (attackers, defenders) {
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

  // TODO: Check if any of the fleets has 0 attack power -> instant win
  // start fighting
  const roundStats = []
  for (let round = 0; round <= MAX_ROUNDS; round++) {
    const stats = fight(attackers, defenders)
    roundStats.push(stats)
    for (const fleet of attackers.concat(defenders)) {
      fleet.destroy()
      fleet.restoreShields()
    }
  }
}

/**
 * Fight one round.
 * @param {[Fleet]} attackers list of attacker Fleets
 * @param {[Fleet]} defenders list of defender Fleets
 */
function fight (attackers, defenders) {
  const statsAttacker = new Map({ totalDamage: 0, absorbedByShields: 0 })
  const statsDefender = new Map({ totalDamage: 0, absorbedByShields: 0 })

  for (const fleet of attackers) {
    for (const unit of fleet.units) {
      shoot(fleet.player.id, unit, defenders, statsAttacker)
    }
  }

  for (const fleet of defenders) {
    for (const unit of fleet.units) {
      shoot(fleet.player.id, unit, attackers, statsDefender)
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
 * @param {Map[string,int]} shooterStats stats for totalDamage and absorbedByShield
 */
function shoot (unit, enemies, shooterStats) {
  const enemyUnitCount = enemies
    .map(f => f.unitCount)
    .reduce((p, c) => p + c, 0)
  const randomEnemyUnitIx = Math.round(Math.random() * (enemyUnitCount - 1))

  // select target unit
  let unitCount = 0
  let victimUnit = 0
  for (const fleet of enemies) {
    unitCount += fleet.unitCount
    if (randomEnemyUnitIx < unitCount) {
      const victimUnitIx = Math.round(Math.random() * (fleet.unitCount - 1))
      victimUnit = fleet.units[victimUnitIx]
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
  const rapidFire = gameUtils.getUnitStatsById(unit.id)?.rapid[victimUnit.id]
  if (rapidFire > 0) {
    const chance = Math.random()
    if (chance < (rapidFire - 1) / rapidFire) { // TODO: check if this is the same chance as the php implementation of `rand(0, $count) < $count`
      shoot(unit, enemies, shooterStats)
    }
  }
}

function initCombat (fleet, isFirstInit = false) {

  // init single ships
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
  constructor (unitId, shield, armor, attack) {
    this.id = unitId
    this.shield = shield
    this.armor = armor
    this.attack = attack
    this.fullArmor = armor
  }

  isShip () {
    return this.id >= 200 && this.id < 300
  }
}
module.exports.Unit = Unit

class Fleet {
  unitsById = {}
  units = []
  unitCount = 0

  constructor (player, startLocation, targetLocation) {
    this.player = player
    this.startLocation = startLocation
    this.targetLocation = targetLocation
  }

  /**
   * Add a number of one specific unit (ship or defense) id to the fleet.
   * @param {int} unitId The unit id to add e.g. 204 for light fighter
   * @param {int} count number of units of this id in the fleet
   */
  addUnitId (unitId, count) {
    const ids = Object.keys(this.unitsById)
    if (ids.includes(unitId)) {
      this.unitsById[unitId] += count
    } else {
      this.unitsById[unitId] = count
    }
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
        const bonus = this.player.battleTechs.bonus
        const unit = new Unit(id, stats.shield * bonus.shield, stats.armour * bonus.armor, stats.attack * bonus.attack)
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
      const shield = gameUtils.getUnitStatsById(unit.id).shield
      const techBoost = this.player.battleTechs.bonus.shield
      this.units[i].shield = shield * techBoost
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
      }
    }
  }

  get attackPower () {
    let attack = 0
    for (const [id, count] of Object.entries(this.unitsById)) {
      const stats = gameUtils.getUnitStatsById(id)
      const techBoost = this.player.battleTechs.bonus.weapons
      attack += stats.attack * techBoost * count
    }
    return attack
  }
}

module.exports.Fleet = Fleet
