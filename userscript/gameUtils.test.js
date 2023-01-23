const test = require('ava')
const gameUtils = require('./gameUtils')

test('getUnitStatsById.204', t => {
  const stats = gameUtils.getUnitStatsById(204)
  t.is(stats.name, 'lightFighter')
  t.is(stats.crystal, 1e3)
  t.is(stats.attack, 50)
})

test('getUnitStatsById.204.string', t => {
  const stats = gameUtils.getUnitStatsById('204')
  t.is(stats.name, 'lightFighter')
  t.is(stats.crystal, 1e3)
  t.is(stats.attack, 50)
})

test('getUnitStatsById.406', t => {
  const stats = gameUtils.getUnitStatsById(406)
  t.is(stats.name, 'plasmaCannon')
  t.is(stats.crystal, 50e3)
  t.is(stats.attack, 3000)
})
