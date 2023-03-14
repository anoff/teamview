const { report2html } = require('./spioHtml')
const { searchReportsRequest } = require('../requests')
const searchHtml = require('./tabSearchReports.html').default
const { getCurrentPosition, quantile, saveSearchSettings, loadSearchSettings, teamviewDebugMode, makeTableSortable, calculateDistance, calculateFlightDuration } = require('../utils')
const { calculateShipSpeed, res2str, obj2str, shipStructurePoints, defenseStructurePoints, itemIds } = require('../gameUtils')
const { TradeRatios } = require('../features/tradeRatios')
const { LocalStorage } = require('../features/storage.ts')

const PAGE_ID = '#search-reports' // top level div id to identify this page
const SETTINGS_NAME = 'search_settings_reports'
const SETTINGS_MAP = {
  // name of the setting : [document queryselector, opt:parse function]
  minMse: [`${PAGE_ID} #min_mse`],
  minCrystal: [`${PAGE_ID} #min_crystal`],
  minDeuterium: [`${PAGE_ID} #min_deuterium`],
  maxTech: [`${PAGE_ID} #max_tech`],
  reportMaxAge: [`${PAGE_ID} #report_maxage`],
  fleetpointsMin: [`${PAGE_ID} #fleetpoints_min`],
  defensepointsMax: [`${PAGE_ID} #defensepoints_max`]
}

/**
 * Trigger search on the API and insert results into DOM.
 */
function search () {
  function getQuery () {
    const fields = ['by_me', 'report_maxage', 'player_name', 'alliance_name', 'rank_min', 'rank_max', 'galaxy_min', 'galaxy_max', 'system_min', 'system_max', 'inactive', 'vacation', 'banned', 'min_mse', 'min_crystal', 'min_deuterium', 'min_ships', 'max_def', 'max_tech', 'fleetpoints_min', 'defensepoints_max', 'is_moon']
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
          if (elm.value) {
            if (f === 'report_maxage') query[f] = parseFloat(elm.value)
            else query[f] = parseInt(elm.value)
          }
          break
        default:
          query[f] = elm.value
      }
    }
    return query
  }

  saveSearchSettings(SETTINGS_NAME, SETTINGS_MAP)
  const query = getQuery()
  searchReportsRequest(query)
    .then(res => {
      removeRows()
      insertResults(res)
    })
}

/**
 * Remove all result rows.
 */
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

/**
 * Calculate string representing delta time in hours.
 * @param {Date} date (past) date object as reference
 * @returns {String} delta time in format of 4.2h
 */
function calcTimeDeltaString (date) {
  const seconds = Math.round((new Date() - new Date(date)) / 1000)
  if (!seconds) return '-'
  const hours = Math.floor(seconds / 360) / 10
  return `${hours}h`
}

/**
 * Generate battle simulator link based on planet espionage information.
 * @param {object} resources list of planet resources
 * @param {object} defenses list of planet defenses
 * @param {object} ships list of ships on planet
 * @param {object} research list of research levels
 * @returns {string} relative url for simulator with configured planet info
 */
function simLink (resources, defenses, ships, research) {
  let url = `${window.location.pathname}?page=battleSimulator&`
  for (const r in resources) {
    const id = itemIds[`res_${r}`]
    if (id) {
      url += `im[${id}]=${resources[r]}&`
    }
  }
  for (const d in defenses) {
    const id = itemIds[`def_${d}`]
    if (id) {
      url += `im[${id}]=${defenses[d]}&`
    }
  }
  for (const s in ships) {
    const id = itemIds[`sh_${s}`]
    if (id) {
      url += `im[${id}]=${ships[s]}&`
    }
  }
  for (const r in research) {
    const id = itemIds[`r_${r}`]
    if (id) {
      url += `im[${id}]=${research[r]}&`
    }
  }
  return url
}

/**
 * Insert reports into DOM.
 * @param {Array[Object]} reports List of planet espionage reports
 */
