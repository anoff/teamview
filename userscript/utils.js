/* globals  TM_setValue, TM_getValue */

/**
 * Read the current active planet position from the planet menu.
 * @returns Array[int] Galaxy, System, Position
 */
function getCurrentPosition () {
  const [g, s, p] = Array.from(document.querySelector('#planetSelector').children).find(e => e.selected).text.split(' [')[1].slice(0, -1).split(':').map(e => parseInt(e))
  return [g, s, p]
}

/**
 * Convert galaxy, system, planet information into a single integer
 * @param {int} galaxy planet galaxy
 * @param {int} system
 * @param {int} position
 * @returns int calculated as galaxy * 1000000 + system * 1000 + position
 */
function pos2location (galaxy, system, position) {
  return galaxy * 1000000 + system * 1000 + position
}

/**
 * Convert single integer location to galaxy, system, position
 * @param {int} location galaxy * 1000000 + system * 1000 + position
 * @returns Array [galaxy, system, position]
 */
function location2pos (location) {
  const position = location % 1000
  const system = Math.floor(location / 1000) % 1000
  const galaxy = Math.floor(location / 1000000)
  return [galaxy, system, position]
}

/**
 * Calculate the n-th quantile for the given values.
 * @param {Array[Number]} arr Input array containing all values
 * @param {Number} q Quantile 0..1
 * @returns {Number} The value where q% of all values are included
 */
function quantile (arr, q) {
  const sorted = arr.sort((a, b) => a - b)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base])
  } else {
    return sorted[base]
  }
}

function saveSearchSettings (TMvarName, settingsMap) {
  const settings = TM_getValue(TMvarName) || {}
  for (const [name, [selector, fn]] of Object.entries(settingsMap)) {
    let value = document.querySelector(selector).value
    if (fn) value = fn(value)
    settings[name] = value
  }
  TM_setValue(TMvarName, settings)
}

function loadSearchSettings (TMvarName, settingsMap) {
  const settings = TM_getValue(TMvarName) || {}
  for (const [name, [selector]] of Object.entries(settingsMap)) {
    const value = settings[name]
    document.querySelector(selector).value = value
  }
}

/**
 * Add click events to table headers to make them sortable.
 * Table structure needs to consist of <table><thead><th to click/></thead><tbody><tr to sort/>
 * @param {string} thSelector querySelector() string to select all table headers that should be sortable
 */
