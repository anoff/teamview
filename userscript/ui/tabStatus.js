const statusHtml = require('./tabStatus.html').default
const req = require('../requests')
const {
  getCurrentPosition
} = require('../utils')

function fetchAndDisplay (galaxy) {
  return req.searchPlanets({
    galaxy_min: galaxy,
    galaxy_max: galaxy,
    type: 'exists',
    limit: 1000
  })
    .then(res => {
      removeRows()
      addRows(res)
    })
}

function insertHtml (anchor) {
  anchor.insertAdjacentHTML('beforeend', statusHtml)

  document.querySelector('select#galaxy').addEventListener('change', e => {
    const galaxy = e.target.value
    fetchAndDisplay(galaxy)
  })

  const [galaxy] = getCurrentPosition()
  document.querySelector('select#galaxy').selectedIndex = galaxy - 1
  fetchAndDisplay(galaxy)
}

function removeRows () {
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 1
  const ROWS_BOTTOM_KEEP = 0
  const rows = Array.from(document.querySelector('table#galaxy-status').querySelectorAll('tr'))
  const rowsWithPlanets = rows.slice(ROWS_HEADER, rows.length - ROWS_BOTTOM_KEEP)
  for (const row of rowsWithPlanets) {
    row.remove()
  }
}

// build and array with systems as indexes and boolean as values
// if the value is truw the index is in a phalanx
async function calculateSystemsInPhalanxRange (galaxy) {
  const phalanxes = await req.getPhalanxes(galaxy)
  const galaxyData = Array.from(Array(400), () => [])

  phalanxes.forEach(phalanx => {
    const { from, to } = phalanx.range
    if (from < to || from === to) {
      for (let system = from; system <= to; system++) {
        galaxyData[system - 1].push(phalanx)
      }
    } else {
      for (let system = from; system <= 400; system++) {
        galaxyData[system - 1].push(phalanx)
      }

      for (let system = 1; system <= to; system++) {
        galaxyData[system - 1].push(phalanx)
      }
    }
  })

  return galaxyData
}

function createDataTooltipContent (galaxyPhalanxData, system) {
  const systemData = galaxyPhalanxData[system - 1]

  let content = '<ul>'
  systemData.forEach(phalanx => {
    content += `<li>[${phalanx.galaxy}:${phalanx.system}:${phalanx.position}]</li>`
  })
  content += '</ul>'
  return content
}

async function addRows (planets) {
  const galaxy = document.querySelector('select#galaxy').value
  const galaxyPhalanxData = await calculateSystemsInPhalanxRange(galaxy)
  const isInPhalanxRange = system => {
    if (system < 1 || system > 400) return false
    return galaxyPhalanxData[system - 1].length > 0
  }

  const ROWS_HEADER = 1
  let anchor = document.querySelector('table#galaxy-status').querySelectorAll('tr')[ROWS_HEADER - 1]
  for (let rowIx = 0; rowIx <= 20; rowIx++) {
    let html = '<tr>'
    for (let colIx = 1; colIx <= 20; colIx++) {
      const system = rowIx * 20 + colIx
      const planetCount = planets.filter(e => e.s === system).length
      const oldest = planets.filter(e => e.s === system).map(e => e.d).sort()[0]
      const oldestAge = (new Date() - new Date(oldest)) / 1000 / 3600 // [h]
      let cls = 'color-gray'
      if (planetCount === 1) cls = 'color-white'
      else if (planetCount === 2) cls = 'color-blue'
      else if (planetCount >= 3) cls = 'color-green'
      if (oldestAge > 24 * 5) cls = 'color-orange'

      const inPhalanxStyle = isInPhalanxRange(system) ? 'style="border: 1px solid red;"' : ''
      const phalanxTooltipConent = isInPhalanxRange(system) ? `data-tooltip-content="${createDataTooltipContent(galaxyPhalanxData, system)}"` : ''

      html += `<td ${inPhalanxStyle} ><a ${phalanxTooltipConent} href="${window.location.pathname}?page=galaxy&galaxy=${galaxy}&system=${system}" class="${cls}">${system}</a></td>`
    }
    html += '</tr>'
    anchor.insertAdjacentHTML('afterend', html)
    const newRow = Array.from(document.querySelector('table#galaxy-status').querySelectorAll('tr')).slice(-1)[0]
    anchor = newRow
  }
}

module.exports = {
  insertHtml
}
