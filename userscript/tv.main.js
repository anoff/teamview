'use strict'

const { teamviewDebugMode } = require('./utils')

/**
 * Load all features in the ./feature folder.
 * @returns object containing all loaded features with key=filename, value=module code
 */
function loadFeatures () {
  const list = {}
  function importAll (r) {
    r.keys().forEach((key) => (list[key] = r(key)))
  }
  importAll(require.context('./features/', true, /\.js$/))
  return list
}

function init () {
  const loadedFeatures = loadFeatures()
  for (const name in loadedFeatures) {
    const obj = loadedFeatures[name]
    if (teamviewDebugMode) console.log(`Initializing feature: ${name}`)
    obj.init()
  }
}

module.exports = {
  init
}
