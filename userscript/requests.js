/* globals TM_xmlhttpRequest, TM_getValue */

const TIMEOUT_S = 3 // timeout for request
const APIKEY = TM_getValue('api_key')
const APIURL = window.apiUrl

/**
 * Custom error in case API returns something other than 200
 */
class ApiError extends Error {
  constructor (message, response) {
    super(message)
    this.status = response.status
    this.statusText = response.statusText
    this.errorMessage = response.responseText
  }
}

function genericRequest (urlPath, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      url: `${APIURL}${urlPath}`,
      data,
      headers: {
        token: APIKEY,
        'content-type': 'application/json; charset=utf-8'
      },
      timeout: TIMEOUT_S * 1000,
      onload: function (res) {
        if (res.status === 200) {
          const data = JSON.parse(res.responseText)
          resolve(data)
        } else {
          const err = new ApiError(`Failed to ${method} ${urlPath}: ${res.statusText}`, res)
          reject(err)
        }
      },
      ontimeout: function (e) {
        const err = new ApiError(`Failed to ${method} ${urlPath}: Request Timeout`, { status: 408, statusText: 'Request Timeout' })
        reject(err)
      },
      onerror: e => reject(e)
    }
    if (!data) delete options.data
    return TM_xmlhttpRequest(options)
  })
}

function getPlayerData (names) {
  const namesArray = names.join(',')
  // console.log('sending request', namesArray)
  return genericRequest(`/v1/players/${namesArray}`, 'GET')
}

function deletePlanet (planet) {
  const location = `${planet.galaxy}:${planet.system}:${planet.position}`
  return genericRequest(`/v1/planets/${location}`, 'DELETE')
}

function uploadPlanets (data) {
  return genericRequest('/v1/planets/', 'POST', JSON.stringify({ planets: data }))
}

function uploadReports (data) {
  return genericRequest('/v1/reports/', 'POST', JSON.stringify({ reports: data }))
}

function uploadFlight (data) {
  return genericRequest('/v1/flights', 'POST', JSON.stringify(data))
}

/**
 * Get the latest report ids that were submitted by a token
 * @returns {Array[int]} list of report ids
 */
function getUploadedReports () {
  return genericRequest('/v1/reports?type=mine', 'GET')
}

/**
 * Get information about uploaded planets incl spy reports
 * @param {Array[string]} locations a list of locations in format <SYSTEM>:<GALAXY>:[POSITION]
 * @returns {Array[string]} list of redacted planet info only containing location info, updated_at time and latest report
 */
function getPlanetInfo (locations) {
  const locationsConc = locations.join(',')
  return genericRequest(`/v1/planets/${locationsConc}?type=report`, 'GET')
}

/**
 * Search the database for planets and reports.
 * @param {Object} query query parameters in object notation
 * @returns {Array[Object]} list of results
 */
function searchPlanets (query) {
  let q = ''
  for (const [k, v] of Object.entries(query)) {
    q += `${k}=${v}&`
  }
  return genericRequest(`/v1/planets?${q}`, 'GET')
}

/**
 * Search the database for specific reports.
 * @param {Object} query query parameters in object notation
 * @returns {Array[Object]} list of results
 */
function searchReports (query) {
  let q = ''
  for (const [k, v] of Object.entries(query)) {
    q += `${k}=${v}&`
  }
  return genericRequest(`/v1/reports?${q}&type=search`, 'GET')
}
module.exports = {
  deletePlanet,
  uploadPlanets,
  uploadReports,
  uploadFlight,
  getUploadedReports,
  getPlanetInfo,
  getPlayerData,
  searchPlanets,
  searchReports
}
