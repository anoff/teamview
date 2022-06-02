'use strict'
const { showStation, init: initMain } = require('./teamview')

function addMenuButton () {
  // add button to menu
  const listEntry = document.createElement('li')
  const listLink = document.createElement('a')
  listLink.href = '/game.php?page=galaxy#teamview-station'
  listLink.onclick = showStation
  listLink.text = 'Teamview'
  listEntry.appendChild(listLink)
  const ref = document.getElementById('menu').children[13]
  ref.insertAdjacentElement('afterend', listEntry)
}

function init () {
  addMenuButton()
  if (window.location.hash === '#teamview-station') {
    showStation()
  }
}

init()
initMain()