function insertResults (reports) {
  const anchor = document.querySelector(`${PAGE_ID} table#search-results tbody`)
  const currentPosition = getCurrentPosition()
  const currentCoords = {
    galaxy: currentPosition[0],
    system: currentPosition[1],
    position: currentPosition[2]
  }
  const currentTechs = LocalStorage.getResearch()
  const lightCargoSpeed = calculateShipSpeed('lightCargo', currentTechs)
  // const heavyCargoSpeed = calculateShipSpeed('heavyCargo', currentTechs)
  // const spyProbeSpeed = calculateShipSpeed('spyProbe', currentTechs)

  const playerStatus2Indicator = (player) => {
    const text = ['isInactive', 'isBanned', 'isVacation']
      .filter(k => player[k])
      .map(k => k.split('')[2].toLocaleLowerCase())
      .join(',')
    if (!text) return ''
    return `(${text})`
  }

  const res2mse = (obj, ratio = TradeRatios.get()) => {
    const m = obj.metal || 0
    const c = obj.crystal * ratio.metal / ratio.crystal || 0
    const d = obj.deuterium * ratio.metal / ratio.deuterium || 0
    return m + c + d
  }

  const resPerHour = (mse, curCoords, targetCoords) => {
    return (mse / (2 * calculateFlightDuration(calculateDistance(curCoords, targetCoords), lightCargoSpeed))) * 3600
  }

  const allRes = {
    metal: reports.filter(e => e.resources.metal).map(e => typeof e.resources.metal === 'number' ? e.resources.metal : 0),
    crystal: reports.filter(e => e.resources.crystal).map(e => typeof e.resources.crystal === 'number' ? e.resources.crystal : 0),
    deuterium: reports.filter(e => e.resources.deuterium).map(e => typeof e.resources.deuterium === 'number' ? e.resources.deuterium : 0),
    mse: reports.filter(e => e.resources.metal).map(e => res2mse(e.resources))
  }

  const quantiles = {
    mse: {
      0.5: quantile(allRes.mse, 0.5),
      0.8: quantile(allRes.mse, 0.8)
    },
    metal: {
      0.5: quantile(allRes.metal, 0.5),
      0.8: quantile(allRes.metal, 0.8)
    },
    crystal: {
      0.5: quantile(allRes.crystal, 0.5),
      0.8: quantile(allRes.crystal, 0.8)
    },
    deuterium: {
      0.5: quantile(allRes.deuterium, 0.5),
      0.8: quantile(allRes.deuterium, 0.8)
    }
  }

  const res2class = (res, quantiles) => {
    if (res > quantiles['0.8']) return 'color-green'
    else if (res > quantiles['0.5']) return 'color-blue'
    return 'color-white'
  }

  if (teamviewDebugMode) console.log({ receivedData: reports })
  for (const e of reports) {
    const requiredCargo = 0.5 * Math.max(e.resources.metal + e.resources.crystal + e.resources.deuterium, Math.min(0.75 * (2 * e.resources.metal + e.resources.crystal + e.resources.deuterium), 2 * e.resources.metal + e.resources.deuterium))

    let fleetSp = 0
    if (e.ships) {
      for (const sk in e.ships) {
        fleetSp += shipStructurePoints[sk] * e.ships[sk]
      }
    }
    let fleetSpClass = 'color-white'
    if (fleetSp * 0.3 > 1e6) fleetSpClass = 'color-blue'
    if (fleetSp * 0.3 > 3e6) fleetSpClass = 'color-green'
    let defSp = 0
    if (e.defense) {
      for (const sk in e.defense) {
        defSp += defenseStructurePoints[sk] * e.defense[sk]
      }
    }
    const def2fleet = defSp / Math.max(fleetSp, 1)
    let def2fleetClass = 'color-orange'
    if (def2fleet < 1) def2fleetClass = 'color-green'
    else if (def2fleet < 2) def2fleetClass = 'color-blue'

    const tradeRatios = TradeRatios.get()

    const targetCoords = {
      galaxy: e.galaxy,
      system: e.system,
      position: e.position
    }

    const flightTimeSeconds = Math.floor(calculateFlightDuration(calculateDistance(currentCoords, targetCoords), lightCargoSpeed))
    const flightTimeStr = `${Math.floor(flightTimeSeconds / 3600)}h ${Math.floor((flightTimeSeconds % 3600) / 60)}m ${flightTimeSeconds % 60}s`

    const html = `<tr id="row-${e.planetId}">
    <td class="col-position" data-value="${e.galaxy * 10e5 + e.system * 10e2 + e.position}">   
      <a href="${window.location.pathname}?page=galaxy&galaxy=${e.galaxy}&system=${e.system}" title="Goto System">[${e.galaxy}:${e.system}:${e.position}]${e.isMoon ? 'M' : ''}</a>
    </td>
    <td class="col-rank">
      <a href="#" title="Open Playercard" onclick="return Dialog.Playercard(${e.player?.playerId});" style="${!e.player?.playerId ? 'display: none;' : ''}">${e.player?.playerName || '-'}${e.player ? ' ' + playerStatus2Indicator(e.player) : ''}</a>
      <span style="${e.player?.playerId ? 'display: none;' : ''}">${e.player?.playerName || '-'}${e.player ? ' ' + playerStatus2Indicator(e.player) : ''}</span>
        <span style="font-size: 80%; color: yellow;"> (${e.player?.rank})</span>
    </td>
    <td class="col-planet"><span>${e.planetName || ''} ${e.isMoon ? '🌝' : ''}</span></td>
    <td class="col-res-per-hour" data-value="${resPerHour(res2mse(e.resources), currentCoords, targetCoords)}"><span>${res2str(resPerHour(res2mse(e.resources), currentCoords, targetCoords))}</span></td>
    <td class="col-flight-time"><span>${flightTimeStr}</span></td>
    <td class="col-mse" data-value="${res2mse(e.resources)}"><span title="Metal Standard Units using ${tradeRatios.metal}:${tradeRatios.crystal}:${tradeRatios.deuterium}" class="${res2class(res2mse(e.resources), quantiles.mse)}">${res2str(res2mse(e.resources))}</span></td>
    <td class="col-metal" data-value="${e.resources.metal}"><span class="${res2class(e.resources.metal, quantiles.metal)}">${res2str(e.resources.metal)}</span></td>
    <td class="col-crystal" data-value="${e.resources.crystal}"><span class="${res2class(e.resources.crystal, quantiles.crystal)}">${res2str(e.resources.crystal)}</span></td>
    <td class="col-deuterium" data-value="${e.resources.deuterium}"><span class="${res2class(e.resources.deuterium, quantiles.deuterium)}">${res2str(e.resources.deuterium)}</span></td>
    <td class="col-fleet" data-value="${fleetSp}">
      <span style="${fleetSp === 0 ? 'display: none;' : ''}" class="${fleetSpClass}">
        <img src="./styles/theme/nova/planeten/debris.jpg" alt="TF for entire fleet" width="16" height="16">
        ${Math.round(fleetSp * 0.3 / 1e5) / 10}M<br>
      </span>
      <span class="report-details">
        ${obj2str(e.ships)}
      </span>
    </td>
    <td class="col-defense" data-value="${defSp}"><span style="${Math.min(defSp, fleetSp) === 0 ? 'display: none;' : ''}" class="${def2fleetClass}">Def/Fleet: ${Math.round(def2fleet * 10) / 10}<br></span><span class="report-details">${obj2str(e.defense)}</span></td>
    <td class="col-scan" data-value="${(new Date() - new Date(e.date))}">
      <a href="#" class="tooltip_sticky" data-tooltip-content="${report2html(e)}">${calcTimeDeltaString(e.date)}</a>
    </td>
    <td class="col-action" >
      <a id="attack-${e.planetId}" title="Attack" href="${window.location.pathname}?page=fleetTable&galaxy=${e.galaxy}&system=${e.system}&planet=${e.position}&planettype=1&target_mission=1#ship_input[202]=${Math.ceil(requiredCargo / 5000)}" target="_blank"> ⚔️ </a>
      <br>
      <span>⸺</span>
      <br>
      <a id="scan-${e.planetId}" title="Spy on planet" href="javascript:doit(6,${e.planetId},{'210':'2'});" style="font-size: 130%; position: relative; top: 2px;">${e.planetId ? ' 🛰 ' : ''}</a>
      <div ${fleetSp + defSp === 0 ? 'class="hidden"' : ''}>
        <span>⸺</span>
        <br>
        <a id="sim-${e.planetId}" title="Simulate" href="${simLink(e.resources, e.defense, e.ships, e.research)}" style="font-size: 130%; position: relative; top: 2px;" target="_blank">${e.planetId ? ' 🔮 ' : ''}</a>
      </div>
    </td>
    </tr>`
    anchor.insertAdjacentHTML('beforeend', html)
  }
}

/**
 * Inject this features HTML content into the page.
 * @param {DOM} anchorElement anchor element that is used to place additional HTML
 */
function insertHtml (anchorElement) {
  anchorElement.insertAdjacentHTML('beforeend', searchHtml)
  const btn = document.querySelector(`${PAGE_ID} button#search`)
  btn.addEventListener('click', search.bind(this))

  const checkboxes = document.querySelectorAll('.hide-column-tag')
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const classname = this.value
      const columns = document.querySelectorAll(`.${classname}`)
      columns.forEach(column => {
        column.style.display = this.checked ? '' : 'none'
      })
    })
  })

  const [galaxy] = getCurrentPosition()
  document.querySelector(`${PAGE_ID} #galaxy_min`).value = galaxy
  document.querySelector(`${PAGE_ID} #galaxy_max`).value = galaxy
  // set based on previously saved values
  loadSearchSettings(SETTINGS_NAME, SETTINGS_MAP)

  // make table sortable
  makeTableSortable(`${PAGE_ID} th.sortable`)
}
module.exports = {
  search,
  insertHtml
}
