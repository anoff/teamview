'use strict'
/* globals  */

const gv = require('./galaxyview')
const req = require('./requests')
const pb = require('./planetBookmark')

function GM_addStyle (css) { // eslint-disable-line camelcase
  const style = document.getElementById('GM_addStyleBy8626') || (function () {
    const style = document.createElement('style')
    style.type = 'text/css'
    style.id = 'GM_addStyleBy8626'
    document.head.appendChild(style)
    return style
  })()
  const sheet = style.sheet
  sheet.insertRule(css, (sheet.rules || sheet.cssRules || []).length)
}

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
  GM_addStyle('.fadein-text { -webkit-animation: fadein 2s; animation: fadein 2s;}')
  GM_addStyle('@keyframes fadein { from { opacity: 0; } to { opacity: 1; }}')
  GM_addStyle('@-webkit-keyframes fadein { from { opacity: 0; } to { opacity: 1; }}')

  GM_addStyle('.dot { height: 7px; width: 7px; border-radius: 50%; display: inline-block;}')
  GM_addStyle('.status-ok { background-color: #00ee00; }')
  GM_addStyle('.status-error { background-color: #ee0000; }')
  GM_addStyle('.status-outdated { background-color: #eeee00; }')
  GM_addStyle('.status-unknown { background-color: #fff; }')
  GM_addStyle('.status-working { animation: status-animation 0.7s infinite; animation-direction: alternate; }')
  GM_addStyle('@keyframes status-animation { from {background-color: #fff;} to {background-color: #3ae;}}')

  gv.addColumn(2, ['Player Stats', 'Spio Info'])
  gv.addUploadSection()
  gv.modifyTable({}, gv.modifyAddRankFromPopup)
  pb.addShowFavoritesButton()
  pb.addBookmarkButton()
  const data = gv.getVisibleSystem()
  const players = data.map(e => e.playerName)
  const uniquePlayers = Array.from(new Set(players))
  if (uniquePlayers.length) {
    req.getPlayerData(uniquePlayers)
      .then(playerData => {
        return gv.modifyTable(playerData, gv.modifyAddPlayerStats)
      })
  }
}
