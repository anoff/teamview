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

function addRows (planets) {
  const galaxy = document.querySelector('select#galaxy').value
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
      html += `<td><a href="game.php?page=galaxy&galaxy=${galaxy}&system=${system}" class="${cls}">${system}</a></td>`
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
