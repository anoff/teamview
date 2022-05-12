'use strict'
/* globals GM_xmlhttpRequest */

const gv = require('./galaxyview')

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

function requestPlayerData (names) {
  const namesArray = names.join(',')
  console.log('sending request', namesArray)
  return new Promise((resolve, reject) => GM_xmlhttpRequest({
    method: 'GET',
    url: `http://localhost:3000/v1/players/${namesArray}`,
    headers: {
      token: 'TOKEN_pocket-wind-swung-barn'
    },
    onload: function (res) {
      if (res.status === 200) {
        const data = JSON.parse(res.responseText)
        resolve(data)
      } else {
        console.warn('Error occured while trying to fetch data from teamview server', res.status, res.statusText)
        reject(new Error('Failed to fetch data from teamview server'))
      }
    }
  }))
}

function uploadPlanets () {
  const data = gv.getVisibleSystem()
  console.log('uploading', data)

  return new Promise((resolve, reject) => GM_xmlhttpRequest({
    method: 'POST',
    url: 'http://localhost:3000/v1/planets',
    data: JSON.stringify({ planets: data }),
    headers: {
      token: 'TOKEN_pocket-wind-swung-barn',
      'content-type': 'application/json; charset=utf-8'
    },
    onload: function (res) {
      if (res.status === 200) {
        resolve()
      } else {
        const err = {
          status: res.status,
          statusText: res.statusText,
          error: res.responseText
        }
        console.warn('Error while sending planet information to server', err)
        reject(new Error('Failed to send planet data to teamview server'))
      }
    }
  }))
}
addMenuButton()

if (window.location.search.includes('page=galaxy')) {
  GM_addStyle('.fadein-text { -webkit-animation: fadein 2s; animation: fadein 2s;}')
  GM_addStyle('@keyframes fadein { from { opacity: 0; } to { opacity: 1; }}')
  GM_addStyle('@-webkit-keyframes fadein { from { opacity: 0; } to { opacity: 1; }}')

  gv.addColumn(2, ['Player Stats', 'Spio Info'])
  gv.addUploadButton(uploadPlanets)
  gv.modifyTable({}, gv.modifyAddRankFromPopup)
  const data = gv.getVisibleSystem()
  const players = data.map(e => e.playerName)
  const uniquePlayers = Array.from(new Set(players))
  requestPlayerData(uniquePlayers)
    .then(playerData => {
      return gv.modifyTable(playerData, gv.modifyAddPlayerStats)
    })
}
