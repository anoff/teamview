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
    const elm = Array.from(document.querySelectorAll('content input')).find(e => e.type === 'submit')
    elm.addEventListener('click', submitFlight)
  }
}

module.exports = {
  init
}
