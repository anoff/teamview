const { setTeamviewStatus } = require('../utils')
const be = require('../battleengine')
const gameUtils = require('../gameUtils')
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
    const averageResult = calculateAverageBattle(results)
    printResult(document.querySelector('#tv-sim-result-average'), fleets, averageResult, 'average')

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
    printResult(document.querySelector('#tv-sim-result-best'), fleets, results[best])
    printResult(document.querySelector('#tv-sim-result-worst'), fleets, results[worst])
  }

  window.requestAnimationFrame(simulate) // use this to update DOM while simulating
}

/**
 * Calculate the average battle result.
 * @param {Array<Object>} results several battleengine.calculateAttack() results
 * @returns Object similar to battleengine.calculateAttack()
 */
function calculateAverageBattle (results) {
  const average = {
    losses: {
      attackers: { lostRes: { metal: 0, crystal: 0, deuterium: 0 } },
      defenders: { lostRes: { metal: 0, crystal: 0, deuterium: 0 } },
      debris: { metal: 0, crystal: 0 }
    },
    winRatio: 0,
    rounds: 0
  }
  const battleN = results.length
  for (const battle of results) {
    average.winRatio += battle.winner === 'attacker' ? 1 / battleN : 0
    average.losses.debris.metal += battle.losses.debris.metal / battleN
    average.losses.debris.crystal += battle.losses.debris.crystal / battleN
    average.losses.attackers.lostRes.metal += battle.losses.attackers.lostRes.metal / battleN
    average.losses.attackers.lostRes.crystal += battle.losses.attackers.lostRes.crystal / battleN
    average.losses.attackers.lostRes.deuterium += battle.losses.attackers.lostRes.deuterium / battleN
    average.losses.defenders.lostRes.metal += battle.losses.defenders.lostRes.metal / battleN
    average.losses.defenders.lostRes.crystal += battle.losses.defenders.lostRes.crystal / battleN
    average.losses.defenders.lostRes.deuterium += battle.losses.defenders.lostRes.deuterium / battleN
    average.rounds += battle.roundStats.length / battleN
  }
  return average
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
 * Print battle report into HTML table.
 * @param {HTMLelement} anchor where text will be inserted as <p> per row
 * @param {Object} fleets object containing .attackers and .defenders each with an Array<Fleet>
 * @param {Object} result the fight object returned by battleengine.calculateAttack()
 * @param {String} battleType indicate whether this is a single battle or an averaged one
 */
function printResult (anchor, fleets, result, battleType = 'single') {
  function print (text) {
    anchor.insertAdjacentHTML('beforeend', `<p>${text}</p>`)
  }
  fleets.attackers.forEach(f => print(`Attacker Slot ${f.slot}: Weapons: ${f.battleTechs.weapons}, Shield: ${f.battleTechs.shield}, Armor: ${f.battleTechs.armor}`))
  fleets.defenders.forEach(f => print(`Defender Slot ${f.slot}: Weapons: ${f.battleTechs.weapons}, Shield: ${f.battleTechs.shield}, Armor: ${f.battleTechs.armor}`))
  const RECS_CARGO = gameUtils.shipValues.recycler.cargo
  const requiredRecs = (result.losses.debris.metal + result.losses.debris.crystal) / RECS_CARGO

  if (battleType === 'average') {
    print(`Done fighting after ${result.rounds.toFixed(1)} rounds`)
    print(`Attacker win chance: <span class="${result.winRatio < 0.6 ? 'color-red' : (result.winRatio > 0.9 ? 'color-green' : 'color-orange')}">${result.winRatio.toFixed(2)}</span>`)
  } else {
    print(`Done fighting after ${result.roundStats.length.toFixed(1)} rounds`)
    print(`Winner: ${result.winner}`)
  }
  print(`Attackers lost: ${(result.losses.attackers.lostRes.metal + result.losses.attackers.lostRes.crystal).toLocaleString()} units`)
  print(`Defenders lost: ${(result.losses.defenders.lostRes.metal + result.losses.defenders.lostRes.crystal).toLocaleString()} units`)
  print(`Debris field: ${result.losses.debris.metal.toLocaleString()} metal, ${result.losses.debris.crystal.toLocaleString()} crystal`)
  print(`Required Recyclers: ${Math.ceil(requiredRecs)}`)
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
