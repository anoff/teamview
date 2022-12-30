/* globals  TM_setValue, TM_getValue, alert */

const { getCurrentPosition } = require('./utils')
const { missionTypes } = require('./gameUtils')

function storeValuesFleet1 () {
  const [g, s, p] = getCurrentPosition()
  const data = {
    targetGalaxy: parseInt(document.querySelector('content #galaxy').value),
    targetSystem: parseInt(document.querySelector('content #system').value),
    targetPosition: parseInt(document.querySelector('content #planet').value),
    targetIsMoon: document.querySelector('content #type').value === '3',
    fromGalaxy: g,
    fromSystem: s,
    fromPosition: p,
    fromIsMoon: false // TODO: Find out if it is a moon
  }
  TM_setValue('_fleet_tmp', data)
}

function submitFlight () {
  const missionIx = parseInt(Array.from(document.querySelectorAll('content input')).find(e => e.type === 'radio' && e.checked === true).value)
  const data = TM_getValue('_fleet_tmp')
  data.mission = missionTypes[missionIx]
  console.log(data)
  alert('see console')
  TM_setValue('_fleet_tmp', null)
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

  if (document.location.href.match(/page=fleetStep1/)) {
    const elm = Array.from(document.querySelectorAll('content input')).find(e => e.type === 'submit')
    elm.addEventListener('click', storeValuesFleet1)
  }
  if (document.location.href.match(/page=fleetStep2/)) {
    const elm = Array.from(document.querySelectorAll('content input')).find(e => e.type === 'submit')
    elm.addEventListener('click', submitFlight)
  }
}

module.exports = {
  init
}
