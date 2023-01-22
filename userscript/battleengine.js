function calculateAttack (attackers, defenders) {
  const FLEET2DF = 0.4
  const DEF2DF = 0
}

function fight (attackers, defenders) {

}

function shoot (shooter, unit, victim, shooterStats) {

}

function destroy (fleet) {

}

function restoreShields (fleets) {

}

function initCombatValues (fleets, isFirstInit = false) {

}

class BattleTechs {
  constructor (weapons, shield, armour) {
    this.weapons = weapons
    this.shield = shield
    this.armour = armour
  }
}

class EngineTechs {
  constructor (combustion, impulse, hyperspace) {
    this.combustion = combustion
    this.impulse = impulse
    this.hyperspace = hyperspace
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

class Fleet {
  shipCount = new Map()
  constructor (player, startLocation, targetLocation) {
    this.player = player
    this.startLocation = startLocation
    this.targetLocation = targetLocation
  }

  /**
   * Add a number of one specific ship type to the fleet.
   * @param {int} shipType The ship type to add e.g. 204 for small cargos
   * @param {int} count number of ships of this type in the fleet
   */
  addShipType (shipType, count) {
    if (this.shipCount.has(shipType)) {
      this.shipCount[shipType] += count
    } else {
      this.shipCount[shipType] = count
    }
  }
}
