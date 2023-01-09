
const { report2html } = require('./spioHtml')
const req = require('../requests')
const searchHtml = require('./tabSearchPlanets.html').default
const { getCurrentPosition, saveSearchSettings, loadSearchSettings, teamviewDebugMode, makeTableSortable, location2pos } = require('../utils')

const PAGE_ID = '#search-planets' // top level div id to identify this page
const SETTINGS_NAME = 'search_settings_planets'
const SETTINGS_MAP = {
  // name of the setting : [document queryselector, opt:parse function]
  rankMin: [`${PAGE_ID} #rank_min`, parseInt],
  rankMax: [`${PAGE_ID} #rank_max`, parseInt],
  inactive: [`${PAGE_ID} #inactive`]
}

function search () {
  function getQuery () {
    const fields = ['player_name', 'rank_min', 'rank_max', 'alliance_name', 'galaxy_min', 'galaxy_max', 'system_min', 'system_max', 'inactive', 'vacation', 'banned', 'require_report', 'report_maxage', 'has_moon', 'fleetpoints_min', 'defensepoints_max']
    const query = {
      limit: 300
    }
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

  saveSearchSettings(SETTINGS_NAME, SETTINGS_MAP)
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
  // const COL_POS = 0
  // const COL_PLANETNAME = 1
  // const COL_PLAYERNAME = 2
  // const COL_MOON = 3
  // const COL_DEBRIS = 4
  // const COL_PLAYER = 5
  // const COL_ALLIANCE = 6
  const anchor = document.querySelector(`${PAGE_ID} table#search-results tbody`)
  const playerStatus2Indicator = (player) => {
    const text = ['isInactive', 'isBanned', 'isVacation']
      .filter(k => player[k])
      .map(k => k.split('')[2].toLocaleLowerCase())
      .join(',')
    if (!text) return ''
    return `(${text})`
  }

  if (teamviewDebugMode) console.log({ receivedData: planets })
  for (const p of planets) {
    const player = p.extras.player
    const report = p.extras.report
    const flight = p.extras.flight

    // include last attack if it was less than x hours ago
    const ATTACK_MAX_AGE_H = 3
    let lastAttack = null
    if ((new Date() - new Date(p.extras.lastAttack)) <= ATTACK_MAX_AGE_H * 1e3 * 60 * 60) {
      lastAttack = p.extras.lastAttack
    }
    const html = `<tr id="row-${p.planetId}">
    <td data-value="${p.galaxy * 10e5 + p.system * 10e2 + p.position}">
     <a href="${window.location.pathname}?page=galaxy&galaxy=${p.galaxy}&system=${p.system}" title="Goto System">[${p.galaxy}:${p.system}:${p.position}]</a>
    </td>
    <td>
    <a href="#" title="Open Playercard" onclick="return Dialog.Playercard(${player.playerId});">${player.playerName}${player ? ' ' + playerStatus2Indicator(player) : ''} <span style="font-size: 80%; color: yellow;"> (${player.rank})</span></a>
    </td>
    <td>${p.planetName}</td>
    <td>${p.moonId && p.moonId > 0 ? '🌝' : ''}</td>
    <td>${player.alliance || ''}</td>
    <td>
      <a href="#" class="tooltip_sticky" data-tooltip-content="${report2html(report)}" style="${!report ? 'display: none;' : ''}font-size: 130%; position: relative; top: 2px;">${report ? ' 📃 ' : ''}<span style="font-size: 60%;">${calcTimeDeltaString(report?.date)}</span></a>
      <span style="${report && lastAttack ? '' : 'display: none;'}"> | </span>
      <a href="#" class="tooltip_sticky" data-tooltip-content="Last attack started ${calcTimeDeltaString(lastAttack)} ago from [${location2pos(flight?.fromLocation).join(':')}]" style="${!lastAttack ? 'display: none;' : ''}font-size: 130%; position: relative; top: 2px;">${lastAttack ? ' 🚀 ' : ''}<span style="font-size: 60%;">${calcTimeDeltaString(lastAttack)}</span></a>
    </td>
    <td>
      <a id="scan-${p.planetId}" title="Spy on planet" href="javascript:doit(6,${p.planetId},{'210':'2'});" style="font-size: 130%; position: relative; top: 2px;">${p.planetId ? ' 🛰 ' : ''}</a>
    </td>
    </tr>`
    anchor.insertAdjacentHTML('beforeend', html)
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
  const SYSTEM_OFFSET = 60

  anchorElement.insertAdjacentHTML('beforeend', searchHtml)
  const btn = document.querySelector(`${PAGE_ID} button#search`)
  btn.addEventListener('click', search.bind(this))

  const [galaxy, system] = getCurrentPosition()
  document.querySelector(`${PAGE_ID} #galaxy_min`).value = galaxy
  document.querySelector(`${PAGE_ID} #galaxy_max`).value = galaxy
  document.querySelector(`${PAGE_ID} #system_min`).value = Math.max(system - SYSTEM_OFFSET, 1)
  document.querySelector(`${PAGE_ID} #system_max`).value = system + SYSTEM_OFFSET
  // set based on previously saved values
  loadSearchSettings(SETTINGS_NAME, SETTINGS_MAP)

  // make table sortable
  makeTableSortable(`${PAGE_ID} th.sortable`)
}
module.exports = {
  search,
  insertHtml
}
