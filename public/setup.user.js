// ==UserScript==
// @name         teamview
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  augment your view by sharing info with your team
// @author       joghurtrucksack
// @match        https://pr0game.com/game.php*
// @match        https://www.pr0game.com/game.php*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      localhost
// @connect      teamview.mietemieze.de
// ==/UserScript==

/* globals unsafeWindow, GM_getValue, GM_setValue, GM_xmlhttpRequest */
(function teamviewInit () {
  // const version = GM_getValue('version') || '1.0.0'
  const debugMode = GM_getValue('debug_mode') === 1
  const developerMode = GM_getValue('developer_mode') === 1
  let apiUrl = developerMode ? 'http://localhost:3000' : 'https://teamview.mietemieze.de'

  // remove trailing slashes
  apiUrl = apiUrl.replace(/\/+$/, '')
  const s = document.createElement('script')
  s.type = 'text/javascript'
  s.src = `${apiUrl}/teamview.js`
  document.querySelector('body').appendChild(s)

  const styles = ['teamview.css']
  for (const ss of styles) {
    const s = document.createElement('link')
    s.type = 'text/css'
    s.rel = 'stylesheet'
    s.href = `${apiUrl}/${ss}`
    document.querySelector('head').appendChild(s)
  }

  // pass TM functions to window
  unsafeWindow.TM_xmlhttpRequest = GM_xmlhttpRequest
  unsafeWindow.TM_setValue = GM_setValue
  unsafeWindow.TM_getValue = GM_getValue

  unsafeWindow.debugMode = debugMode
  unsafeWindow.apiUrl = apiUrl
})()
