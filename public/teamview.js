/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./galaxyview.js":
/*!***********************!*\
  !*** ./galaxyview.js ***!
  \***********************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/* globals location */
const req = __webpack_require__(/*! ./requests */ "./requests.js")
const { GM_addStyle } = __webpack_require__(/*! ./utils */ "./utils.js") // eslint-disable-line camelcase

const MAX_AGE_PLANET_H = 72 // number of hours when a planet info is considered outdated

let serverData, systemData

/**
 * Parse planet information out of current visible system in the galaxy view table
 * @returns Array[{ name, playerName, galaxy, system, position, hasMoon, debrisMetal, debrisCrystal }]
 */
function getVisibleSystem () {
  function cleanName (name) {
    return name.split('(')[0].trim()
  }

  if (systemData) {
    return systemData
  }
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_COUNT = 15
  const COLUMN_PLAYER = 5
  const COLUMN_PLANETNAME = 2
  const COLUMN_MOON = 3
  const COLUMN_DEBRIS = 4
  const systemCoords = Array.from(document.querySelector('content table.table569').querySelectorAll('tr'))[0].innerText
  const [galaxy, system] = systemCoords.split(' ')[1].split(':').map(e => parseInt(e))
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
      entries.push({ name: planetName, playerName, galaxy, system, position: i + 1, hasMoon, debrisMetal, debrisCrystal })
    }
  }
  systemData = entries
  return entries
}

/**
 * Check on the server which planets are already known and set teamview status accordingly.
 * @param {Array[Object]} data response object of getVisibleSystem()
 */
