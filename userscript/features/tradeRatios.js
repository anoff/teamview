/* globals  TM_setValue, TM_getValue */

const { teamviewDebugMode } = require('../utils')

function init () {
  if (!(window.location.search.includes('page=marketPlace'))) return
  TradeRatios.parseMarketPlace()
}

class TradeRatios {
  static parseMarketPlace () {
    const ratios = {
      metal: document.querySelector('input[name=ratio-metal]').value || 4,
      crystal: document.querySelector('input[name=ratio-cristal]').value || 1,
      deuterium: document.querySelector('input[name=ratio-deuterium]').value || 1
    }

    this.update(ratios)
  }

  static update (ratios) {
    TM_setValue('trade-ratios', JSON.stringify(ratios))
  }

  static get () {
    const defaultRatios = { metal: 4, crystal: 1, deuterium: 1 }
    const ratiosString = TM_getValue('trade-ratios')

    try {
      const ratios = JSON.parse(ratiosString)

      return {
        metal: ratios.metal || defaultRatios.metal,
        crystal: ratios.crystal || defaultRatios.crystal,
        deuterium: ratios.deuterium || defaultRatios.deuterium
      }
    } catch (error) {
      if (teamviewDebugMode) {
        console.log('Couldn\'t parse trade ratios, setting default ratios')
        console.log(error)
      }
      this.update(defaultRatios)
    }

    return defaultRatios
  }
}

module.exports = {
  init,
  TradeRatios
}
