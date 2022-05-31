const { home: homeHtml } = require('./stationHtml')
const { report2html } = require('./spioHtml')
const req = require('./requests')

function showStation () {
  Array.from(document.querySelector('content').children).forEach(c => c.remove())
  document.querySelector('content').insertAdjacentHTML('afterbegin', homeHtml)
  const btn = document.querySelector('button#station-search')
  btn.addEventListener('click', search.bind(this))
}

function search () {
  function getQuery () {
    const fields = ['player_name', 'rank_min', 'rank_max', 'alliance_name', 'galaxy_min', 'galaxy_max', 'system_min', 'system_max', 'inactive', 'vacation', 'banned', 'require_report', 'report_maxage']
    const query = {}
    for (const f of fields) {
      const elm = document.querySelector(`#${f}`)
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
  const rows = Array.from(document.querySelector('table#search-results').querySelectorAll('tr'))
  const rowsWithPlanets = rows.slice(ROWS_HEADER, rows.length - ROWS_BOTTOM_KEEP)
  for (const row of rowsWithPlanets) {
    row.remove()
  }
}

function calcTimeDeltaString (date) {
  let deltastring = '-'
  const seconds = Math.round((new Date() - new Date(date)) / 1000)
  if (!seconds) return deltastring
  let hours = 0
  let minutes = 0
  hours = Math.floor(seconds / 3600)
  minutes = Math.floor((seconds - hours * 3600) / 60)
  deltastring = `${minutes} min`
  if (hours) {
    deltastring = `${hours} hrs ${deltastring}`
  }
  return deltastring
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
  const colRow = document.querySelector('table#search-results').querySelectorAll('tr')[ROWS_HEADER - 1]
  const playerStatus2Indicator = (player) => {
    const text = ['isInactive', 'isBanned', 'isVacation']
      .filter(k => player[k])
      .map(k => k.split('')[2].toLocaleLowerCase())
      .join(',')
    if (!text) return ''
    return `(${text})`
  }
  const debris2Text = (metal, crystal) => {
    if (metal + crystal > 0) {
      return `🪨${metal} / 🔮${crystal}`
    } else {
      return ''
    }
  }
  for (const p of planets) {
    const html = `<tr id="row-${p.planetId}">
    <td><a href="game.php?page=galaxy&galaxy=${p.galaxy}&system=${p.system}">${p.galaxy}:${p.system}:${p.position}</a></td>
    <td>${p.player.playerName}${p.player ? ' ' + playerStatus2Indicator(p.player) : ''}</td>
    <td>${p.planetName}</td>
    <td>${p.moonId ? '🌝' : ''}</td>
    <td>${debris2Text(p.debrisMetal, p.debrisCrystal)}</td>
    <td>${p.player.alliance || ''}</td>
    <td>
      <a id="scan-${p.planetId}" alt="spy on plane" href="javascript:doit(6,${p.planetId},{'210':'2'});">${p.planetId ? ' 🔍 ' : ''}</a>
      <a href="#" class="tooltip_sticky" data-tooltip-content="${report2html(p.report)}" style="${!p.report ? 'display: none;' : ''}">${p.report ? ' 🛰 ' : ''}<span style="font-size: 85%;">${calcTimeDeltaString(p.report?.date)}</span></a>
    </td>
    </tr>`
    colRow.insertAdjacentHTML('afterend', html)
  }
}

module.exports = {
  showStation
}