function checkPlanetStatus (systemData) {
  function arrayEquals (a, b) {
    return a.length === b.length && a.every((v, i) => v === b[i])
  }
  if (systemData.length === 0) {
    return
  }
  req.getPlanetUploadStatus([`${systemData[0].galaxy}:${systemData[0].system}`])
    .then(res => {
      serverData = JSON.parse(res.response)
      // console.log({ serverData, systemData })
      let status = 'OK'
      let statusClass = 'status-ok'
      if (serverData.length !== systemData.length) {
        if (serverData.length === 0) {
          status = 'Unknown system'
          statusClass = 'status-outdated'
        } else {
          status = 'Inconsistent'
          statusClass = 'status-outdated'
        }
        console.log({ serverData, systemData })
      } else {
        const knownPlanets = serverData.map(e => `${e.galaxy}:${e.system}:${e.position}`).sort()
        const visiblePlanets = systemData.map(e => `${e.galaxy}:${e.system}:${e.position}`).sort()
        if (!arrayEquals(knownPlanets, visiblePlanets)) {
          console.log({ serverData, systemData })
          status = 'Inconsistent'
          statusClass = 'status-outdated'
        }
        const ageS = serverData.map(e => (new Date() - new Date(e.updatedAt)) / 1000).sort()
        if (ageS / 3600 > MAX_AGE_PLANET_H) {
          status = 'Outdated'
          statusClass = 'status-outdated'
        }
      }
      setStatus(statusClass, status)
    }).catch(e => {
      setStatus('status-error', 'Error, see console')
      console.error('Error while checking current system upload status', e)
    })
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

function modifyAddRankFromPopup (data, cells, rowIx) {
  function cleanName (name) {
    return name.split('(')[0].trim()
  }
  const COLUMN_PLAYER = 5
  const playerName = cleanName(cells[COLUMN_PLAYER].innerText)
  if (playerName) {
    const innerhtml = cells[COLUMN_PLAYER].querySelector('a')
      .getAttribute('data-tooltip-content')
    const ingameRankStr = /(Platz|pos.) ([0-9]+)/.exec(innerhtml)[2]
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
    if (!d) {
      console.warn('Could not find player information for player: ', playerName)
      return
    }
    s.classList = 'fadein-text'
    if (isInactive) {
      s.innerText = `🏭${d.pointsBuilding}\n🛡${d.pointsDefense}`
    } else {
      s.innerText = `🚀${d.pointsFleet} / 🛡${d.pointsDefense}\n💥${(d.unitsDestroyed / 1e6).toFixed(1)}M / ↘️${(d.unitsLost / 1e6).toFixed(1)}M`
    }
    s.style = 'font-size: 85%;'
    if (cells[COLUMN_STATS]) {
      cells[COLUMN_STATS].appendChild(s)
    }
  }
}

function doUploadPlanets () {
  const data = getVisibleSystem()
  setStatus('status-working', `Uploading ${data.length} planets`)
  const p = req.uploadPlanets(data)
  p.then(res => {
    const { totalCount, successCount } = JSON.parse(res.response)
    setStatus('status-ok', `Updated ${successCount}/${totalCount}`)
  }).catch(e => {
    setStatus('status-error', 'Failed, see console')
    console.error(e)
  })

  // trigger deletions for planets that do not exist
  if (serverData) {
    console.log('delete check')
    for (const p of serverData) {
      const pos = p.position
      const match = data.find(e => e.position === pos)
      console.log(p, match)
      if (!match) {
        req.deletePlanet(p)
      }
    }
  }
}
function addUploadSection () {
  const sectionHTML = `
    <td class="transparent" id="teamview-section">
      <table>
        <tbody><tr>
            <th colspan="4">Teamview</th>
          </tr>
          <tr>
            <td><button type="button" id="teamview-upload">Upload</button></td>
            <td><span style="font-weight: bold;">Status</span></div></td>
            <td><span id="teamview-status-icon" class="dot status-unknown"></td>
            <td><span id="teamview-status-text" style="font-size: 85%;"></span></td>
        </tr>
      </tbody></table>
    </td>
  `
  document.querySelectorAll('#galaxy_form table tr')[0].insertAdjacentHTML('beforeend', sectionHTML)
  document.getElementById('teamview-upload').addEventListener('click', doUploadPlanets)

  const button = document.getElementById('teamview-upload')
  document.onkeydown = function (e) {
    e = e || window.event
    switch (e.which || e.keyCode) {
      case 13 : // enter
      case 32: // space
        button.click()
        break
      case 72: // l
        button.click()
        location.assign("javascript:galaxy_submit('systemLeft')")
        break
      case 76: // h
        button.click()
        location.assign("javascript:galaxy_submit('systemRight')")
        break
    }
  }
}

function setStatus (cssClass, text) {
  const iconElm = document.getElementById('teamview-status-icon')
  const textElm = document.getElementById('teamview-status-text')
  iconElm.classList = `dot ${cssClass}`
  textElm.innerText = text
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

function init () {
  GM_addStyle('.fadein-text { -webkit-animation: fadein 2s; animation: fadein 2s;}')
  GM_addStyle('@keyframes fadein { from { opacity: 0; } to { opacity: 1; }}')
  GM_addStyle('@-webkit-keyframes fadein { from { opacity: 0; } to { opacity: 1; }}')

  GM_addStyle('.dot { height: 7px; width: 7px; border-radius: 50%; display: inline-block;}')
  GM_addStyle('.status-ok { background-color: #00ee00; }')
  GM_addStyle('.status-error { background-color: #ee0000; }')
  GM_addStyle('.status-outdated { background-color: #eeee00; }')
  GM_addStyle('.status-unknown { background-color: #fff; }')
  GM_addStyle('.status-working { animation: status-animation 0.7s infinite; animation-direction: alternate; }')
  GM_addStyle('@keyframes status-animation { from {background-color: #fff;} to {background-color: #3ae;}}')

  addColumn(2, ['Player Stats', 'Spio Info'])
  addUploadSection()
  modifyTable({}, modifyAddRankFromPopup)
  const data = getVisibleSystem()
  systemData = data
  checkPlanetStatus(data)
  const players = data.map(e => e.playerName)
  const uniquePlayers = Array.from(new Set(players))
  if (uniquePlayers.length) {
    req.getPlayerData(uniquePlayers)
      .then(playerData => {
        return modifyTable(playerData, modifyAddPlayerStats)
      })
  }
}

module.exports = {
  addUploadSection,
  addColumn,
  checkPlanetStatus,
  getVisibleSystem,
  init,
  modifyAddRankFromPopup,
  modifyAddPlayerStats,
  modifyTable,
  setStatus
}


/***/ }),

