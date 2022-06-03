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
}

module.exports = {
  init
}
