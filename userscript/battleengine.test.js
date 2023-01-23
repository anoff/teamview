const test = require('ava')
const be = require('./battleengine')

const dummies = {
  player1: new be.Player(1, 'player1', new be.BattleTechs(8, 6, 7), new be.EngineTechs(8, 5, 3)),
  start1: new be.Location(1, 33, 7),
  target1: new be.Location(1, 33, 8)
}
test('Fleet creation', t => {
  const f = new be.Fleet(dummies.player1, dummies.start1, dummies.target1)
  f.addUnitType(204, 5)
  f.spawnUnits()
  t.is(f.unitCount, 5)
  t.is(f.units.length, 5)
})

test('destroy() removes if armor drops', t => {
  const f = new be.Fleet(dummies.player1, dummies.start1, dummies.target1)
  f.addUnitType(204, 5)
  f.spawnUnits()

  f.units[2].armor = -10
  f.units[0].armor = 0
  f.units[1].armor = 20 // should not be removed
  be.destroy(f)
  t.is(f.unitCount, 3)
})
