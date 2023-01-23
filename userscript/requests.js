/* globals TM_xmlhttpRequest, TM_getValue */

const TIMEOUT_S = 3 // timeout for request
const API_KEY = TM_getValue('api_key')
const API_URL = window.apiUrl



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

/**
 * Generic API call against the configured API.
 * Authentication token and base url are already provided.
 * @param {string} urlPath url that should be called
 * @param {string} method HTTP method, defaults to GET
 * @param {string} data payload to send (if JSON, stringify it first)
 * @returns Promise
 */
function genericRequest (urlPath, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      url: `${API_URL}${urlPath}`,
      data,
      headers: {
        token: API_KEY,
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
      onerror: e => reject(JSON.stringify(e))
    }
    if (!data) delete options.data
    return TM_xmlhttpRequest(options)
  })
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

module.exports = {
  searchPlanets,
  genericRequest
}
