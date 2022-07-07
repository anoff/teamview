
const { report2html } = require('./spioHtml')
const req = require('./requests')
const searchHtml = require('./stationSearch.html').default
const { getCurrentPosition } = require('./utils')

const PAGE_ID = '#search-planets' // top level div id to identify this page

function search () {
  function getQuery () {
    const fields = ['player_name', 'rank_min', 'rank_max', 'alliance_name', 'galaxy_min', 'galaxy_max', 'system_min', 'system_max', 'inactive', 'vacation', 'banned', 'require_report', 'report_maxage', 'has_moon', 'fleetpoints_min', 'defensepoints_max']
    const query = {}
    for (const f of fields) {
      const elm = document.querySelector(`${PAGE_ID} #${f}`)
      switch (elm.type.toLowerCase()) {
        case 'checkbox':
          query[f] = elm.checked
          break
        case 'select-one':
          switch (elm.value.toLowerCase()) {
            case 'yes':
              query[f] = true
              break
            case 'no':
              query[f] = false
              break
            // otherwise do not add filter
          }
          break
        case 'number':
          if (elm.value) query[f] = parseInt(elm.value)
          break
        default:
          query[f] = elm.value
      }
    }
    return query
  }

  const query = getQuery()
  req.searchPlanets(query)
    .then(res => {
      removeRows()
      insertResults(res)
    })
}

function removeRows () {
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_BOTTOM_KEEP = 0
  const rows = Array.from(document.querySelector(`${PAGE_ID} table#search-results`).querySelectorAll('tr'))
  const rowsWithPlanets = rows.slice(ROWS_HEADER, rows.length - ROWS_BOTTOM_KEEP)
  for (const row of rowsWithPlanets) {
    row.remove()
  }
}

function calcTimeDeltaString (date) {
  const seconds = Math.round((new Date() - new Date(date)) / 1000)
  if (!seconds) return '-'
  const hours = Math.floor(seconds / 360) / 10
  return `${hours}h`
}

function insertResults (planets) {
  const ROWS_HEADER = 2
  // const COL_POS = 0
  // const COL_PLANETNAME = 1
  // const COL_PLAYERNAME = 2
  // const COL_MOON = 3
  // const COL_DEBRIS = 4
  // const COL_PLAYER = 5
  // const COL_ALLIANCE = 6
  let anchor = document.querySelector(`${PAGE_ID} table#search-results`).querySelectorAll('tr')[ROWS_HEADER - 1]
  const playerStatus2Indicator = (player) => {
    const text = ['isInactive', 'isBanned', 'isVacation']
      .filter(k => player[k])
      .map(k => k.split('')[2].toLocaleLowerCase())
      .join(',')
    if (!text) return ''
    return `(${text})`
  }

  for (const p of planets) {
    const html = `<tr id="row-${p.planetId}">
    <td>
    <a href="game.php?page=galaxy&galaxy=${p.galaxy}&system=${p.system}" title="Goto System">[${p.galaxy}:${p.system}:${p.position}]</a>
    </td>
    <td>
    <a href="#" title="Open Playercard" onclick="return Dialog.Playercard(${p.player.playerId});">${p.player.playerName}${p.player ? ' ' + playerStatus2Indicator(p.player) : ''} <span style="font-size: 80%; color: yellow;"> (${p.player.rank})</span></a>
    </td>
    <td>${p.planetName}</td>
    <td>${p.moonId ? '🌝' : ''}</td>
    <td>${p.player.alliance || ''}</td>
    <td>
      <a href="#" class="tooltip_sticky" data-tooltip-content="${report2html(p.report)}" style="${!p.report ? 'display: none;' : ''}font-size: 130%; position: relative; top: 2px;">${p.report ? ' 📃 ' : ''}<span style="font-size: 60%;">${calcTimeDeltaString(p.report?.date)}</span></a>
    </td>
    <td>
      <a id="scan-${p.planetId}" title="Spy on planet" href="javascript:doit(6,${p.planetId},{'210':'2'});" style="font-size: 130%; position: relative; top: 2px;">${p.planetId ? ' 🛰 ' : ''}</a>
    </td>
    </tr>`
    anchor.insertAdjacentHTML('afterend', html)

    const newRow = Array.from(document.querySelector(`${PAGE_ID} table#search-results`).querySelectorAll('tr')).slice(-1)[0]
    // update anchor row so rows get inserted always after newly added row
    anchor = newRow
  }
}

function markPlanetAsSpied (coords) {
  const rows = document.querySelectorAll('table#search-results tr')
  for (const row of rows) {
    const isMatch = row.children[0].textContent.includes(coords)
    if (isMatch) {
      row.style.opacity = 0.3
    }
  }
}

function readFleetStatus () {
  const stati = document.querySelectorAll('table#fleet-status td')
  for (const status of stati) {
    const success = Array.from(status.classList).includes('success')
    const coords = status.textContent.match(/([0-9]+:[0-9]+:[0-9]+)/)
    if (success && coords.length) {
      markPlanetAsSpied(coords[1])
    }
  }
}

let FLEET_STATUS_TIMER = null
function startFleetStatusTimer () {
  if (!FLEET_STATUS_TIMER) {
    FLEET_STATUS_TIMER = setInterval(() => {
      readFleetStatus()
    }, 700)
  }
}

startFleetStatusTimer()

function insertHtml (anchorElement) {
  anchorElement.insertAdjacentHTML('beforeend', searchHtml)
  const btn = document.querySelector(`${PAGE_ID} button#search`)
  btn.addEventListener('click', search.bind(this))

  const [galaxy] = getCurrentPosition()
  document.querySelector(`${PAGE_ID} #galaxy_min`).value = galaxy
  document.querySelector(`${PAGE_ID} #galaxy_max`).value = galaxy
}
module.exports = {
  search,
  insertHtml
}
