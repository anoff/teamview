/* globals  TM_setValue, TM_getValue */

const { getCurrentPosition, teamviewDebugMode } = require('./utils')
const { missionTypes } = require('./gameUtils')
const { uploadFlight } = require('./requests')

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

function submitFlight (event) {
  const chk = document.querySelector('#submit_flight')
  TM_setValue('submit_flight', chk.checked)
  if (chk.checked === false) return
  event.preventDefault()
  const missionIx = parseInt(Array.from(document.querySelectorAll('content input')).find(e => e.type === 'radio' && e.checked === true).value)
  const data = TM_getValue('_fleet_tmp')
  data.mission = missionTypes[missionIx]
  data.date = new Date().toISOString()
  if (teamviewDebugMode) console.log({ submitFlight: data })
  uploadFlight(data)
  TM_setValue('_fleet_tmp', null)
  event.target.form.submit()
}

function injectSubmitFleetCheckbox () {
  if (!document.location.href.match(/page=fleetStep2/)) return
  let isChecked = TM_getValue('submit_flight')
  if (isChecked === undefined) isChecked = true
  const row = Array.from(document.querySelectorAll('content form table tr')).slice(-1)[0]
  row.insertAdjacentHTML('afterend', '<tr><td colspan="2"><input type="checkbox" id="submit_flight" unchecked=""><label for="submit_flight">Submit Flight</label></td></tr>')
  const chk = document.querySelector('#submit_flight')
  chk.checked = isChecked
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
  // submit when hitting send on third screen (get mission type)
  if (document.location.href.match(/page=fleetStep2/)) {
    injectSubmitFleetCheckbox()
    const elm = Array.from(document.querySelectorAll('content input')).find(e => e.type === 'submit')
    elm.addEventListener('click', submitFlight)
  }
}

module.exports = {
  init
}
