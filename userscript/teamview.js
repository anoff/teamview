'use strict'
/* globals  */

const gv = require('./galaxyview')
const pb = require('./planetBookmark')
const { SpioParser } = require('./spioParser')
const sp = new SpioParser()

function addMenuButton () {
  // add button to menu
  const listEntry = document.createElement('li')
  const listLink = document.createElement('a')
  listLink.href = '#'
  listLink.onclick = showSettings
  listLink.text = 'Teamview'
  listEntry.appendChild(listLink)
  const ref = document.getElementById('menu').children[24]
  ref.insertAdjacentElement('afterend', listEntry)
}

function showSettings () {
  Array.from(document.querySelector('content').children).forEach(c => c.remove())
}

addMenuButton()

if (window.location.search.includes('page=galaxy')) {
  gv.init()
  pb.addShowFavoritesButton()
  pb.addBookmarkButton()
}

if (sp.isSpioPage()) {
  const messages = sp.getMessages()
  const data = messages.map(e => sp.parse_text(e))
  console.log(data)
}
