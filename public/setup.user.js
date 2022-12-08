// ==UserScript==
// @name         teamview
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  augment your view by sharing info with your team
// @author       joghurtrucksack
// @match        https://pr0game.com/game.php*
// @match        https://www.pr0game.com/game.php*
// @match        https://www.pr0game.com/uni*/game.php*
// @match        https://pr0game.com/uni*/game.php*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @connect      localhost
// @connect      teamview.mietemieze.de
// @run-at       document-start
// ==/UserScript==

/* globals unsafeWindow, GM_getValue, GM_setValue, GM_xmlhttpRequest */
(function teamviewInit () {
  // const version = GM_getValue('version') || '1.0.0'
  const debugMode = GM_getValue('debug_mode') === 1
  const developerMode = GM_getValue('developer_mode') === 1
  let apiUrl = developerMode ? 'http://localhost:3000' : 'https://teamview.mietemieze.de'

  // remove trailing slashes
  apiUrl = apiUrl.replace(/\/+$/, '')

  document.addEventListener('DOMContentLoaded', function (event) {
    // add one script to header to modify DOM before render
    const sheader = document.createElement('script')
    sheader.type = 'text/javascript'
    sheader.src = `${apiUrl}/teamview.header.bundle.js`
    document.querySelector('header').appendChild(sheader)

    // and one to body to modify after content is there (data loaded completetely)
    const sbody = document.createElement('script')
    sbody.type = 'text/javascript'
    sbody.src = `${apiUrl}/teamview.body.bundle.js`
    document.querySelector('body').appendChild(sbody)

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
  })
})()
