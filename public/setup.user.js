// ==UserScript==
// @name         teamview_proxy
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  augment your view by sharing info with your team
// @author       joghurtrucksack
// @match        https://pr0game.com/game.php*
// @match        https://www.pr0game.com/game.php*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      http://localhost:3000/
// ==/UserScript==

/* globals unsafeWindow, GM_getValue, GM_setValue, GM_xmlhttpRequest */
(function teamviewInit () {
  // const version = GM_getValue('version') || '1.0.0'
  const apiKey = GM_getValue('api_key')
  const debugMode = GM_getValue('debug_mode') === 1
  const developerMode = GM_getValue('developer_mode') === 1
  const apiUrl = developerMode ? 'http://localhost:3000/' : 'https://tbd.com/'

  // document.querySelector('head').insertAdjacentHTML('beforeend', `<link rel="stylesheet" href="${apiUrl}skin.css">`)
  // document.querySelector('body').insertAdjacentHTML('beforeend', `<script type="text/javascript" src="${apiUrl}teamview.js"></script>`)
  const s = document.createElement('script')
  s.type = 'text/javascript'
  s.src = `${apiUrl}teamview.js`
  // $('body').append(`<script type="text/javascript" src="${apiUrl}teamview.js"></script>`)
  document.querySelector('body').appendChild(s)

  // unsafeWindow.xmlhttpRequest = function (options) {
  //   return GM_xmlhttpRequest(options)
  // }

  unsafeWindow.xmlhttpRequest = GM_xmlhttpRequest
  unsafeWindow.setValue = function (key, value) {
    return GM_setValue(key, value)
  }

  unsafeWindow.getValue = function (key) {
    return GM_getValue(key)
  }

  unsafeWindow.apiKey = apiKey
  unsafeWindow.debugMode = debugMode
  unsafeWindow.apiUrl = apiUrl
})()
