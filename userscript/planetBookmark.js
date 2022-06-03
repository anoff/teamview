/* globals  TM_setValue, TM_getValue */

function removeRows () {
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_BOTTOM_KEEP = 2
  const rows = Array.from(document.querySelector('content table.table569').querySelectorAll('tr'))
  const rowsWithPlanets = rows.slice(ROWS_HEADER, rows.length - 1 - ROWS_BOTTOM_KEEP)
  for (const row of rowsWithPlanets) {
    row.remove()
  }

  document.querySelector('content table.table569 tbody tr:nth-child(1) th').textContent = 'Universe Bookmarks'
}

function insertBookmarkedRows () {
  const ROWS_HEADER = 2
  const colRow = document.querySelector('content table.table569').querySelectorAll('tr')[ROWS_HEADER - 1]
  const colspan = Array.from(colRow.children).map(e => parseInt(e.getAttribute('colspan')) || 1).reduce((p, c) => p + c, 0)
  const cols = colRow.children
  cols[0].innerText = 'Location'
  cols[1].innerText = 'Planet'
  cols[1].setAttribute('colspan', 2)
  cols[2].innerText = 'Name'
  cols[2].setAttribute('colspan', 2)
  cols[3].innerText = 'Scan'
  cols[4].innerText = 'Last Scan'
  cols[5].innerText = 'Delete'
  cols[5].setAttribute('colspan', colspan - 2 - 2 - 1 * 4)

  Array.from(cols).slice(6).forEach(e => e.remove())

  const bookmarkOrderFn = b => b.position + b.system * 50 + b.galaxy * 400 * 50
  const bookmarks = TM_getValue('bookmarks').sort((a, b) => bookmarkOrderFn(a) > bookmarkOrderFn(b) ? -1 : 1)
  for (const b of bookmarks) {
    let timeSinceLastScan = '-'
    if (b.lastScan) {
      const seconds = Math.round((new Date() - new Date(b.lastScan)) / 1000)
      let hours = 0
      let minutes = 0
      hours = Math.floor(seconds / 3600)
      minutes = Math.floor((seconds - hours * 3600) / 60)
      timeSinceLastScan = `${minutes} min`
      if (hours) {
        timeSinceLastScan = `${hours} hrs ${timeSinceLastScan}`
      }
    }
    let playerColorCls = 'color-blue'
    if (b.playerName.includes('i)')) {
      playerColorCls = 'color-white'
    }
    const html = `<tr id="row-${b.planetId}">
    <td><a href="game.php?page=galaxy&galaxy=${b.galaxy}&system=${b.system}" title="Goto System">${b.galaxy}:${b.system}:${b.position}</a></td>
    <td colspan="2">${b.planetName}</td>
    <td colspan="2" class=${playerColorCls}>${b.playerName}</td>
    <td>
      <a id="scan-${b.planetId}" title="Spy on planet" href="javascript:doit(6,${b.planetId},{'210':'2'});">🔍</a>
    </td>
    <td colspan="${colspan - 2 - 2 - 1 * 4}">${timeSinceLastScan}</td>
    <td><a id="delete-${b.planetId}" title="Delete Bookmark" href="#">❌</a></td>
    </tr>`
    colRow.insertAdjacentHTML('afterend', html)

    function removeBookmark (planetId) {
      const bookmarks = TM_getValue('bookmarks')
      const ix = bookmarks.findIndex(e => e.planetId === planetId)
      if (ix > -1) {
        bookmarks.splice(ix, 1)
        TM_setValue('bookmarks', bookmarks)
        const row = document.getElementById(`row-${planetId}`)
        row.remove()
      }
    }
    document.getElementById(`scan-${b.planetId}`).addEventListener('click', updateTimestamp.bind(this, b.planetId))
    document.getElementById(`delete-${b.planetId}`).addEventListener('click', removeBookmark.bind(this, b.planetId))
  }
}
function addShowFavoritesButton () {
  function onClick () {
    removeRows()
    insertBookmarkedRows()
  }
  const buttonHTML = '<button type="button" id="teamview-bookmarks">Show Bookmarks</button>'

  const topRows = document.querySelectorAll('#galaxy_form table tr')
  topRows[topRows.length - 1].children[0].insertAdjacentHTML('beforeend', buttonHTML)

  document.getElementById('teamview-bookmarks').onclick = onClick
}

function addBookmarkButton () {
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_COUNT = 15
  const COLUMN_POS = 0
  const COLUMN_PLANETNAME = 2
  const COLUMN_PLAYER = 5
  const COLUMN_ACTIONS = 7
  const systemCoords = Array.from(document.querySelector('content table.table569').querySelectorAll('tr'))[0].innerText
  const [galaxy, system] = systemCoords.split(' ')[1].split(':').map(e => parseInt(e))
  const rowsWithPlanets = Array.from(document.querySelector('content table.table569').querySelectorAll('tr')).slice(ROWS_HEADER, ROWS_HEADER + ROWS_COUNT)
  for (const row of rowsWithPlanets) {
    const cells = row.querySelectorAll('td')
    const actionCell = cells[COLUMN_ACTIONS]
    const spioButton = Array.from(actionCell.children).find(e => e.getAttribute('href').includes('javascript:doit'))
    if (spioButton) {
      const planetId = parseInt(spioButton.getAttribute('href').split(',')[1])
      const planetName = cells[COLUMN_PLANETNAME].innerText.split(' (')[0]
      const playerName = cells[COLUMN_PLAYER].innerText
      const position = parseInt(cells[COLUMN_POS].innerText)
      const a = document.createElement('a')
      a.textContent = '🔖'
      a.href = '#'
      a.setAttribute('title', 'Add planet as bookmark')
      a.style = 'font-size: 130%; position: relative; top: 2px;'
      a.onclick = addBookmark.bind(this, galaxy, system, position, planetId, planetName, playerName)
      spioButton.insertAdjacentElement('afterend', a)
    }
  }
}

function addBookmark (galaxy, system, position, planetId, planetName, playerName) {
  let bookmarks = TM_getValue('bookmarks')
  if (!bookmarks) {
    bookmarks = []
  }
  const ix = bookmarks.findIndex(e => e.galaxy === galaxy && e.system === system && e.position === position)
  if (ix > -1) {
    bookmarks[ix] = { galaxy, system, position, planetId, planetName, playerName }
  } else {
    bookmarks.push({ galaxy, system, position, planetId, planetName, playerName })
  }
  TM_setValue('bookmarks', bookmarks)
}

function updateTimestamp (planetId) {
  let bookmarks = TM_getValue('bookmarks')
  if (!bookmarks) {
    bookmarks = []
  }
  const ix = bookmarks.findIndex(e => e.planetId === planetId)
  if (ix > -1) {
    bookmarks[ix].lastScan = new Date().toISOString()
  }
  TM_setValue('bookmarks', bookmarks)
}

function init () {
  if (TM_getValue('bookmarks') === undefined) {
    TM_setValue('bookmarks', [])
  }
  addBookmarkButton()
  addShowFavoritesButton()
}

module.exports = {
  addBookmark,
  addBookmarkButton,
  addShowFavoritesButton,
  init
}

// use these to combile planetBookmark standalone
// addBookmarkButton()
// addShowFavoritesButton()
