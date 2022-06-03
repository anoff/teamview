const { capitalCase } = require('change-case')
const { report2html } = require('./spioHtml')
const { addBookmark } = require('./planetBookmark')
const req = require('./requests')
const searchHtml = require('./stationSearchReports.html').default
const { getCurrentPosition } = require('./utils')

const PAGE_ID = '#search-reports' // top level div id to identify this page
function search () {
  function getQuery () {
    const fields = ['by_me', 'report_maxage', 'player_name', 'alliance_name', 'rank_min', 'rank_max', 'galaxy_min', 'galaxy_max', 'system_min', 'system_max', 'inactive', 'vacation', 'banned', 'min_resources', 'min_crystal', 'min_deuterium', 'min_ships', 'check_old_ships', 'report_ships_maxage', 'max_def', 'max_tech']
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
  req.searchReports(query)
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

function insertResults (reports) {
  const ROWS_HEADER = 2
  let anchor = document.querySelector(`${PAGE_ID} table#search-results`).querySelectorAll('tr')[ROWS_HEADER - 1]
  const playerStatus2Indicator = (player) => {
    const text = ['isInactive', 'isBanned', 'isVacation']
      .filter(k => player[k])
      .map(k => k.split('')[2].toLocaleLowerCase())
      .join(',')
    if (!text) return ''
    return `(${text})`
  }

  const obj2text = obj => {
    let str = ''
    for (const key in obj) {
      str += `${capitalCase(key)}: ${obj[key]}<br>`
    }
    return str
  }

  const res2text = value => `${Math.floor(value / 100) / 10}k`
  // Pos. 	Player (Rank) 	Planet 	Resources 	Fleet 	Defense 	Intel Age 	Action
  for (const e of reports) {
    const html = `<tr id="row-${e.planetId}">
    <td>   
    <a href="game.php?page=galaxy&galaxy=${e.galaxy}&system=${e.system}" title="Goto System">[${e.galaxy}:${e.system}:${e.position}]</a>
    </td>
    <td>
      <a href="#" title="Open Playercard" onclick="return Dialog.Playercard(${e.player?.playerId});" style="${!e.player ? 'display: none;' : ''}">${e.player?.playerName || '-'}${e.player ? ' ' + playerStatus2Indicator(e.player) : ''}  <span style="font-size: 80%; color: yellow;"> (${e.player?.rank})</span></a>
    </td>
    <td></td>
    <td><span class="report-details">M${res2text(e.resources.metal)} / K${res2text(e.resources.crystal)} / D${res2text(e.resources.deuterium)}</span></td>
    <td><span class="report-details">${obj2text(e.ships)}</span></td>
    <td><span class="report-details">${obj2text(e.defense)}</span></td>
    <td>
      <a href="#" class="tooltip_sticky" data-tooltip-content="${report2html(e)}" font-size: 130%; position: relative; top: 2px;">${calcTimeDeltaString(e.date)}</a>
    </td>
    <td>
      <a id="attack-${e.planetId}" title="Attack" href="https://pr0game.com/game.php?page=fleetTable&galaxy=${e.galaxy}&system=${e.system}&planet=${e.position}&planettype=1&target_mission=1"> ⚔️ </a>
      <span> | </span>
      <a id="scan-${e.planetId}" title="Spy on planet" href="javascript:doit(6,${e.planetId},{'210':'2'});" style="font-size: 130%; position: relative; top: 2px;">${e.planetId ? ' 🛰 ' : ''}</a>
    </td>
    </tr>`
    anchor.insertAdjacentHTML('afterend', html)

    const newRow = Array.from(document.querySelector(`${PAGE_ID} table#search-results`).querySelectorAll('tr')).slice(-1)[0]

    // update anchor row so rows get inserted always after newly added row
    anchor = newRow
  }
}

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
