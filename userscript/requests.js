/* globals GM_xmlhttpRequest */

function getPlayerData (names) {
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

function uploadPlanets (data) {
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
        resolve(res)
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

module.exports = {
  uploadPlanets,
  getPlayerData
}
