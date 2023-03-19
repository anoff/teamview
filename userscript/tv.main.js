'use strict'
/* globals  TM_setValue, TM_getValue */

const { teamviewDebugMode } = require('./utils')

/**
 * Add the HTML code & callbacks to modify teamview token in the settings.
 */
function addTokenOption () {
  if (window.location.search.includes('page=settings')) {
    function saveToken (e) {
      e.stopPropagation()
      const elm = document.querySelector('#teamview_token')
      TM_setValue('api_key', elm.value)
    }
    const anchor = document.querySelectorAll('form table tr')[6] // email address
    const saveBtn = Array.from(document.querySelectorAll('form table input')).find(e => e.type === 'submit')

    const nodeHTML = `<tr>
      <td style="height:22px;">Teamview Token</td>
      <td><input name="teamview_token" id="teamview_token" size="20" value="${TM_getValue('api_key')}"></td>
    </tr>`
    anchor.insertAdjacentHTML('afterend', nodeHTML)
    saveBtn.addEventListener('click', saveToken.bind(this))
  }
}

/**
 * Load all features in the ./feature folder.
 * @returns object containing all loaded features with key=filename, value=module code
 */
function loadFeatures () {
  const list = {}
  function importAll (r) {
    r.keys().forEach((key) => (list[key] = r(key)))
  }
  importAll(require.context('./features/', true, /\.(js|ts)$/))
  return list
}

function init () {
  addTokenOption()
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