/***/ "./planetBookmark.js":
/*!***************************!*\
  !*** ./planetBookmark.js ***!
  \***************************/
/***/ ((module) => {

/* globals  GM_setValue, GM_getValue */

function removeRows () {
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_BOTTOM_KEEP = 2
  const rows = Array.from(document.querySelector('content table.table569').querySelectorAll('tr'))
  const rowsWithPlanets = rows.slice(ROWS_HEADER, rows.length - 1 - ROWS_BOTTOM_KEEP)
  for (const row of rowsWithPlanets) {
    row.remove()
  }

  document.querySelector('content table.table569 tbody tr:nth-child(1) th').textContent = 'Universe Bookmarks'
}

function insertBookmarkedRows () {
  const ROWS_HEADER = 2
  const colRow = document.querySelector('content table.table569').querySelectorAll('tr')[ROWS_HEADER - 1]
  const colspan = Array.from(colRow.children).map(e => parseInt(e.getAttribute('colspan')) || 1).reduce((p, c) => p + c, 0)
  const cols = colRow.children
  cols[0].innerText = 'Location'
  cols[1].innerText = 'Planet'
  cols[1].setAttribute('colspan', 2)
  cols[2].innerText = 'Name'
  cols[2].setAttribute('colspan', 2)
  cols[3].innerText = 'Actions'
  cols[4].innerText = 'Last Scan'
  cols[4].setAttribute('colspan', colspan - 1 - 2 - 2 - 1)

  Array.from(cols).slice(5).forEach(e => e.remove())

  const bookmarkOrderFn = b => b.position + b.system * 50 + b.galaxy * 400 * 50
  const bookmarks = GM_getValue('bookmarks').sort((a, b) => bookmarkOrderFn(a) > bookmarkOrderFn(b) ? -1 : 1)
  console.log(bookmarks)
  for (const b of bookmarks) {
    let timeSinceLastScan = '-'
    if (b.lastScan) {
      const seconds = Math.round((new Date() - new Date(b.lastScan)) / 1000)
      let hours = 0
      let minutes = 0
      hours = Math.floor(seconds / 3600)
      minutes = Math.floor((seconds - hours * 3600) / 60)
      timeSinceLastScan = `${minutes} min`
      if (hours) {
        timeSinceLastScan = `${hours} hrs ${timeSinceLastScan}`
      }
    }
    const html = `<tr id="row-${b.planetId}">
    <td><a href="game.php?page=galaxy&galaxy=${b.galaxy}&system=${b.system}">${b.galaxy}:${b.system}:${b.position}</a></td>
    <td colspan="2">${b.planetName}</td>
    <td colspan="2">${b.playerName}</td>
    <td>
      <a id="scan-${b.planetId}" href="javascript:doit(6,${b.planetId},{'210':'2'});">🔍</a>
      <a id="delete-${b.planetId}" href="#">❌</a>
    </td>
    <td colspan="${colspan - 1 - 2 - 2 - 1}">${timeSinceLastScan}</td>
    </tr>`
    colRow.insertAdjacentHTML('afterend', html)

    function removeBookmark (planetId) {
      const bookmarks = GM_getValue('bookmarks')
      const ix = bookmarks.findIndex(e => e.planetId === planetId)
      if (ix > -1) {
        bookmarks.splice(ix, 1)
        GM_setValue('bookmarks', bookmarks)
        const row = document.getElementById(`row-${planetId}`)
        row.remove()
      }
    }
    document.getElementById(`scan-${b.planetId}`).addEventListener('click', updateTimestamp.bind(this, b.planetId))
    document.getElementById(`delete-${b.planetId}`).addEventListener('click', removeBookmark.bind(this, b.planetId))
  }
}
function addShowFavoritesButton () {
  function onClick () {
    removeRows()
    insertBookmarkedRows()
  }
  const buttonHTML = '<button type="button" id="teamview-bookmarks">Show Bookmarks</button>'

  const topRows = document.querySelectorAll('#galaxy_form table tr')
  topRows[topRows.length - 1].children[0].insertAdjacentHTML('beforeend', buttonHTML)

  document.getElementById('teamview-bookmarks').onclick = onClick
}

function addBookmarkButton () {
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_COUNT = 15
  const COLUMN_POS = 0
  const COLUMN_PLANETNAME = 2
  const COLUMN_PLAYER = 5
  const COLUMN_ACTIONS = 7
  const systemCoords = Array.from(document.querySelector('content table.table569').querySelectorAll('tr'))[0].innerText
  const [galaxy, system] = systemCoords.split(' ')[1].split(':').map(e => parseInt(e))
  const rowsWithPlanets = Array.from(document.querySelector('content table.table569').querySelectorAll('tr')).slice(ROWS_HEADER, ROWS_HEADER + ROWS_COUNT)
  for (const row of rowsWithPlanets) {
    const cells = row.querySelectorAll('td')
    const actionCell = cells[COLUMN_ACTIONS]
    const spioButton = Array.from(actionCell.children).find(e => e.getAttribute('href').includes('javascript:doit'))
    if (spioButton) {
      const planetId = parseInt(spioButton.getAttribute('href').split(',')[1])
      const planetName = cells[COLUMN_PLANETNAME].innerText.split(' (')[0]
      const playerName = cells[COLUMN_PLAYER].innerText
      const position = parseInt(cells[COLUMN_POS].innerText)
      const a = document.createElement('a')
      a.textContent = '🔖'
      a.href = '#'
      a.setAttribute('title', 'Add planet as bookmark')
      a.style = 'font-size: 130%; position: relative; top: 2px;'
      a.onclick = addBookmark.bind(this, galaxy, system, position, planetId, planetName, playerName)
      spioButton.insertAdjacentElement('afterend', a)
    }
  }
}

function addBookmark (galaxy, system, position, planetId, planetName, playerName) {
  let bookmarks = GM_getValue('bookmarks')
  if (!bookmarks) {
    bookmarks = []
  }
  const ix = bookmarks.findIndex(e => e.galaxy === galaxy && e.system === system && e.position === position)
  if (ix > -1) {
    bookmarks[ix] = { galaxy, system, position, planetId, planetName, playerName }
  } else {
    bookmarks.push({ galaxy, system, position, planetId, planetName, playerName })
  }
  GM_setValue('bookmarks', bookmarks)
}

function updateTimestamp (planetId) {
  let bookmarks = GM_getValue('bookmarks')
  if (!bookmarks) {
    bookmarks = []
  }
  const ix = bookmarks.findIndex(e => e.planetId === planetId)
  if (ix > -1) {
    bookmarks[ix].lastScan = new Date().toISOString()
  }
  GM_setValue('bookmarks', bookmarks)
}

module.exports = {
  addBookmarkButton,
  addShowFavoritesButton,
  removeRows
}

// use these to combile planetBookmark standalone
// addBookmarkButton()
// addShowFavoritesButton()


/***/ }),

