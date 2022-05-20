/* globals TM_xmlhttpRequest */

function getPlayerData (names) {
  const namesArray = names.join(',')
  console.log('sending request', namesArray)
  return new Promise((resolve, reject) => TM_xmlhttpRequest({
    method: 'GET',
    url: `${apiUrl}/v1/players/${namesArray}`,
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

function deletePlanet (planet) {
  const TIMEOUT_S = 2

  const location = `${planet.galaxy}:${planet.system}:${planet.position}`
  return new Promise((resolve, reject) => TM_xmlhttpRequest({
    method: 'DELETE',
    url: `${apiUrl}/v1/planets/${location}`,
    headers: {
      token: 'TOKEN_pocket-wind-swung-barn',
      'content-type': 'application/json; charset=utf-8'
    },
    timeout: TIMEOUT_S * 1000,
    onload: function (res) {
      if (res.status === 200) {
        resolve(res)
      } else {
        const err = {
          status: res.status,
          statusText: res.statusText,
          error: res.responseText
        }
        console.warn('Error while deleting planet', err)
        reject(new Error('Error while deleting planet'))
      }
    },
    ontimeout: () => reject(new Error(`Timeout: Response did not arrive in ${TIMEOUT_S} seconds`)),
    onerror: e => reject(e)
  }))
}

function uploadPlanets (data) {
  const TIMEOUT_S = 2
  return new Promise((resolve, reject) => TM_xmlhttpRequest({
    method: 'POST',
    url: `${apiUrl}/v1/planets`,
    data: JSON.stringify({ planets: data }),
    headers: {
      token: 'TOKEN_pocket-wind-swung-barn',
      'content-type': 'application/json; charset=utf-8'
    },
    timeout: TIMEOUT_S * 1000,
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
    },
    ontimeout: () => reject(new Error(`Timeout: Response did not arrive in ${TIMEOUT_S} seconds`)),
    onerror: e => reject(e)
  }))
}

function uploadSpio (data) {
  const TIMEOUT_S = 2
  return new Promise((resolve, reject) => TM_xmlhttpRequest({
    method: 'POST',
    url: `${apiUrl}/v1/planets`,
    data: JSON.stringify({ planets: data }),
    headers: {
      token: 'TOKEN_pocket-wind-swung-barn',
      'content-type': 'application/json; charset=utf-8'
    },
    timeout: TIMEOUT_S * 1000,
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
    },
    ontimeout: () => reject(new Error(`Timeout: Response did not arrive in ${TIMEOUT_S} seconds`)),
    onerror: e => reject(e)
  }))
}
/**
 * Check which planets in a given system are already known
 * @param {Array[string]} locations a list of locations in format <SYSTEM>:<GALAXY>:[POSITION]
 * @returns {Array[string]} list of redacted planet info only containing location info and updatedAt time
 */
function getPlanetUploadStatus (locations) {
  const TIMEOUT_S = 2
  const locationsConc = locations.join(',')
  return new Promise((resolve, reject) => TM_xmlhttpRequest({
    method: 'GET',
    url: `${apiUrl}/v1/planets/${locationsConc}?type=exists`,
    headers: {
      token: 'TOKEN_pocket-wind-swung-barn',
      'content-type': 'application/json; charset=utf-8'
    },
    timeout: TIMEOUT_S * 1000,
    onload: function (res) {
      if (res.status === 200) {
        resolve(res)
      } else {
        const err = {
          status: res.status,
          statusText: res.statusText,
          error: res.responseText
        }
        console.warn('Failed to request planet info from teamview server', err)
        reject(new Error('Failed to request planet info from teamview server'))
      }
    },
    ontimeout: () => reject(new Error(`Timeout: Response did not arrive in ${TIMEOUT_S} seconds`)),
    onerror: e => reject(e)
  }))
}
module.exports = {
  deletePlanet,
  uploadPlanets,
  uploadSpio,
  getPlanetUploadStatus,
  getPlayerData
}