function makeTableSortable (thSelector) {
  const getCellValue = (tr, idx) => {
    const c = tr.children[idx]
    const val = c.innerText || c.textContent
    const data = c.getAttribute('data-value')
    if (data) return data
    else return val
  }
  const comparer = (idx, asc) => (a, b) => ((v1, v2) =>
    v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
  )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx))

  document.querySelectorAll(thSelector).forEach(th => th.addEventListener('click', () => {
    const tbody = th.closest('table').querySelector('tbody')
    Array.from(tbody.querySelectorAll('tr'))
      .sort(comparer(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
      .forEach(tr => tbody.appendChild(tr))
  }))
}

/**
 * Set color/text of the teamview status indicator (dot on top).
 * @param {string}  cssClass  which color to use (status-ok, status-working, status-error, status-outdated)
 * @param {string}  text      a text string that is displayed next to the status indicator
 */
function setTeamviewStatus (cssClass, text = '') {
  const iconElm = document.getElementById('teamview-status-icon')
  const textElm = document.getElementById('teamview-status-text')
  if (textElm) {
    textElm.innerText = text
  }
  iconElm.classList = `dot ${cssClass}`
}

/**
 * Convert single integer location to string representation
 * @param {int} location galaxy * 1000000 + system * 1000 + position
 * @returns Formatted string [3:23:10]
 */
function location2str (location) {
  const [g, s, p] = location2pos(location)
  return `[${g}:${s}:${p}]`
}

class Feature {
  constructor (name, description = '') {
    this.name = name
    this.description = description
  }

  init () {
    throw Error(`.init() method needs to be implemented by ${this.constructor.name}`)
  }
}

const Activity = {
  INACTIVE: 0,
  BANNED: 1,
  VACATION: 2,
  ACTIVE: 3
}

class PhalanxInfo {
  /**
   * Create a PhalanxInfo instance.
   * @param {Array} phalanxes - An array of phalanx information.
   * @param {Object} [options] - An optional object containing options.
   * @param {number} [options.maxGalaxies=4] - The maximum number of galaxies.
   * @param {number} [options.maxSystems=400] - The maximum number of systems.
   * @throws {Error} - If phalanxes is not an array.
   */
  constructor (phalanxes, options = {}) {
    if (!Array.isArray(phalanxes)) {
      throw new Error('Expected an array of phalanx information.')
    }

    this.maxGalaxies = Object.prototype.hasOwnProperty.call(options, 'maxGalaxies') ? options.maxGalaxies : 4
    this.maxSystems = Object.prototype.hasOwnProperty.call(options, 'maxSystems') ? options.maxSystems : 400

    this.phalanxes = phalanxes
    this.data = Array.from(Array(this.maxSystems), () => [])
    this.calculateSystemsInPhalanx()
  }

  /**
   * Get the phalanx information for a given system.
   * @param {number} system - The system number.
   * @returns {Array} - The phalanx information for the given system.
   */
  getSystem (system) {
    return this.data[system - 1]
  }

  /**
   * Append a phalanx to the specified system.
   * @param {number} system - The system number.
   * @param {Object} phalanx - The phalanx object to append.
   * @returns {number} - The new length of the phalanx array for the specified system.
   */
  appendPhalanx (system, phalanx) {
    if (system < 1 || system > this.maxSystems) return
    return this.getSystem(system).push(phalanx)
  }

  /**
   * Calculate which systems are covered by each phalanx.
   */
  calculateSystemsInPhalanx () {
    this.phalanxes.forEach(phalanx => {
      const { from, to } = phalanx.range
      if (from < to || from === to) {
        for (let system = from; system <= to; system++) {
          this.appendPhalanx(system, phalanx)
        }
      } else {
        for (let system = from; system <= (this.maxSystems + to); system++) {
          this.appendPhalanx(system % (this.maxSystems + 1), phalanx)
        }
      }
    })
  }

  /**
   * Check if a system is covered by any phalanx.
   * @param {number} system - The system number.
   * @returns {boolean} - True if the system is covered by any phalanx, false otherwise.
   */
  isInRange (system) {
    if (system < 1 || system > this.maxSystems) return false
    return this.getSystem(system).length > 0
  }

  /**
   * Returns the highest activity level among all the phalanxes associated with a specific system.
   * @param {number} system - The system to check.
   * @returns {number} - The highest activity level of the phalanxes associated with the input system.
   */
  static getActivity (phalanx) {
    if (!phalanx.isVacation && !phalanx.isBanned && phalanx.isInactive === 0) return Activity.ACTIVE
    if (phalanx.isVacation) return Activity.VACATION
    if (phalanx.isBanned) return Activity.BANNED
    if (phalanx.isInactive > 0) return Activity.INACTIVE
  }

  /**
   * Returns the highest activity level among all the phalanxes associated with a specific system.
   * @param {number} system - The system to check.
   * @returns {number} - The highest activity level of the phalanxes associated with the input system.
   */
  getSystemActivity (system) {
    if (system < 1 || system > this.maxSystems) return Activity.ACTIVE
    const phalanxInSystem = this.getSystem(system)
    let activity = 0
    phalanxInSystem.forEach(phalanx => {
      const curActivity = PhalanxInfo.getActivity(phalanx)
      if (curActivity > activity) activity = curActivity
    })

    return activity
  }

  /**
   * Get the color associated with the activity status
   * @param {number} activity - activity status code.
   * @returns {string} - The color associated with the activity status
   */
  static getActivityColor (activity) {
    switch (activity) {
      case Activity.ACTIVE:
        return 'red'
      case Activity.INACTIVE:
        return '#999'
      case Activity.VACATION:
      case Activity.BANNED:
        return '#659ec7'
    }
  }

  /**
   * Get the color associated with the highest phalanx activity status of a given system.
   * @param {number} system - The system number.
   * @returns {string} - The color associated with the activity status of the given system.
   */
  getSystemActivityColor (system) {
    if (system < 1 || system > this.maxSystems) return 'red'

    const activity = this.getSystemActivity(system)
    return PhalanxInfo.getActivityColor(activity)
  }

  // TODO: Tooltip not working yet
  createDataTooltipContent (system) {
    const systemData = this.getSystem(system)

    let content = '<ul>'
    systemData.forEach(phalanx => {
      content += `<li>[${phalanx.galaxy}:${phalanx.system}:${phalanx.position}]</li>`
    })
    content += '</ul>'
    return content
  }
}

/**
 * Turn camelCase into Camel Case
 * @param {str} text text to transform
 * @returns str as Capital Case
 */
function camel2capitalCase (text) {
  return text
    .replace(/([A-Z]+)/g, ' $1')
    .replace(/([A-Z][a-z])/g, ' $1')
    .replace(/^./, e => e.toUpperCase())
}

/**
 * Calculates the distance between two locations.
 *
 * @param {Object} start - The starting location, including galaxy, system, and position.
 * @param {number} start.galaxy - The galaxy of the starting location.
 * @param {number} start.system - The system of the starting location.
 * @param {number} start.position - The position of the starting location.
 * @param {Object} target - The target location, including galaxy, system, and position.
 * @param {number} target.galaxy - The galaxy of the target location.
 * @param {number} target.system - The system of the target location.
 * @param {number} target.position - The position of the target location.
 * @returns {number} The distance between the two locations
 */
function calculateDistance (start, target) {
  const delta = {}

  // TODO: Extract to a project wide constants file
  const galaxyWidth = 400
  const galaxyAmount = 4

  if (start.galaxy > target.galaxy) {
    delta.galaxy = Math.min(start.galaxy - target.galaxy, galaxyAmount - start.galaxy + target.galaxy + 1)
  } else {
    delta.galaxy = Math.min(target.galaxy - start.galaxy, galaxyAmount - target.galaxy + start.galaxy + 1)
  }

  if (start.system > target.system) {
    delta.system = Math.min(start.system - target.system, galaxyWidth - start.system + target.system + 1)
  } else {
    delta.system = Math.min(target.system - start.system, galaxyWidth - target.system + start.system + 1)
  }

  delta.position = Math.abs(start.position - target.position)

  if (delta.galaxy !== 0) {
    return 20_000 * delta.galaxy
  }

  if (delta.system !== 0) {
    return 2_700 + 95 * delta.system
  }

  if (delta.position !== 0) {
    return 1_000 + 5 * delta.system
  }

  // default Value for traveling on the same position
  return 5
}

/**
 * Calculates the duration of a flight in seconds
 *
 * @param {number} distance - The distance to be covered by the flight in kilometers.
 * @param {number} slowestSpeed - The slowest speed of the flight in kilometers per hour.
 * @param {number} [modifierSpeed=1] - The modifier speed of the flight as decimals in 0.1 increments
 * @returns {number} The duration of the flight in seconds.
 */
function calculateFlightDuration (distance, slowestSpeed, modiferSpeed = 1) {
  return (10 + 3500 / modiferSpeed * Math.sqrt(10 * distance / slowestSpeed))
}

/**
  * Starts a countdown timer for the spy probes that were sent to a planet.
  * @param {Event} e - The click event that triggers the countdown timer.
  * @returns {void}
  */
function startProbesCountdownTimer (e) {
  const time = new Date()
  const spyProbesBackDate = new Date(time.getTime() + e.target.dataset.value * 2000)
  const planetId = e.target.id.split('-')[1]

  const x = setInterval(() => {
    const now = new Date().getTime()
    const distance = spyProbesBackDate - now

    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((distance % (1000 * 60)) / 1000)

    // Output the result in an element with id="demo"
    const cdElements = document.getElementsByClassName(`cd-${planetId}`)
    const len = cdElements.length
    for (let i = 0; i < len; i++) {
      cdElements[i].innerHTML = minutes + 'm ' + seconds + 's '
    }

    // If the count down is over, write some text
    if (distance < 0) {
      clearInterval(x)
      const len = cdElements.length
      for (let i = 0; i < len; i++) {
        cdElements[i].innerHTML = 'DONE'
      }
    }
  }, 1000)
}

module.exports = {
  camel2capitalCase,
  Feature,
  getCurrentPosition,
  loadSearchSettings,
  location2pos,
  location2str,
  makeTableSortable,
  pos2location,
  quantile,
  saveSearchSettings,
  setTeamviewStatus,
  PhalanxInfo,
  Activity,
  calculateDistance,
  calculateFlightDuration,
  startProbesCountdownTimer,
  teamviewDebugMode: TM_getValue('debug_mode') === 1
}
