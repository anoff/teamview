'use strict'
/* globals GM_xmlhttpRequest */

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

function getVisibleSystem () {
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
  const entries = []
  for (const [i, row] of rowsWithPlanets.entries()) {
    const cells = Array.from(row.querySelectorAll('td'))
    const planetName = cleanName(cells[COLUMN_PLANETNAME].innerText)
    const playerName = cleanName(cells[COLUMN_PLAYER].innerText)
    if (planetName && playerName) {
      entries.push({ planetName, playerName, position: i })
    }
  }
  return entries
}

function requestPlayerData (names) {
  const namesArray = names.join(',')
  console.log('sending request', namesArray)
  return new Promise((resolve, reject) => GM_xmlhttpRequest({
    method: 'GET',
    url: `http://localhost:3000/v1/players/${namesArray}`,
    headers: {
      token: 'TOKEN_pocket-wind-swung-barn'
    },
    onload: function (res) {
      if (res.status === 200) {
        let data = JSON.parse(res.responseText)
        if (names.length === 1) {
          // make sure result is always an array
          data = [data]
        }
        console.log(data)
        resolve(data)
      } else {
        console.warn('Error occured while trying to fetch data from teamview server', res.status, res.statusText)
        reject(new Error('Failed to fetch data from teamview server'))
      }
    }
  }))
}

function modifyPlayerText (playerData) {
  function cleanName (name) {
    return name.split('(')[0].trim()
  }
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_COUNT = 15
  const COLUMN_PLAYER = 5
  const rowsWithPlanets = Array.from(document.querySelector('content table.table569').querySelectorAll('tr')).slice(ROWS_HEADER, ROWS_HEADER + ROWS_COUNT)
  for (const row of rowsWithPlanets) {
    const cells = row.querySelectorAll('td')
    const playerName = cleanName(cells[COLUMN_PLAYER].innerText)
    if (playerName) {
      const data = playerData.find(e => e.name === playerName)
      const s = document.createElement('span')
      s.innerHTML = ` (${data.rank})`
      s.style = 'font-size: 80%; color: yellow;'
      cells[COLUMN_PLAYER].querySelector('a').appendChild(s)
    }
  }
}

addMenuButton()

if (window.location.search.includes('page=galaxy')) {
  const data = getVisibleSystem()
  const players = data.map(e => e.playerName)
  const uniquePlayers = Array.from(new Set(players))
  requestPlayerData(uniquePlayers)
    .then(playerData => {
      return modifyPlayerText(playerData)
    })
}
