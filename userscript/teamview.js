'use strict'
/* globals GM_xmlhttpRequest */
function GM_addStyle (css) {
  const style = document.getElementById('GM_addStyleBy8626') || (function () {
    const style = document.createElement('style')
    style.type = 'text/css'
    style.id = 'GM_addStyleBy8626'
    document.head.appendChild(style)
    return style
  })()
  const sheet = style.sheet
  sheet.insertRule(css, (sheet.rules || sheet.cssRules || []).length)
}

function addMenuButton () {
  // add button to menu
  const listEntry = document.createElement('li')
  const listLink = document.createElement('a')
  listLink.href = '#'
  listLink.onclick = showSettings
  listLink.text = 'Teamview'
  listEntry.appendChild(listLink)
  const ref = document.getElementById('menu').children[24]
  ref.insertAdjacentElement('afterend', listEntry)
}

function showSettings () {
  Array.from(document.querySelector('content').children).forEach(c => c.remove())
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
  const COLUMN_MOON = 3
  const COLUMN_DEBRIS = 4
  const rowsWithPlanets = Array.from(document.querySelector('content table.table569').querySelectorAll('tr')).slice(ROWS_HEADER, ROWS_HEADER + ROWS_COUNT)
  const entries = []
  for (const [i, row] of rowsWithPlanets.entries()) {
    const cells = Array.from(row.querySelectorAll('td'))
    const planetName = cleanName(cells[COLUMN_PLANETNAME].innerText)
    const playerName = cleanName(cells[COLUMN_PLAYER].innerText)
    const hasMoon = cells[COLUMN_MOON].children.length > 0
    let debrisCrystal = 0
    let debrisMetal = 0
    const debrisPopup = cells[COLUMN_DEBRIS].innerHTML
    if (debrisPopup) {
      const match = /Metal: <[a-zA-Z<>\\/]+([\d]+).*Crystal: <[a-zA-Z<>\\/]+([\d]+).*/g.exec(debrisPopup)
      if (match) {
        const [, debrisMetalStr, debrisCrystalStr] = match
        debrisCrystal = parseInt(debrisCrystalStr)
        debrisMetal = parseInt(debrisMetalStr)
      }
    }
    if (planetName && playerName) {
      entries.push({ planetName, playerName, position: i, hasMoon, debrisMetal, debrisCrystal })
    }
  }
  console.log(entries)
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
        resolve(data)
      } else {
        console.warn('Error occured while trying to fetch data from teamview server', res.status, res.statusText)
        reject(new Error('Failed to fetch data from teamview server'))
      }
    }
  }))
}

function addColumn (addCount = 1, titles = []) {
  const rows = document.querySelector('content table.table569 tbody').children
  for (let rowIx = 0; rowIx < rows.length; rowIx++) {
    const tr = rows[rowIx]
    const COLUMN_STYLE_REF = 2
    let isSpan
    switch (rowIx) {
      case 0:
        tr.children[0].setAttribute('colspan', 8 + addCount)
        break
      case 1:
        for (let i = 0; i < addCount; i++) {
          const e = document.createElement('th')
          e.setAttribute('style', tr.children[COLUMN_STYLE_REF].getAttribute('style'))
          let title = `Extra ${i + 1}`
          if (titles.length === addCount) {
            title = titles[i]
          }
          e.innerText = title
          tr.appendChild(e)
        }
        break
      case 17:
      case 18:
      case 19:
      case 20:
        isSpan = parseInt(tr.children[1].getAttribute('colspan'))
        tr.children[1].setAttribute('colspan', isSpan + addCount)
        break
      case 21:
        break
      default:
        for (let i = 0; i < addCount; i++) {
          const e = document.createElement('td')
          e.style = tr.children[COLUMN_STYLE_REF].style
          tr.appendChild(e)
        }
    }
  }
}

function modifyTable (data, modfiyFn) {
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_COUNT = 15
  const rowsWithPlanets = Array.from(document.querySelector('content table.table569').querySelectorAll('tr')).slice(ROWS_HEADER, ROWS_HEADER + ROWS_COUNT)
  for (const row of rowsWithPlanets) {
    const cells = row.querySelectorAll('td')
    modfiyFn(data, cells)
  }
}

function modifyAddRankFromPopup (data, cells, rowIx) {
  function cleanName (name) {
    return name.split('(')[0].trim()
  }
  const COLUMN_PLAYER = 5
  const playerName = cleanName(cells[COLUMN_PLAYER].innerText)
  if (playerName) {
    const ingameRankStr = cells[COLUMN_PLAYER].querySelector('a')
      .getAttribute('data-tooltip-content')
      .split('pos. ')[1].split('<')[0]
    const ingameRank = parseInt(ingameRankStr)
    const s = document.createElement('span')
    s.innerHTML = ` (${ingameRank})`
    s.style = 'font-size: 80%; color: yellow;'
    cells[COLUMN_PLAYER].querySelector('a').appendChild(s)
  }
}

function modifyAddPlayerStats (data, cells, rowIx) {
  function cleanName (name) {
    return name.split('(')[0].trim()
  }
  const COLUMN_STATS = 8
  const COLUMN_PLAYER = 5
  const playerName = cleanName(cells[COLUMN_PLAYER].innerText)
  const isInactive = cells[COLUMN_PLAYER].innerText.includes('i)')
  if (playerName) {
    // only modify if this row contains a player
    const d = data.find(e => e.name === playerName)
    const s = document.createElement('span')
    s.classList = 'fadein-text'
    if (isInactive) {
      s.innerText = `🏭${d.pointsBuilding}\n🛡${d.pointsDefense}`
    } else {
      s.innerText = `🚀${d.pointsFleet} / 🛡${d.pointsDefense}\n💥${(d.unitsDestroyed / 1e6).toFixed(1)}M / ↘️${(d.unitsLost / 1e6).toFixed(1)}M`
    }
    s.style = 'font-size: 85%;'
    cells[COLUMN_STATS].appendChild(s)
  }
}
addMenuButton()

if (window.location.search.includes('page=galaxy')) {
  GM_addStyle('.fadein-text { -webkit-animation: fadein 2s; animation: fadein 2s;}')
  GM_addStyle('@keyframes fadein { from { opacity: 0; } to { opacity: 1; }}')
  GM_addStyle('@-webkit-keyframes fadein { from { opacity: 0; } to { opacity: 1; }}')

  addColumn(2, ['Player Stats', 'Spio Info'])
  modifyTable({}, modifyAddRankFromPopup)
  const data = getVisibleSystem()
  const players = data.map(e => e.playerName)
  const uniquePlayers = Array.from(new Set(players))
  requestPlayerData(uniquePlayers)
    .then(playerData => {
      console.log(playerData)
      return modifyTable(playerData, modifyAddPlayerStats)
    })
}
