const { home: homeHtml } = require('./stationHtml')
const req = require('./requests')

function showStation () {
  Array.from(document.querySelector('content').children).forEach(c => c.remove())
  document.querySelector('content').insertAdjacentHTML('afterbegin', homeHtml)
  const btn = document.querySelector('button#station-search')
  btn.addEventListener('click', search.bind(this))
}

function search () {
  function getQuery () {
    const fields = ['player_name', 'rank_min', 'rank_max', 'alliance_name', 'galaxy_min', 'galaxy_max', 'system_min', 'system_max', 'inactive', 'vacation', 'banned']
    const query = {}
    for (const f of fields) {
      const elm = document.querySelector(`#${f}`)
      query[f] = elm.value
    }
    return query
  }

  const query = getQuery()
  req.searchPlanets(query)
}
module.exports = {
  showStation
}