/***/ "./requests.js":
/*!*********************!*\
  !*** ./requests.js ***!
  \*********************/
/***/ ((module) => {

/* globals xmlhttpRequest */

function getPlayerData (names) {
  const namesArray = names.join(',')
  console.log('sending request', namesArray)
  return new Promise((resolve, reject) => xmlhttpRequest({
    method: 'GET',
    url: `http://localhost:3000/v1/players/${namesArray}`,
    headers: {
      token: 'TOKEN_pocket-wind-swung-barn'
    },
    onload: function (res) {
      if (res.status === 200) {
        const data = JSON.parse(res.responseText)
        resolve(data)
      } else {
        console.warn('Error occured while trying to fetch data from teamview server', res.status, res.statusText)
        reject(new Error('Failed to fetch data from teamview server'))
      }
    }
  }))
}

function deletePlanet (planet) {
  const TIMEOUT_S = 2

  const location = `${planet.galaxy}:${planet.system}:${planet.position}`
  return new Promise((resolve, reject) => xmlhttpRequest({
    method: 'DELETE',
    url: `http://localhost:3000/v1/planets/${location}`,
    headers: {
      token: 'TOKEN_pocket-wind-swung-barn',
      'content-type': 'application/json; charset=utf-8'
    },
    timeout: TIMEOUT_S * 1000,
    onload: function (res) {
      if (res.status === 200) {
        resolve(res)
      } else {
        const err = {
          status: res.status,
          statusText: res.statusText,
          error: res.responseText
        }
        console.warn('Error while deleting planet', err)
        reject(new Error('Error while deleting planet'))
      }
    },
    ontimeout: () => reject(new Error(`Timeout: Response did not arrive in ${TIMEOUT_S} seconds`)),
    onerror: e => reject(e)
  }))
}

function uploadPlanets (data) {
  const TIMEOUT_S = 2
  return new Promise((resolve, reject) => xmlhttpRequest({
    method: 'POST',
    url: 'http://localhost:3000/v1/planets',
    data: JSON.stringify({ planets: data }),
    headers: {
      token: 'TOKEN_pocket-wind-swung-barn',
      'content-type': 'application/json; charset=utf-8'
    },
    timeout: TIMEOUT_S * 1000,
    onload: function (res) {
      if (res.status === 200) {
        resolve(res)
      } else {
        const err = {
          status: res.status,
          statusText: res.statusText,
          error: res.responseText
        }
        console.warn('Error while sending planet information to server', err)
        reject(new Error('Failed to send planet data to teamview server'))
      }
    },
    ontimeout: () => reject(new Error(`Timeout: Response did not arrive in ${TIMEOUT_S} seconds`)),
    onerror: e => reject(e)
  }))
}

function uploadSpio (data) {
  const TIMEOUT_S = 2
  return new Promise((resolve, reject) => xmlhttpRequest({
    method: 'POST',
    url: 'http://localhost:3000/v1/planets',
    data: JSON.stringify({ planets: data }),
    headers: {
      token: 'TOKEN_pocket-wind-swung-barn',
      'content-type': 'application/json; charset=utf-8'
    },
    timeout: TIMEOUT_S * 1000,
    onload: function (res) {
      if (res.status === 200) {
        resolve(res)
      } else {
        const err = {
          status: res.status,
          statusText: res.statusText,
          error: res.responseText
        }
        console.warn('Error while sending planet information to server', err)
        reject(new Error('Failed to send planet data to teamview server'))
      }
    },
    ontimeout: () => reject(new Error(`Timeout: Response did not arrive in ${TIMEOUT_S} seconds`)),
    onerror: e => reject(e)
  }))
}
/**
 * Check which planets in a given system are already known
 * @param {Array[string]} locations a list of locations in format <SYSTEM>:<GALAXY>:[POSITION]
 * @returns {Array[string]} list of redacted planet info only containing location info and updatedAt time
 */
function getPlanetUploadStatus (locations) {
  const TIMEOUT_S = 2
  const locationsConc = locations.join(',')
  return new Promise((resolve, reject) => xmlhttpRequest({
    method: 'GET',
    url: `http://localhost:3000/v1/planets/${locationsConc}?type=exists`,
    headers: {
      token: 'TOKEN_pocket-wind-swung-barn',
      'content-type': 'application/json; charset=utf-8'
    },
    timeout: TIMEOUT_S * 1000,
    onload: function (res) {
      if (res.status === 200) {
        resolve(res)
      } else {
        const err = {
          status: res.status,
          statusText: res.statusText,
          error: res.responseText
        }
        console.warn('Failed to request planet info from teamview server', err)
        reject(new Error('Failed to request planet info from teamview server'))
      }
    },
    ontimeout: () => reject(new Error(`Timeout: Response did not arrive in ${TIMEOUT_S} seconds`)),
    onerror: e => reject(e)
  }))
}
module.exports = {
  deletePlanet,
  uploadPlanets,
  getPlanetUploadStatus,
  getPlayerData
}


/***/ }),

