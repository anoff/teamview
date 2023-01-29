const { setTeamviewStatus } = require('../utils')
const be = require('../battleengine')
const outHtml = require('./simulator.html').default

/**
 * Reads simulation input as Fleet instances.
 * @returns object containing .attackers and .defenders each as Array<Fleet>
 */
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

/**
 * Start the simulation as many times as requested.
 * Read fleet info from simulation menu.
 * Show results when done.
 */
function startSim () {
  const results = []
  const fleets = readFleets()
  const simulations = parseInt(document.querySelector('#tv-n_simulations').value)
  setTeamviewStatus('status-working', `0/${simulations}`)
  let i = 0
  function simulate () {
    const STEPS = 100
    for (let o = 0; o < STEPS; o++) {
      // TODO: can probably make this faster if not parsing DOM 200 times
      const fleets = readFleets()
      const result = be.calculateAttack(fleets.attackers, fleets.defenders)
      results.push(result)
      if (i + o >= simulations - 1) break
    }
    i += STEPS
    setTeamviewStatus('status-working', `${i}/${simulations}`)
    if (i < simulations) window.requestAnimationFrame(simulate)
    else done()
  }

  function done () {
    setTeamviewStatus('status-ok', 'Done')
    clearSimResult(document.querySelector('#tv-sim-results'))
    printAverageResult(document.querySelector('#tv-sim-result-average'), fleets, results)

    // display best/worst
    let best = 0 // for the attackers
    let worst = 0
    const calcLosses = battle => (battle.losses.attackers.lostRes.metal + battle.losses.attackers.lostRes.crystal)
    for (let i = 0; i < results.length; i++) {
      const totalAttackerLosses = calcLosses(results[i])

      if (totalAttackerLosses < calcLosses(results[best])) {
        best = i
      }
      if (totalAttackerLosses > calcLosses(results[worst])) {
        worst = i
      }
    }
    printSingleResult(document.querySelector('#tv-sim-result-best'), fleets, results[best])
    printSingleResult(document.querySelector('#tv-sim-result-worst'), fleets, results[worst])
  }

  window.requestAnimationFrame(simulate) // use this to update DOM while simulating
}

/**
 * Add the HTML at the bottom of the simulator.
 */
function injectHtml () {
  const anchor = document.querySelector('tr[id="submit"]')
  anchor.insertAdjacentHTML('afterend', `<tr><td>${outHtml}</td></tr>`)
  const elm = document.getElementById('tv-startsim')
  elm.addEventListener('click', () => startSim())
  const allResults = document.querySelectorAll('#tv-sim-results td')
  document.querySelectorAll('input.tv-show-result')
    .forEach(elm => elm.addEventListener('click', () => {
      allResults.forEach(e => e.classList.add('hidden'))
      Array.from(allResults)
        .find(e => e.id === elm.id.replace('tv-sim-show', 'tv-sim-result'))
        .classList.remove('hidden')
      document.querySelectorAll('input.tv-show-result').forEach(e => e.classList.remove('color-blue'))
      elm.classList.add('color-blue')
    }))
}

/**
 * Remove simulation results, removes all <p> elements.
 * @param {HTMLelement} anchor
 */
function clearSimResult (anchor) {
  anchor.querySelectorAll('p').forEach(e => e.remove())
}

/**
 * Print battle report for a single battle into HTML.
 * @param {HTMLelement} anchor where text will be inserted as <p> per row
 * @param {Object} fleets object containing .attackers and .defenders each with an Array<Fleet>
 * @param {Object} result the fight object returned by battleengine.calculateAttack()
 */
function printSingleResult (anchor, fleets, result) {
  function print (text) {
    anchor.insertAdjacentHTML('beforeend', `<p>${text}</p>`)
  }
  fleets.attackers.forEach(f => print(`Attacker Slot ${f.slot}: Weapons: ${f.battleTechs.weapons}, Shield: ${f.battleTechs.shield}, Armor: ${f.battleTechs.armor}`))
  fleets.defenders.forEach(f => print(`Defender Slot ${f.slot}: Weapons: ${f.battleTechs.weapons}, Shield: ${f.battleTechs.shield}, Armor: ${f.battleTechs.armor}`))

  print(`Done fighting after ${result.roundStats.length} rounds`)
  print(`Winner: ${result.winner}`)
  print(`Attackers lost: ${(result.losses.attackers.lostRes.metal + result.losses.attackers.lostRes.crystal).toLocaleString()} units`)
  print(`Defenders lost: ${(result.losses.defenders.lostRes.metal + result.losses.defenders.lostRes.crystal).toLocaleString()} units`)
  print(`Debris field: ${result.losses.debris.metal.toLocaleString()} metal, ${result.losses.debris.crystal.toLocaleString()} crystal`)
}

/**
 * Print battle report as average over all battles into HTML.
 * @param {HTMLelement} anchor where text will be inserted as <p> per row
 * @param {Object} fleets object containing .attackers and .defenders each with an Array<Fleet>
 * @param {Array} results array containing multiple objects returned by battleengine.calculateAttack()
 */
function printAverageResult (anchor, fleets, results) {
  function print (text) {
    anchor.insertAdjacentHTML('beforeend', `<p>${text}</p>`)
  }
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
  print(`Done fighting after ${average.rounds.toFixed(1)} rounds`)
  print(`Attacker win chance: ${average.winRatio.toFixed(2)}`)
  print(`Attackers lost: ${(average.losses.attackers.metal + average.losses.attackers.crystal).toLocaleString()} units`)
  print(`Defenders lost: ${(average.losses.defenders.metal + average.losses.defenders.crystal).toLocaleString()} units`)
  print(`Debris field: ${average.debris.metal.toLocaleString()} metal, ${average.debris.crystal.toLocaleString()} crystal`)
}

/**
 * Initialize teamview simulator.
 */
function init () {
  if (!window.location.search.includes('page=battleSimulator')) return
  injectHtml()
  setTeamviewStatus('status-ok', 'Ready')
}

module.exports = {
  init
}
