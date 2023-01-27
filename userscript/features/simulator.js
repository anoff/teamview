const be = require('../battleengine')
const outHtml = require('./simulator.html').default

function readFleets () {
  const fields = document.querySelectorAll('input[name^="battleinput"]')
  const attackers = {}
  const defenders = {}
  for (const elm of fields) {
    const m = elm.name.match(/battleinput\[([0-9]+)\]\[([0-9]+)\]\[([0-9]+)\]/)
    const acsSlot = parseInt(m[1])
    const isAttacker = m[2] === '0'
    const id = parseInt(m[3])
    const count = parseInt(elm.value)
    if (id < 200 || count > 0) {
      const obj = isAttacker ? attackers : defenders
      if (obj[acsSlot] === undefined) {
        obj[acsSlot] = {}
      }
      obj[acsSlot][id] = count
    }
  }
  const fleets = {
    attackers: [],
    defenders: []
  }
  const Fleet = be.Fleet
  const BT = be.BattleTechs
  for (const [acsSlot, items] of Object.entries(attackers)) {
    const bt = new BT(items[109], items[110], items[111])
    const f = new Fleet(bt, acsSlot)
    for (const [id, count] of Object.entries(items)) {
      f.addUnitId(id, count)
    }
    fleets.attackers.push(f)
  }
  for (const [acsSlot, items] of Object.entries(defenders)) {
    const bt = new BT(items[109], items[110], items[111])
    const f = new Fleet(bt, acsSlot)
    for (const [id, count] of Object.entries(items)) {
      if (id >= 200 && id < 500) {
        f.addUnitId(id, count)
      }
    }
    fleets.defenders.push(f)
  }
  return fleets
}

function startSim () {
  const results = []
  const fleets = readFleets()
  for (let i = 0; i < 200; i++) {
    // TODO: can probably make this faster if not parsing DOM 200 times
    const fleets = readFleets()
    const result = be.calculateAttack(fleets.attackers, fleets.defenders)
    results.push(result)
  }
  // printSingleResult(fleets, results[0])
  printAverageResult(fleets, results)
}

function injectNewSimButton () {
  const anchor = document.querySelector('tr[id="submit"] input[value="Calculate"]')
  const html = '<input type="button" value="Teamview Sim" id="tv-startsim" class="color-orange">'
  anchor.insertAdjacentHTML('beforebegin', html)
  const elm = document.getElementById('tv-startsim')
  elm.addEventListener('click', () => startSim())
}

function injectResultView () {
  const anchor = document.querySelector('tr[id="submit"]')
  anchor.insertAdjacentHTML('afterend', outHtml)
}

function printSingleResult (fleets, result, clear = true) {
  function print (text) {
    document.querySelector('#tv-sim-results').insertAdjacentHTML('beforeend', `<p>${text}</p>`)
  }
  if (clear) {
    document.querySelector('#tv-sim-results').querySelectorAll('p').forEach(e => e.remove())
  }
  print('Attackers:')
  fleets.attackers.forEach(f => print(`${f.slot}: Weapons: ${f.battleTechs.weapons}, Shield: ${f.battleTechs.shield}, Armor: ${f.battleTechs.armor}`))
  console.log(fleets.attackers[0])
  print('Defenders:')
  fleets.defenders.forEach(f => print(`${f.slot}: Weapons: ${f.battleTechs.weapons}, Shield: ${f.battleTechs.shield}, Armor: ${f.battleTechs.armor}`))
  console.log(fleets.defenders[0])

  print(`Done fighting after ${result.roundStats.length} rounds`)
  print(`Winner: ${result.winner}`)
  print(`Attackers lost: ${(result.losses.attackers.lostRes.metal + result.losses.attackers.lostRes.crystal).toLocaleString()} units`)
  print(`Defenders lost: ${(result.losses.defenders.lostRes.metal + result.losses.defenders.lostRes.crystal).toLocaleString()} units`)
  print(`Debris field: ${result.losses.debris.metal.toLocaleString()} metal, ${result.losses.debris.crystal.toLocaleString()} crystal`)
}

function printAverageResult (fleets, results) {
  function print (text) {
    document.querySelector('#tv-sim-results').insertAdjacentHTML('beforeend', `<p>${text}</p>`)
  }
  document.querySelector('#tv-sim-results').querySelectorAll('p').forEach(e => e.remove())
  fleets.attackers.forEach(f => print(`Attacker Slot ${f.slot}: Weapons: ${f.battleTechs.weapons}, Shield: ${f.battleTechs.shield}, Armor: ${f.battleTechs.armor}`))
  fleets.defenders.forEach(f => print(`Defender Slot ${f.slot}: Weapons: ${f.battleTechs.weapons}, Shield: ${f.battleTechs.shield}, Armor: ${f.battleTechs.armor}`))

  let best = results[0] // for the attackers
  let worst = results[0]
  const average = {
    losses: {
      attackers: { metal: 0, crystal: 0, deuterium: 0 },
      defenders: { metal: 0, crystal: 0, deuterium: 0 }
    },
    winRatio: 0,
    debris: { metal: 0, crystal: 0 },
    rounds: 0
  }
  const battleN = results.length
  for (const battle of results) {
    const totalAttackerLosses = battle.losses.attackers.metal + battle.losses.attackers.crystal
    if (totalAttackerLosses < (best.losses.attackers.metal + best.losses.attackers.crystal)) {
      best = battle
    }
    if (totalAttackerLosses > (worst.losses.attackers.metal + worst.losses.attackers.crystal)) {
      worst = battle
    }
    average.winRatio += battle.winner === 'attacker' ? 1 / battleN : 0
    average.debris.metal += battle.losses.debris.metal / battleN
    average.debris.crystal += battle.losses.debris.crystal / battleN
    average.losses.attackers.metal += battle.losses.attackers.lostRes.metal / battleN
    average.losses.attackers.crystal += battle.losses.attackers.lostRes.crystal / battleN
    average.losses.attackers.deuterium += battle.losses.attackers.lostRes.deuterium / battleN
    average.losses.defenders.metal += battle.losses.defenders.lostRes.metal / battleN
    average.losses.defenders.crystal += battle.losses.defenders.lostRes.crystal / battleN
    average.losses.defenders.deuterium += battle.losses.defenders.lostRes.deuterium / battleN
    average.rounds += battle.roundStats.length / battleN
  }
  print(`Average of ${battleN} simulations`)
  print(`Done fighting after ${average.rounds.toFixed(1)} rounds`)
  print(`Attacker win chance: ${average.winRatio.toFixed(2)}`)
  print(`Attackers lost: ${(average.losses.attackers.metal + average.losses.attackers.crystal).toLocaleString()} units`)
  print(`Defenders lost: ${(average.losses.defenders.metal + average.losses.defenders.crystal).toLocaleString()} units`)
  print(`Debris field: ${average.debris.metal.toLocaleString()} metal, ${average.debris.crystal.toLocaleString()} crystal`)

  print('')
  print('Best Round:')
  printSingleResult(fleets, best, false)
}

function init () {
  if (!window.location.search.includes('page=battleSimulator')) return
  injectNewSimButton()
  injectResultView()
}

module.exports = {
  init
}
