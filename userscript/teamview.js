'use strict'
/* globals  TM_setValue, TM_getValue */

const gv = require('./galaxyview')
const pb = require('./planetBookmark')
const sp = require('./spioParser')
const { capitalCase } = require('change-case')

const stationSearch = require('./stationSearch')
const stationStatus = require('./stationStatus')
const stationSearchReports = require('./stationSearchReports')

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

function showStation () {
  Array.from(document.querySelector('content').children).forEach(c => c.remove())

  const anchor = document.querySelector('content')
  insertSelectorHtml(anchor)
  stationSearch.insertHtml(anchor)
  stationSearchReports.insertHtml(anchor)
  stationStatus.insertHtml(anchor)

  activatePage('search-planets')
}

function insertSelectorHtml (anchor) {
  const pages = ['search-planets', 'search-reports', 'status'] // should be the top div id in the corresponding html, see stationSearch.html
  let html = '<div class="planeto" id="station-page-selector">'
  for (const [ix, p] of Object.entries(pages)) {
    if (ix > 0) html += '<span> | </span>'
    html += `<button id='selector-${p}'>${capitalCase(p)}</button>`
  }
  html += '</div>'
  anchor.insertAdjacentHTML('beforeend', html)

  Array.from(document.querySelectorAll('#station-page-selector button')).forEach(btn => {
    const target = btn.id.replace(/^selector-/, '')
    btn.addEventListener('click', activatePage.bind(this, target))
  })
}

function activatePage (id) {
  Array.from(document.querySelectorAll('.station.page')).forEach(e => { e.classList.add('hidden') })
  document.querySelector(`.station.page#${id}`).classList.remove('hidden')

  Array.from(document.querySelectorAll('#station-page-selector button')).forEach(e => { e.classList.remove('selected') })
  document.querySelector(`#station-page-selector button#selector-${id}`).classList.add('selected')
}

function init () {
  if (window.location.search.includes('page=galaxy') && window.location.hash !== '#teamview-station') {
    gv.init()
    pb.init()
  }

  addTokenOption()
  sp.init()
}

module.exports = {
  showStation,
  init
}
