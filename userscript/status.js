const statusHtml = require('./status.html').default
const req = require('./requests')
const { getCurrentPosition } = require('./utils')

function fetchAndDisplay (galaxy) {
  return req.searchPlanets({ galaxy_min: galaxy, galaxy_max: galaxy, type: 'exists', limit: 1000 })
    .then(res => {
      removeRows()
      addRows(res)
    })
}

function showStatus () {
  Array.from(document.querySelector('content').children).forEach(c => c.remove())
  document.querySelector('content').insertAdjacentHTML('afterbegin', statusHtml)

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
  const [galaxy] = getCurrentPosition()
  const ROWS_HEADER = 1
  let anchor = document.querySelector('table#galaxy-status').querySelectorAll('tr')[ROWS_HEADER - 1]
  for (let rowIx = 0; rowIx <= 20; rowIx++) {
    let html = '<tr>'
    for (let colIx = 1; colIx <= 20; colIx++) {
      const system = rowIx * 20 + colIx
      const planetCount = planets.filter(e => e.s === system).length
      let color = '#666'
      if (planetCount === 1) color = '#fff'
      else if (planetCount === 2) color = '#36f'
      else if (planetCount >= 3) color = '#3e6'
      html += `<td><a href="game.php?page=galaxy&galaxy=${galaxy}&system=${system}" style="color: ${color};">${system}</a></td>`
    }
    html += '</tr>'
    console.log(html)
    anchor.insertAdjacentHTML('afterend', html)
    const newRow = Array.from(document.querySelector('table#galaxy-status').querySelectorAll('tr')).slice(-1)[0]
    anchor = newRow
  }
}

module.exports = {
  showStatus
}
