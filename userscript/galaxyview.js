/**
 * Parse planet information out of current visible system in the galaxy view table
 * @returns Array[{ planetName, playerName, position, hasMoon, debrisMetal, debrisCrystal }]
 */
function getVisibleSystem () {
  function cleanName (name) {
    return name.split('(')[0].trim()
  }
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_COUNT = 15
  const COLUMN_PLAYER = 5
  const COLUMN_PLANETNAME = 2
  const COLUMN_MOON = 3
  const COLUMN_DEBRIS = 4
  const systemCoords = Array.from(document.querySelector('content table.table569').querySelectorAll('tr'))[0].innerText
  const [galaxy, system] = systemCoords.split(' ')[1].split(':').map(e => parseInt(e))
  const rowsWithPlanets = Array.from(document.querySelector('content table.table569').querySelectorAll('tr')).slice(ROWS_HEADER, ROWS_HEADER + ROWS_COUNT)
  const entries = []
  for (const [i, row] of rowsWithPlanets.entries()) {
    const cells = Array.from(row.querySelectorAll('td'))
    const planetName = cleanName(cells[COLUMN_PLANETNAME].innerText)
    const playerName = cleanName(cells[COLUMN_PLAYER].innerText)
    const hasMoon = cells[COLUMN_MOON].children.length > 0
    let debrisCrystal = 0
    let debrisMetal = 0
    const debrisPopup = cells[COLUMN_DEBRIS].innerHTML
    if (debrisPopup) {
      const match = /Metal: <[a-zA-Z<>\\/]+([\d]+).*Crystal: <[a-zA-Z<>\\/]+([\d]+).*/g.exec(debrisPopup)
      if (match) {
        const [, debrisMetalStr, debrisCrystalStr] = match
        debrisCrystal = parseInt(debrisCrystalStr)
        debrisMetal = parseInt(debrisMetalStr)
      }
    }
    if (planetName && playerName) {
      entries.push({ name: planetName, playerName, galaxy, system, position: i, hasMoon, debrisMetal, debrisCrystal })
    }
  }
  return entries
}

function addColumn (addCount = 1, titles = []) {
  const rows = document.querySelector('content table.table569 tbody').children
  for (let rowIx = 0; rowIx < rows.length; rowIx++) {
    const tr = rows[rowIx]
    const COLUMN_STYLE_REF = 2
    let isSpan
    switch (rowIx) {
      case 0:
        tr.children[0].setAttribute('colspan', 8 + addCount)
        break
      case 1:
        for (let i = 0; i < addCount; i++) {
          const e = document.createElement('th')
          e.setAttribute('style', tr.children[COLUMN_STYLE_REF].getAttribute('style'))
          let title = `Extra ${i + 1}`
          if (titles.length === addCount) {
            title = titles[i]
          }
          e.innerText = title
          tr.appendChild(e)
        }
        break
      case 17:
      case 18:
      case 19:
      case 20:
        isSpan = parseInt(tr.children[1].getAttribute('colspan'))
        tr.children[1].setAttribute('colspan', isSpan + addCount)
        break
      case 21:
        break
      default:
        for (let i = 0; i < addCount; i++) {
          const e = document.createElement('td')
          e.style = tr.children[COLUMN_STYLE_REF].style
          tr.appendChild(e)
        }
    }
  }
}

function modifyAddRankFromPopup (data, cells, rowIx) {
  function cleanName (name) {
    return name.split('(')[0].trim()
  }
  const COLUMN_PLAYER = 5
  const playerName = cleanName(cells[COLUMN_PLAYER].innerText)
  if (playerName) {
    const ingameRankStr = cells[COLUMN_PLAYER].querySelector('a')
      .getAttribute('data-tooltip-content')
      .split('pos. ')[1].split('<')[0]
    const ingameRank = parseInt(ingameRankStr)
    const s = document.createElement('span')
    s.innerHTML = ` (${ingameRank})`
    s.style = 'font-size: 80%; color: yellow;'
    cells[COLUMN_PLAYER].querySelector('a').appendChild(s)
  }
}
function modifyAddPlayerStats (data, cells, rowIx) {
  function cleanName (name) {
    return name.split('(')[0].trim()
  }
  const COLUMN_STATS = 8
  const COLUMN_PLAYER = 5
  const playerName = cleanName(cells[COLUMN_PLAYER].innerText)
  const isInactive = cells[COLUMN_PLAYER].innerText.includes('i)')
  if (playerName) {
    // only modify if this row contains a player
    const d = data.find(e => e.name === playerName)
    const s = document.createElement('span')
    if (!d) {
      console.warn('Could not find player information for player: ', playerName)
      return
    }
    s.classList = 'fadein-text'
    if (isInactive) {
      s.innerText = `🏭${d.pointsBuilding}\n🛡${d.pointsDefense}`
    } else {
      s.innerText = `🚀${d.pointsFleet} / 🛡${d.pointsDefense}\n💥${(d.unitsDestroyed / 1e6).toFixed(1)}M / ↘️${(d.unitsLost / 1e6).toFixed(1)}M`
    }
    s.style = 'font-size: 85%;'
    cells[COLUMN_STATS].appendChild(s)
  }
}

function addUploadButton (onClickFn) {
  const galaxySubmitButton = Array.from(document.querySelectorAll('#galaxy_form table input')).filter(e => e.type === 'submit')[0]
  const b = document.createElement('button')
  b.type = 'button'
  b.innerText = 'Upload'
  b.id = 'teamview-upload'
  b.onclick = onClickFn

  galaxySubmitButton.insertAdjacentElement('afterend', b)

  document.onkeydown = function (e) {
    e = e || window.event
    switch (e.which || e.keyCode) {
      case 13 : // enter
      case 32: // space
        b.click()
        break
    }
  }
}

function modifyTable (data, modfiyFn) {
  // all indexes 0-based
  // const ROW_SYSTEM = 0
  const ROWS_HEADER = 2
  const ROWS_COUNT = 15
  const rowsWithPlanets = Array.from(document.querySelector('content table.table569').querySelectorAll('tr')).slice(ROWS_HEADER, ROWS_HEADER + ROWS_COUNT)
  for (const row of rowsWithPlanets) {
    const cells = row.querySelectorAll('td')
    modfiyFn(data, cells)
  }
}
module.exports = {
  addUploadButton,
  addColumn,
  getVisibleSystem,
  modifyAddRankFromPopup,
  modifyAddPlayerStats,
  modifyTable
}
