const { GM_addStyle } = require('./utils') // eslint-disable-line camelcase

function addStyles () {
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
}

function setStatus (cssClass, text) {
  const iconElm = document.getElementById('teamview-status-icon')
  const textElm = document.getElementById('teamview-status-text')
  iconElm.classList = `dot ${cssClass}`
  textElm.innerText = text
}
module.exports = {
  addStyles,
  setStatus
}
