/* globals  GM_setValue, GM_getValue */

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
  cols[1].setAttribute('colspan', 3)
  cols[2].innerText = 'Name'
  cols[2].setAttribute('colspan', 3)
  cols[3].innerText = 'Actions'
  cols[3].setAttribute('colspan', colspan - 1 - 3 - 3) // causes issues if button is pressed multiple times
  Array.from(cols).slice(4).forEach(e => e.remove())

  const bookmarks = GM_getValue('bookmarks')
  for (const b of bookmarks) {
    const html = `<tr>
    <td>${b.galaxy}:${b.system}:${b.position}</td>
    <td colspan="3">${b.planetName}</td>
    <td colspan="3">${b.playerName}</td>
    <td colspan="${colspan - 1 - 3 - 3}">
      <a href="javascript:doit(6,${b.planetId},{'210':'2'})"><img src="./styles/theme/nova/img/e.gif" title="Spying" alt=""></a>
    </td>
    </tr>`
    colRow.insertAdjacentHTML('afterend', html)
  }
  console.log({ colspan })
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
      const playerName = cells[COLUMN_PLAYER].innerText.split(' (')[0]
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
  let bookmarks = GM_getValue('bookmarks')
  if (!bookmarks) {
    bookmarks = []
  }
  const ix = bookmarks.findIndex(e => e.galaxy === galaxy && e.system === system && e.position === position)
  if (ix > -1) {
    console.log('updating', ix)
    bookmarks[ix] = { galaxy, system, position, planetId, planetName, playerName }
  } else {
    console.log('adding new')
    bookmarks.push({ galaxy, system, position, planetId, planetName, playerName })
  }
  GM_setValue('bookmarks', bookmarks)
}
module.exports = {
  addBookmarkButton,
  addShowFavoritesButton,
  removeRows
}
