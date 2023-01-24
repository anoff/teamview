const test = require('ava')
const be = require('./battleengine')

const dummies = {
  player1: new be.Player(1, 'player1', new be.BattleTechs(8, 6, 7), new be.EngineTechs(8, 5, 3)),
  start1: new be.Location(1, 33, 7),
  target1: new be.Location(1, 33, 8)
}
test('Fleet creation', t => {
  const f = new be.Fleet(dummies.player1, dummies.start1, dummies.target1)
  f.addUnitId(204, 5)
  f.spawnUnits()
  t.is(f.unitCount, 5)
  t.is(f.units.length, 5)
})

test('Fleet.destroy() removes if armor drops', t => {
  const f = new be.Fleet(dummies.player1, dummies.start1, dummies.target1)
  f.addUnitId(204, 5)
  f.spawnUnits()

  f.units[2].armor = -10
  f.units[0].armor = 0
  f.units[1].armor = 20 // should not be removed
  f.destroy()
  t.is(f.unitCount, 3)
})

test('Fleet.restoreShields() does its job', t => {
  const f = new be.Fleet(dummies.player1, dummies.start1, dummies.target1)
  f.addUnitId(204, 5)
  f.spawnUnits()

  f.units[2].shield = -10
  f.units[0].shield = 0
  f.units[1].shield = 20
  f.restoreShields()
  const SHIELDEXPECTED = 16 // 10 base with shieldtech 6 = 16
  t.is(f.units[2].shield, SHIELDEXPECTED)
  t.is(f.units[0].shield, SHIELDEXPECTED)
  t.is(f.units[1].shield, SHIELDEXPECTED)
})

test('Fleet.attackPower calcualtes sum of all fleet units', t => {
  const f = new be.Fleet(dummies.player1, dummies.start1, dummies.target1)
  f.addUnitId(204, 5)
  f.spawnUnits()
  const ATTACK_PER_SHIP = 50 * 1.8 // 50 base with battle tech 8
  t.is(f.attackPower, ATTACK_PER_SHIP * 5)
})
