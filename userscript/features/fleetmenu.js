/* globals  TM_setValue, TM_getValue */

const { getCurrentPosition, teamviewDebugMode, setTeamviewStatus } = require('../utils')
const { missionTypes } = require('../gameUtils')
const { genericRequest } = require('../requests')

function storeValuesFleet1 () {
  const [g, s, p] = getCurrentPosition()
  const data = {
    toGalaxy: parseInt(document.querySelector('content #galaxy').value),
    toSystem: parseInt(document.querySelector('content #system').value),
    toPosition: parseInt(document.querySelector('content #planet').value),
    toIsMoon: document.querySelector('content #type').value === '3',
    fromGalaxy: g,
    fromSystem: s,
    fromPosition: p,
    fromIsMoon: false // TODO: Find out if it is a moon
  }
  TM_setValue('_fleet_tmp', data)
}

async function submitFlight (event) {
  const missionIx = parseInt(Array.from(document.querySelectorAll('content input')).find(e => e.type === 'radio' && e.checked === true).value)
  const data = TM_getValue('_fleet_tmp')
  data.mission = missionTypes[missionIx]
  data.date = new Date().toISOString()
  if (teamviewDebugMode) console.log({ submitFlight: data })

  setTeamviewStatus('status-working', 'Uploading flight data')
  try {
    await genericRequest('/v1/flights', 'POST', JSON.stringify(data))
    setTeamviewStatus('status-ok', 'Success')
  } catch (e) {
    setTeamviewStatus('status-error', 'Failed, see console')
    console.error(e)
  }

  TM_setValue('_fleet_tmp', null)
}

function addUploadSection () {
  if (!document.location.href.match(/page=fleetStep2/)) return
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
  const row = Array.from(document.querySelectorAll('content form table tr')).slice(-1)[0]

  row.insertAdjacentHTML('afterend', sectionHTML)
  document.getElementById('teamview-upload').addEventListener('click', submitFlight)

  document.onkeydown = function (e) {
    e = e || window.event
    switch (e.key || e.keyCode) {
      case 'Enter':
      case ' ':
        submitFlight()
        break
    }
  }
}

function init () {
  if (document.location.href.match(/page=fleetTable.+?send_ship/)) {
    const ships = [...document.location.hash.matchAll(/send_ship\[(?<shiptype>[0-9]+)\]=(?<shipamount>[0-9]+)/g)]
    ships.forEach(ship => {
      const input = document.querySelector(`input#ship${ship.groups.shiptype}_input`)
      if (input !== null) {
        input.value = ship.groups.shipamount
      }
    })
  }

  // save temporary data from second fleetscreen (target and start location)
  if (document.location.href.match(/page=fleetStep1/)) {
    const elm = Array.from(document.querySelectorAll('content input')).find(e => e.type === 'submit')
    elm.addEventListener('click', storeValuesFleet1)
  }
  // submit when hitting upload button on third screen (get mission type)
  if (document.location.href.match(/page=fleetStep2/)) {
    addUploadSection()
  }
}

module.exports = {
  init
}