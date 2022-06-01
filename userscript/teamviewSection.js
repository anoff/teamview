function setStatus (cssClass, text) {
  const iconElm = document.getElementById('teamview-status-icon')
  const textElm = document.getElementById('teamview-status-text')
  iconElm.classList = `dot ${cssClass}`
  textElm.innerText = text
}
module.exports = {
  setStatus
}
