/* globals  TM_setValue, TM_getValue */
function GM_addStyle (css) { // eslint-disable-line camelcase
  const style = document.getElementById('GM_addStyleBy8626') || (function () {
    const style = document.createElement('style')
    style.type = 'text/css'
    style.id = 'GM_addStyleBy8626'
    document.head.appendChild(style)
    return style
  })()
  const sheet = style.sheet
  sheet.insertRule(css, (sheet.rules || sheet.cssRules || []).length)
}

/**
 * Read the current active planet position from the planet menu.
 * @returns Array[int] Galaxy, System, Position
 */
function getCurrentPosition () {
  const [g, s, p] = Array.from(document.querySelector('#planetSelector').children).find(e => e.selected).text.split(' [')[1].slice(0, -1).split(':').map(e => parseInt(e))
  return [g, s, p]
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

module.exports = {
  getCurrentPosition,
  GM_addStyle, // eslint-disable-line camelcase
  quantile,
  makeTableSortable,
  loadSearchSettings,
  saveSearchSettings,
  teamviewDebugMode: TM_getValue('debug_mode') === 1
}
