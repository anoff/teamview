'use strict'
const { showStation } = require('./features/teamview')
const { init: initMain } = require('./tv.main')

/**
 * Inject a game-styled button into the left side nav menu.
 * @param {string} text Some string that should be displayed as button text
 * @param {string} href where the button should link to
 */
function addMenuButton (text, href) {
  // add button to menu
  const listEntry = document.createElement('li')
  const listLink = document.createElement('a')
  listLink.href = href
  listLink.text = text
  listEntry.appendChild(listLink)
  const ref = document.getElementById('menu').children[13]
  ref.insertAdjacentElement('afterend', listEntry)
}

function init () {
  addMenuButton('Teamview', `${window.location.pathname}?page=galaxy&tv=station`)
  if (window.location.search.includes('tv=station')) {
    showStation()
  }
}

init()
initMain()
