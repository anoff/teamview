/* globals location */
const req = require('./requests')
const {
  report2html
} = require('./ui/spioHtml')
const { setTeamviewStatus } = require('./utils')

const MAX_AGE_PLANET_H = 72 // number of hours when a planet info is considered outdated

let serverData, systemData
let startedNavigation = false // global var to dected if navigation was started

/**
 * Parse planet information out of current visible system in the galaxy view table
 * @returns Array[{
   planetId,
   planetName,
   playerStatus,
   playerId,
   playerName,
   galaxy,
   system,
   position,
   moonId,
   debrisMetal,
   debrisCrystal
 }]
 */
function getVisibleSystem () {
  function cleanName (name) {
    return name.split('(')[0].trim()
  }

  function getStatus (cell) {
    const classes = cell.querySelector('a span.galaxy-username')?.classList
    if (classes && classes.length > 0) {
      return Array.from(classes).map(e => e.replace('galaxy-username', '')).filter(e => e.length).map(e => e.slice(1))
    } else {
      return []
    }
  }

  if (systemData) {
    return systemData
  }
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_COUNT = 15
  const COLUMN_PLAYER = 5
  const COLUMN_PLANETID = 1
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
    const playerStatus = getStatus(cells[COLUMN_PLAYER])
    let moonId = 0
    if (cells[COLUMN_MOON].children.length > 0) {
      const moonHtml = cells[COLUMN_MOON].innerHTML
      // can't parse own moonId without moonName
      // ToDo parse moon and store it similar like a planet
      const moonMatch = /javascript:doit\(6,([0-9]+)/.exec(moonHtml)
      if (moonMatch) {
        moonId = parseInt(moonMatch[1])
      } else {
        moonId = -1
      }
    }
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
      const playerHTML = cells[COLUMN_PLAYER].innerHTML
      const playerMatch = /Playercard\(([0-9]+)/.exec(playerHTML)
      let playerId = -1
      if (playerMatch) {
        playerId = parseInt(playerMatch[1])
      }

      const planetHtml = cells[COLUMN_PLANETID].innerHTML
      const planetMatch = /javascript:doit\(6,([0-9]+)/.exec(planetHtml)
      let planetId = -1
      if (planetMatch) {
        planetId = parseInt(planetMatch[1])
      } else {
        const planetInfo = Array.from(document.querySelector('#planetSelector').querySelectorAll('option'))
        for (let index = 0; index < planetInfo.length; index++) {
          if (planetInfo[index].innerText.split(' [')[0] === planetName) {
            planetId = parseInt(planetInfo[index].value)
          }
        }
      }
      entries.push({
        planetId,
        planetName,
        playerStatus,
        playerId,
        playerName,
        galaxy,
        system,
        position: i + 1,
        moonId,
        debrisMetal,
        debrisCrystal
      })
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
  const systemCoords = Array.from(document.querySelector('content table.table569').querySelectorAll('tr'))[0].innerText
  const [galaxy, system] = systemCoords.split(' ')[1].split(':').map(e => parseInt(e))

  req.getPlanetInfo([`${galaxy}:${system}`])
    .then(res => {
      serverData = res
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
      } else {
        const knownPlanets = serverData.map(e => `${e.galaxy}:${e.system}:${e.position}`).sort()
        const visiblePlanets = systemData.map(e => `${e.galaxy}:${e.system}:${e.position}`).sort()
        if (!arrayEquals(knownPlanets, visiblePlanets)) {
          // console.log({ serverData, systemData })
          status = 'Inconsistent'
          statusClass = 'status-outdated'
        }
        const ageS = serverData.map(e => (new Date() - new Date(e.updated_at)) / 1000).sort()
        if (ageS / 3600 > MAX_AGE_PLANET_H) {
          status = 'Outdated'
          statusClass = 'status-outdated'
        }
      }
      setTeamviewStatus(statusClass, status)

      modifyTable(serverData, modifyAddPlanetReports)
    }).catch(e => {
      let errMessage = 'Error'
      if (e.status) {
        errMessage += ` [${e.status}]`
      }
      errMessage += ', see console'
      setTeamviewStatus('status-error', errMessage)
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
      case 21:
      case 22:
        isSpan = parseInt(tr.children[1].getAttribute('colspan'))
        tr.children[1].setAttribute('colspan', isSpan + addCount)
        break
      case 23:
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

function modifyAddPlanetReports (data, cells, rowIx) {
  const COLUMN_REPORT = 9
  const planet = data.find(e => e.position === rowIx + 1)
  if (planet?.report) {
    let timeSinceScan = '-'
    const seconds = Math.round((new Date() - new Date(planet.report.date)) / 1000)
    let hours = 0
    let minutes = 0
    hours = Math.floor(seconds / 3600)
    minutes = Math.floor((seconds - hours * 3600) / 60)
    timeSinceScan = `${minutes} min`
    if (hours) {
      timeSinceScan = `${hours} hrs ${timeSinceScan}`
    }
    cells[COLUMN_REPORT].insertAdjacentHTML('afterbegin', `<a href="#" class="tooltip_sticky" data-tooltip-content="${report2html(planet.report)}">🛰 <span style="font-size: 85%;">${timeSinceScan}</span></a>`)
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
    const d = data.find(e => e.playerName === playerName)
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
  setTeamviewStatus('status-working', `Uploading ${data.length} planets`)
  const p = req.uploadPlanets(data)
  p.then(res => {
    const {
      totalCount,
      successCount
    } = res
    setTeamviewStatus('status-ok', `Updated ${successCount}/${totalCount}`)
  }).catch(e => {
    setTeamviewStatus('status-error', 'Failed, see console')
    console.error(e)
  })

  // trigger deletions for planets that do not exist
  if (serverData) {
    for (const p of serverData) {
      const pos = p.position
      const match = data.find(e => e.position === pos)
      if (!match) {
        req.deletePlanet(p)
      }
    }
  }
}

function addUploadSection () {
  const sectionHTML = `
  <tr>
    <td class="transparent" id="teamview-section" colspan="2">
      <table>
        <tbody>
          <tr>
            <th>Teamview</th>
            <td><button type="button" id="teamview-upload">Upload</button></td>
            <td><span style="font-weight: bold;">Status</span></div></td>
            <td><span id="teamview-status-icon" class="dot status-unknown"></td>
            <td><span id="teamview-status-text" style="font-size: 85%;"></span></td>
        </tr>
      </tbody></table>
    </td>
  </tr>
  `
  document.querySelectorAll('#galaxy_form table tr')[0].insertAdjacentHTML('afterend', sectionHTML)
  document.getElementById('teamview-upload').addEventListener('click', doUploadPlanets)

  document.onkeydown = function (e) {
    e = e || window.event
    if (!startedNavigation) {
      switch (e.key || e.keyCode) {
        case 'Enter':
        case ' ':
          doUploadPlanets()
          break
        case 'a':
        case 'ArrowLeft':
          doUploadPlanets()
          location.assign("javascript:galaxy_submit('systemLeft')")
          startedNavigation = true
          break
        case 'd':
        case 'ArrowRight':
          doUploadPlanets()
          location.assign("javascript:galaxy_submit('systemRight')")
          startedNavigation = true
          break
      }
    }
  }

  // make sure that clicking the default navigation buttons also uploads data
  const dirs = ['systemRight', 'systemLeft', 'galaxyRight', 'galaxyLeft']
  dirs.forEach(dir => {
    const elm = Array.from(document.querySelectorAll('input')).find(e => e.type === 'button' && e.name === dir)
    if (elm) {
      elm.onclick = () => {
        doUploadPlanets()
        location.assign(`javascript:galaxy_submit('${dir}')`)
      }
    }
  })
}

function modifyTable (data, modfiyFn) {
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_COUNT = 15
  const rowsWithPlanets = Array.from(document.querySelector('content table.table569').querySelectorAll('tr')).slice(ROWS_HEADER, ROWS_HEADER + ROWS_COUNT)
  for (const [ix, row] of rowsWithPlanets.entries()) {
    const cells = row.querySelectorAll('td')
    modfiyFn(data, cells, ix)
  }
}

function init () {
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
  modifyTable
}
