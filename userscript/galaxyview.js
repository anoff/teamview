/* globals location */
const req = require('./requests')
const { GM_addStyle } = require('./utils') // eslint-disable-line camelcase

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
        const ageS = serverData.map(e => (new Date() - new Date(e.updated_at)) / 1000).sort()
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

  // make sure that clicking the default navigation buttons also uploads data
  const dirs = ['systemRight', 'systemLeft', 'galaxyRight', 'galaxyLeft']
  dirs.forEach(dir => {
    const elm = Array.from(document.querySelectorAll('input')).find(e => e.type === 'button' && e.name === dir)
    if (elm) {
      elm.onclick = () => {
        button.click()
        location.assign(`javascript:galaxy_submit('${dir}')`)
      }
    }
  })
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
