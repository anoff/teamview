const gameUtils = require('./gameUtils')
// { itemIds, defenseValues, shipValues }

function calculateAttack (attackers, defenders) {
  const FLEET2DF = 0.4
  const DEF2DF = 0
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
  let initialArmor = 0
  for (const fleet of enemies) {
    unitCount += fleet.unitCount
    if (randomEnemyUnitIx < unitCount) {
      const victimUnitIx = Math.round(Math.random() * (fleet.unitCount - 1))
      victimUnit = fleet.units[victimUnitIx]
      initialArmor = 123 // TODO: set armor for unit
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
  }


}

function destroy (fleet) {

}

function restoreShields (fleets) {

}

function initCombatValues (fleets, isFirstInit = false) {
  return {
    attackAmount: null,
    attackArray: null
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

class Player {
  constructor (id, name, battleTechs, engineTechs) {
    this.id = id
    this.name = name
    this.battleTechs = battleTechs
    this.engineTechs = engineTechs
  }
}

class Location {
  constructor (galaxy, system, position, isMoon) {
    this.galaxy = galaxy
    this.system = system
    this.position = position
    this.isMoon = isMoon
  }
}

class Unit {
  isExploded = false
  constructor (unitType, shield, armor, attack) {
    this.type = unitType
    this.shield = shield
    this.armor = armor
    this.attack = attack
    this.fullArmor = armor
  }

  isShip () {
    return this.type >= 200 && this.type < 300
  }


  static unitByType (unitType) {

  }

}

class Fleet {
  unitsByType = new Map()
  units: Array<Unit> = []
  unitCount = 0

  constructor (player, startLocation, targetLocation) {
    this.player = player
    this.startLocation = startLocation
    this.targetLocation = targetLocation
  }

  /**
   * Add a number of one specific unit (ship or defense) type to the fleet.
   * @param {int} unitType The unit type to add e.g. 204 for small cargos
   * @param {int} count number of units of this type in the fleet
   */
  addunitType (unitType, count) {
    if (this.unitsByType.has(unitType)) {
      this.unitsByType[unitType] += count
    } else {
      this.unitsByType[unitType] = count
    }
    this.unitCount += count
  }
}
