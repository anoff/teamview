const test = require('ava')
const be = require('./battleengine')

const dummies = {
  player1: new be.Player(1, 'player1', new be.BattleTechs(8, 6, 7), new be.EngineTechs(8, 5, 3)),
  bt1: new be.BattleTechs(8, 6, 7),
  bt2: new be.BattleTechs(5, 7, 10),
  player2: new be.Player(1, 'player2', new be.BattleTechs(5, 7, 10), new be.EngineTechs(1, 2, 4)),
  start1: new be.Location(1, 33, 7),
  target1: new be.Location(1, 33, 8)
}
test('Fleet creation', t => {
  const f = new be.Fleet(dummies.bt1)
  f.addUnitId(204, 5)
  f.spawnUnits()
  t.is(f.unitCount, 5)
  t.is(f.units.length, 5)
})

test('Fleet.destroy() removes if armor drops', t => {
  const f = new be.Fleet(dummies.bt1)
  f.addUnitId(204, 5)
  f.spawnUnits()

  f.units[2].armor = -10
  f.units[0].armor = 0
  f.units[1].armor = 20 // should not be removed
  f.destroy()
  t.is(f.unitCount, 3)
})

test('Fleet.restoreShields() does its job', t => {
  const f = new be.Fleet(dummies.bt1)
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
  const f = new be.Fleet(dummies.bt1)
  f.addUnitId(204, 5)
  f.spawnUnits()
  const ATTACK_PER_SHIP = 50 * 1.8 // 50 base with battle tech 8
  t.is(f.attackPower, ATTACK_PER_SHIP * 5)
})

test.skip('pick a fight', t => {
  const a1 = new be.Fleet(dummies.bt1)
  const a2 = new be.Fleet(dummies.bt1, 1)
  const d1 = new be.Fleet(dummies.bt2)
  a1.addUnitId(204, 20)
  a2.addUnitId(203, 1)

  d1.addUnitId(401, 10)
  d1.addUnitId(402, 3)
  d1.addUnitId(407, 1)

  be.calculateAttack([a1, a2], [d1])
  t.pass()
})

test.skip('pick another fight', t => {
  const a1 = new be.Fleet(dummies.bt1)
  const a2 = new be.Fleet(dummies.bt1, 1)
  const d1 = new be.Fleet(dummies.bt2)
  a1.addUnitId(204, 20)
  a2.addUnitId(203, 1)
  a2.addUnitId(207, 4)

  d1.addUnitId(401, 5)
  d1.addUnitId(402, 3)

  be.calculateAttack([a1, a2], [d1])
  t.pass()
})

test('pick a fight that should be won', t => {
  const a1 = new be.Fleet(new be.BattleTechs(9, 6, 9))
  const d1 = new be.Fleet(new be.BattleTechs(5, 7, 6))
  a1.addUnitId(202, 67)
  a1.addUnitId(204, 29)
  a1.addUnitId(205, 43)
  a1.addUnitId(207, 200)
  a1.addUnitId(208, 1)
  a1.addUnitId(210, 95)
  a1.addUnitId(215, 2)

  d1.addUnitId(206, 1)
  d1.addUnitId(212, 62)
  d1.addUnitId(401, 138)
  d1.addUnitId(402, 337)
  d1.addUnitId(403, 57)
  d1.addUnitId(404, 25)
  d1.addUnitId(405, 24)
  d1.addUnitId(407, 1)
  d1.addUnitId(408, 1)

  be.calculateAttack([a1], [d1], true)
  t.pass()
})

test('pick simple fight that should be won', t => {
  const a1 = new be.Fleet(new be.BattleTechs(0, 0, 0))
  const d1 = new be.Fleet(new be.BattleTechs(0, 0, 0))
  a1.addUnitId(207, 10)
  d1.addUnitId(401, 20)

  const result = be.calculateAttack([a1], [d1])
  t.is(result.winner, 'attacker')
  t.is(result.losses.attackers.lostRes.metal, 0)
})
