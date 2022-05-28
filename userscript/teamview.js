'use strict'
/* globals  */

const gv = require('./galaxyview')
const pb = require('./planetBookmark')
const sp = require('./spioParser')
const { showStation } = require('./station')

function addMenuButton () {
  // add button to menu
  const listEntry = document.createElement('li')
  const listLink = document.createElement('a')
  listLink.href = '#'
  listLink.onclick = showStation
  listLink.text = 'Teamview'
  listEntry.appendChild(listLink)
  const ref = document.getElementById('menu').children[12]
  ref.insertAdjacentElement('afterend', listEntry)
}

addMenuButton()

if (window.location.search.includes('page=galaxy')) {
  gv.init()
  pb.init()
}

sp.init()
