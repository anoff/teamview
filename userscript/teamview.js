'use strict'
/* globals  TM_setValue, TM_getValue */

const gv = require('./galaxyview')
const pb = require('./planetBookmark')
const sp = require('./spioParser')

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

if (window.location.search.includes('page=galaxy') && window.location.hash !== '#teamview-station') {
  gv.init()
  pb.init()
}

addTokenOption()
sp.init()
