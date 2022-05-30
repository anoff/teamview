'use strict'
/* globals  */

const { showStation } = require('./station')

function addMenuButton () {
  // add button to menu
  const listEntry = document.createElement('li')
  const listLink = document.createElement('a')
  listLink.href = '#'
  listLink.onclick = showStation
  listLink.text = 'Teamview'
  listEntry.appendChild(listLink)
  const ref = document.getElementById('menu').children[13]
  ref.insertAdjacentElement('afterend', listEntry)
}

function init () {
  addMenuButton()
}

init()
