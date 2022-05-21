const { home: homeHtml } = require('./stationHtml')
function showStation () {
  Array.from(document.querySelector('content').children).forEach(c => c.remove())
  document.querySelector('content').insertAdjacentHTML('afterbegin', homeHtml)
}

module.exports = {
  showStation
}
