'use strict'
/* globals */

function addMenuButton () {
  // add button to menu
  const listEntry = document.createElement('li')
  const listLink = document.createElement('a')
  listLink.href = '#'
  listLink.onclick = addChart
  listLink.text = 'Teamview'
  listEntry.appendChild(listLink)
  const statsEntry = document.getElementById('menu').children[14]
  statsEntry.insertAdjacentElement('afterend', listEntry)
}

function addChart () {
  const c = document.createElement('canvas')
  c.id = 'charts'
  c.height = 400
  c.style = 'width: 100%; height: 400px;'
  const content = document.getElementsByTagName('content')[0]
  content.insertAdjacentElement('afterbegin', c)
}

function getVisiblePlayerNames () {
  function cleanName (name) {
    return name.split('(')[0].trim()
  }
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_COUNT = 15
  const COLUMN_PLAYER = 5
  const COLUMN_PLANETNAME = 2
  const rowsWithPlanets = Array.from(document.querySelector('content table.table569').querySelectorAll('tr')).slice(ROWS_HEADER, ROWS_HEADER + ROWS_COUNT)
  for (const [i, row] of rowsWithPlanets.entries()) {
    const cells = Array.from(row.querySelectorAll('td'))
    const planetName = cleanName(cells[COLUMN_PLANETNAME].innerText)
    const playerName = cleanName(cells[COLUMN_PLAYER].innerText)
    console.log(i, planetName, playerName)
  }
}

addMenuButton()

if (window.location.search.includes('page=galaxy')) {
  getVisiblePlayerNames()
}