/***/ "./spioParser.js":
/*!***********************!*\
  !*** ./spioParser.js ***!
  \***********************/
/***/ ((module) => {

class SpioParser {
  isSpioPage () {
    return window.location.search.includes('page=messages') && window.location.search.includes('category=0')
  }

  getMessages () {
    const htmlElements = document.getElementsByClassName('message_head')
    const messages = []
    for (const m of htmlElements) {
      if (!m) return
      const id = parseInt(m.id.split('_')[1])
      const header = m.innerText.trim()
      const body = document.getElementsByClassName(`message_${id} messages_body`)[0].innerText.trim()
      messages.push({
        id,
        header,
        body
      })
    }
    return messages
  }

  parse_text ({
    id,
    header,
    body
  }) {
    function parseDate (dateRaw) {
      const monthMapping = languageMap.months
      // make sure date format is english
      for (const monthDE in monthMapping) {
        dateRaw = dateRaw.replace(monthDE, monthMapping[monthDE])
      }
      // move around day so it can be parsed
      const parts = dateRaw.split(' ')
      const date = new Date([parts[1], parts[0].replace('.', ''), parts.slice(2)].join(' '))
      return date
    }

    function parsePlanet (report) {
      return report.split('[')[1].split(']')[0]
    }

    function parseData (content) {
      const map = languageMap.spyitems_en
      const json = {
        buildings: {},
        resources: {},
        ships: {},
        defense: {},
        research: {}
      }
      let matchKey = null
      for (const line of content) {
        if (matchKey) {
          const [group, item] = map[matchKey].split('_')
          const value = parseInt(line.replace('.', '').replace(',', ''))
          if (value !== 0) { // skip 0s
            switch (group) {
              case 'b':
                json.buildings[item] = value
                break
              case 'def':
                json.defense[item] = value
                break
              case 'res':
                json.resources[item] = value
                break
              case 'sh':
                json.ships[item] = value
                break
              case 'r':
                json.research[item] = value
                break
              default:
                console.error('Unknown spy repeart group:', group)
            }
          }
          matchKey = null
        } else {
          const keys = Object.keys(map)
          matchKey = keys.find(e => e.toLocaleLowerCase() === line.toLocaleLowerCase())
        }
      }
      return json
    }
    const [dateRaw] = header.split(/\t/)
    const [report] = body.split(/\n\n/)
    const [title, ...content] = report.split(/\n/)
    const date = parseDate(dateRaw).toISOString()
    const planet = parsePlanet(title)
    const jsons = parseData(content)
    return {
      id,
      date,
      planet,
      jsons
    }
  }
}

const languageMap = {
  months: {
    Jan: 'Jan',
    Feb: 'Feb',
    Mär: 'Mar',
    Apr: 'Apr',
    Mai: 'May',
    Jun: 'Jun',
    Jul: 'Jul',
    Aug: 'Aug',
    Sep: 'Sep',
    Okt: 'Oct',
    Nov: 'Nov',
    Dez: 'Dec'
  },
  spyitems_en: {
    // lowercased
    // resources
    metal: 'res_metal',
    crystal: 'res_crystal',
    deuterium: 'res_deuterium',
    energy: 'res_energy',
    // ships
    'light cargo': 'sh_lightCargo',
    'heavy cargo': 'sh_heavyCargo',
    'light fighter': 'sh_lightFighter',
    'heavy fighter': 'sh_heavyFighter',
    cruiser: 'sh_cruiser',
    battleship: 'sh_battleship',
    'colony ship': 'sh_colonyShip',
    recycler: 'sh_recycler',
    'spy probe': 'sh_spyProbe',
    'planet bomber': 'sh_planetBomber',
    'solar satellite': 'sh_solarSatellite',
    'star fighter': 'sh_starFighter',
    'battle fortress': 'sh_battleFortress',
    'battle cruiser': 'sh_battleCruiser',
    // defense
    'missile launcher': 'def_missileLauncher',
    'light laser turret': 'def_lightLaserTurret',
    'heavy laser turret': 'def_heavyLaserTurret',
    'gauss cannon': 'def_gaussCannon',
    'ion cannon': 'def_ionCannon',
    'plasma cannon': 'def_plasmaCannon',
    'small shield dome': 'def_smallShieldDome',
    'large shield dome': 'def_largeShieldDome',
    interceptor: 'def_interceptor',
    'interplanetary missiles': 'def_interplanetaryMissiles',
    // buildings
    'metal mine': 'b_metalMine',
    'crystal mine': 'b_crystalMine',
    'deuterium refinery': 'b_deuteriumRefinery',
    'solar power plant': 'b_solarPowerPlant',
    university: 'b_university',
    'deuterium power plant': 'b_deuteriumPowerPlant',
    'robot factory': 'b_robotFactory',
    'nanite factory': 'b_naniteFactory',
    shipyard: 'b_shipyard',
    'metal storage': 'b_metalStorage',
    'crystal storage': 'b_crystalStorage',
    'deuterium storage': 'b_deuteriumStorage',
    'research lab': 'b_researchLab',
    terraformer: 'b_terraformer',
    'alliance depot': 'b_allianceDepot',
    'moon base': 'b_moonBase',
    'phalanx sensor': 'b_phalanxSensor',
    jumpgate: 'b_jumpgate',
    'missile silo': 'b_missileSilo',
    // research
    'spy technology': 'r_spyTechnology',
    'computer technology': 'r_computerTechnology',
    'weapons technology': 'r_weaponsTechnology',
    'shield technology': 'r_shieldTechnology',
    'armour technology': 'r_armourTechnology',
    'energy technology': 'r_energyTechnology',
    'hyperspace technology': 'r_hyperspaceTechnology',
    'combustion engine': 'r_combustionEngine',
    'impulse engine': 'r_impulseEngine',
    'hyperspace engine': 'r_hyperspaceEngine',
    'laser technology': 'r_laserTechnology',
    'ion technology': 'r_ionTechnology',
    'plasma technology': 'r_plasmaTechnology',
    'intergalactic research network': 'r_intergalacticResearchNetwork',
    'expedition research': 'r_expeditionResearch',
    'mineral research': 'r_mineralResearch',
    'semi-crystals research': 'r_semiCrystalsResearch',
    'fuel research': 'r_fuelResearch',
    'graviton research': 'r_gravitonResearch'
  },
  spyitems_de: {
    // lowercased
    // resources
    metall: 'res_metal',
    kristall: 'res_crystal',
    deuterium: 'res_deuterium',
    energie: 'res_energy',
    // ships
    'kleiner transporter': 'sh_lightCargo',
    'großer transporter': 'sh_heavyCargo',
    'leichter jäger': 'sh_lightFighter',
    'schwerer jäger': 'sh_heavyFighter',
    kreuzer: 'sh_cruiser',
    schlachtschiff: 'sh_battleship',
    kolonieschiff: 'sh_colonyShip',
    recycler: 'sh_recycler',
    spionagesonde: 'sh_spyProbe',
    bomber: 'sh_planetBomber',
    solarsatellit: 'sh_solarSatellite',
    zerstörer: 'sh_starFighter',
    todesstern: 'sh_battleFortress',
    schlachtkreuzer: 'sh_battleCruiser',
    // defense
    raketenwerfer: 'def_missileLauncher',
    'leichtes lasergeschütz': 'def_lightLaserTurret',
    'schweres lasergeschütz': 'def_heavyLaserTurret',
    gaußkanone: 'def_gaussCannon',
    ionengeschütz: 'def_ionCannon',
    plasmawerfer: 'def_plasmaCannon',
    'kleine schildkuppel': 'def_smallShieldDome',
    'große schildkuppel': 'def_largeShieldDome',
    abfangrakete: 'def_interceptor',
    interplanetarrakete: 'def_interplanetaryMissiles',
    // buildings
    metallmine: 'b_metalMine',
    kristallmine: 'b_crystalMine',
    deuteriumsynthetisierer: 'b_deuteriumRefinery',
    solarkraftwerk: 'b_solarPowerPlant',
    technoDome: 'b_university',
    fusionskraftwerk: 'b_deuteriumPowerPlant',
    roboterfabrik: 'b_robotFactory',
    nanitenfabrik: 'b_naniteFactory',
    raumschiffwerft: 'b_shipyard',
    metallspeicher: 'b_metalStorage',
    kristallspeicher: 'b_crystalStorage',
    deuteriumtank: 'b_deuteriumStorage',
    forschungslabor: 'b_researchLab',
    terraformer: 'b_terraformer',
    allianzdepot: 'b_allianceDepot',
    basisstützpunkt: 'b_moonBase',
    sensorenphalanx: 'b_phalanxSensor',
    sprungtor: 'b_jumpgate',
    raketensilo: 'b_missileSilo',
    // research
    spionagetechnik: 'r_spyTechnology',
    computertechnik: 'r_computerTechnology',
    waffentechnik: 'r_weaponsTechnology',
    schildtechnik: 'r_shieldTechnology',
    raumschiffpanzerung: 'r_armourTechnology',
    energietechnik: 'r_energyTechnology',
    hyperraumtechnik: 'r_hyperspaceTechnology',
    verbrennungstriebwerk: 'r_combustionEngine',
    impulstriebwerk: 'r_impulseEngine',
    hyperraumantrieb: 'r_hyperspaceEngine',
    lasertechnik: 'r_laserTechnology',
    ionentechnik: 'r_ionTechnology',
    plasmatechnik: 'r_plasmaTechnology',
    'intergalaktisches forschungsnetzwerk': 'r_intergalacticResearchNetwork',
    astrophysik: 'r_expeditionResearch',
    'produktionsmaximierung metall': 'r_mineralResearch',
    'produktionsmaximierung kristall': 'r_semiCrystalsResearch',
    'produktionsmaximierung deuterium': 'r_fuelResearch',
    gravitonforschung: 'r_gravitonResearch'
  }
}

function uploadSpies (reports) {

}

module.exports = {
  SpioParser
}


/***/ }),

/***/ "./utils.js":
/*!******************!*\
  !*** ./utils.js ***!
  \******************/
/***/ ((module) => {

function GM_addStyle (css) { // eslint-disable-line camelcase
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

module.exports = {
  GM_addStyle
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!*********************!*\
  !*** ./teamview.js ***!
  \*********************/

/* globals  */

const gv = __webpack_require__(/*! ./galaxyview */ "./galaxyview.js")
const pb = __webpack_require__(/*! ./planetBookmark */ "./planetBookmark.js")
const { SpioParser } = __webpack_require__(/*! ./spioParser */ "./spioParser.js")
const sp = new SpioParser()

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

addMenuButton()

if (window.location.search.includes('page=galaxy')) {
  gv.init()
  pb.addShowFavoritesButton()
  pb.addBookmarkButton()
}

if (sp.isSpioPage()) {
  const messages = sp.getMessages()
  const data = messages.map(e => sp.parse_text(e))
  console.log(data)
}

})();

/******/ })()
;