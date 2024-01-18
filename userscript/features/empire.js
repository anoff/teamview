const { teamviewDebugMode, setTeamviewStatus } = require('../utils')
const { genericRequest } = require('../requests')
const { itemId2name } = require('../gameUtils')
const { LocalStorage, Empire } = require('./storage.ts')
// const { parse } = require('path')

/**
 * Parse empire page into fake espionage reports.
 * @returns Array of objects that are espionage reports with reportType='empire'
 */
function parseEmpirePage () {
  const ROW_PLANETS = 1
  const ROW_LOCATION = 3
  const table = document.querySelector('content table:not(.teamview)')

  const planetIds = Array.from(table.querySelectorAll('tr')[ROW_PLANETS].querySelectorAll('td a'))
    .map(e => e.href.split('cp=')[1])
    .map(e => parseInt(e))

  const locations = Array.from(table.querySelectorAll('tr')[ROW_LOCATION].querySelectorAll('td a'))
    .map(e => e.text.slice(1, -1).split(':').map(n => parseInt(n)))

  function getObjectPerGroup (selector) {
    const obj = Array.from(table.querySelectorAll(selector))
      .map(row => {
        const id = parseInt(row.getAttribute('data-info').split('_')[1])
        const values = Array.from(row.querySelectorAll('td'))
          .slice(2)
          .map(e => parseInt(e.innerText))
        const obj = {}
        obj[itemId2name(id)] = values
        return obj
      })
      .reduce((p, c) => Object.assign(p, c), {})
    // convert obj into array
    const list = []
    const names = Object.keys(obj)
    for (let i = 0; i < obj[names[0]].length; i++) {
      const o = {}
      for (const n of names) {
        const count = obj[n][i]
        if (count > 0) o[n] = count
      }
      list.push(o)
    }
    return list
  }
  const ships = getObjectPerGroup('tr[data-info^="f_"]')
  const research = getObjectPerGroup('tr[data-info^="t_"]')
  const buildings = getObjectPerGroup('tr[data-info^="b_"]')
  const defense = getObjectPerGroup('tr[data-info^="d_"]')
  const resources = getObjectPerGroup('tr[data-info^="r_"]')

  const reports = []
  for (let i = 0; i < planetIds.length; i++) {
    const report = {
      reportType: 'empire',
      reportId: Math.floor(new Date().getTime() / 1000) + locations[i].join(''),
      galaxy: locations[i][0],
      system: locations[i][1],
      position: locations[i][2],
      date: new Date().toISOString(),
      resources: resources[i],
      isMoon: false,
      buildings: buildings[i],
      ships: ships[i],
      research: research[i],
      defense: defense[i]
    }
    reports.push(report)
  }
  if (teamviewDebugMode) console.log({ empireReports: reports })
  return reports
}

/**
 * Add teamview upload buttons to top of the page.
 */
function injectUploadSection () {
  const html = `
    <div id="tv-section" class="teamview">
      <tbody>
        <tr>
          <th>Teamview</th>
          <td><button type="button" id="teamview-upload">Upload</button></td>
          <td><span style="font-weight: bold;">Status</span></div></td>
          <td><span id="teamview-status-icon" class="dot status-unknown"></td>
          <td><span id="teamview-status-text" style="font-size: 85%;"></span></td>
      </tr>
    </tbody>
  </div>
  `
  document.querySelector('content table').insertAdjacentHTML('beforebegin', html)
  document.getElementById('teamview-upload').addEventListener('click', uploadEmpire)

  document.onkeydown = function (e) {
    e = e || window.event
    switch (e.key || e.keyCode) {
      case 'Enter':
      case ' ':
        uploadEmpire()
        break
    }
  }
}

/**
 * Start the API call and update the teamview status indicator.
 */
async function uploadEmpire () {
  const reports = parseEmpirePage()
  try {
    const { totalCount, successCount } = await genericRequest('/v1/reports/', 'POST', JSON.stringify({ reports }))
    setTeamviewStatus('status-ok', `Submitted ${successCount}/${totalCount}`)
  } catch (e) {
    let errMessage = 'Error'
    if (e.status) {
      errMessage += ` [${e.status}]`
    }
    errMessage += ', see console'
    setTeamviewStatus('status-error', errMessage)
    console.error(e)
  }
}

function isEmpirePage () {
  return window.location.search.includes('page=imperium') && !window.location.search.includes('tv=acs-planner')
}

function init () {
  if (isEmpirePage()) {
    injectUploadSection()
    const empirePage = parseEmpirePage() ?? []
    const empire = new Empire(empirePage, empirePage[0].research)
    LocalStorage.saveEmpire(empire)
  }
}

module.exports = {
  init
}
