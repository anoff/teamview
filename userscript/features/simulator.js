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
  const fleets = readFleets()
  const result = be.calculateAttack(fleets.attackers, fleets.defenders)
  printResults(fleets, result)
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

function printResults (fleets, result) {
  function print (text) {
    document.querySelector('#tv-sim-results').insertAdjacentHTML('beforeend', `<p>${text}</p>`)
  }
  print('Attackers:')
  fleets.attackers.forEach(f => print(`${f.slot}: Weapons=${f.battleTechs.weapons}, Shield=${f.battleTechs.shield}, Armor=${f.battleTechs.armor}`))
  print('Defenders:')
  fleets.defenders.forEach(f => print(`${f.slot}: Weapons=${f.battleTechs.weapons}, Shield=${f.battleTechs.shield}, Armor=${f.battleTechs.armor}`))

  print(`Done fighting after ${result.roundStats.length} rounds`)
  print(`Winner: ${result.winner}`)
  print(`Attackers lost: ${result.losses.attackers.lostRes.metal + result.losses.attackers.lostRes.crystal} units`)
  print(`Defenders lost: ${result.losses.defenders.lostRes.metal + result.losses.defenders.lostRes.crystal} units`)
}

function init () {
  if (!window.location.search.includes('page=battleSimulator')) return
  injectNewSimButton()
  injectResultView()
}

module.exports = {
  init
}
