/* global TM_getValue, TM_setValue */
const { setStatus } = require('./teamviewSection')
const req = require('./requests')

class SpioParser {
  isSpioPage () {
    return window.location.search.includes('page=messages') && window.location.search.includes('category=0')
  }

  getMessages () {
    const htmlElements = document.getElementsByClassName('message_head')
    const messages = []
    for (const m of htmlElements) {
      if (!m) return
      const id = parseInt(m.id.split('_')[1])
      const header = m.innerText.trim()
      const body = document.getElementsByClassName(`message_${id} messages_body`)[0].innerText.trim()
      const attackLink = document.querySelectorAll(`.message_${id}.messages_body .spyRaportFooter a`)[0].getAttribute('href')
      messages.push({
        id,
        header,
        body,
        attackLink
      })
    }
    return messages
  }

  parse_text ({
    id,
    header,
    body,
    attackLink
  }) {
    function parseDate (dateRaw) {
      const monthMapping = languageMap.months
      // make sure date format is english
      for (const monthDE in monthMapping) {
        dateRaw = dateRaw.replace(monthDE, monthMapping[monthDE])
      }
      // move around day so it can be parsed
      const parts = dateRaw.split(' ')
      const date = new Date([parts[1], parts[0].replace('.', ''), parts.slice(2)].join(' '))
      return date
    }

    function parsePlanet (report) {
      return report.split('[')[1].split(']')[0]
    }

    function parseData (content) {
      let map = languageMap.spyitems_en
      if (content.includes('Rohstoffe')) {
        map = languageMap.spyitems_de
      }
      const json = {
        buildings: {},
        resources: {},
        ships: {},
        defense: {},
        research: {}
      }
      let matchKey = null
      for (const line of content) {
        if (matchKey) {
          const [group, item] = map[matchKey].split('_')
          const value = parseInt(line.replace(/\./g, '').replace(/,/g, ''))
          if (value !== 0) { // skip 0s
            switch (group) {
              case 'b':
                json.buildings[item] = value
                break
              case 'def':
                json.defense[item] = value
                break
              case 'res':
                json.resources[item] = value
                break
              case 'sh':
                json.ships[item] = value
                break
              case 'r':
                json.research[item] = value
                break
              default:
                console.error('Unknown spy repeart group:', group)
            }
          }
          matchKey = null
        } else {
          const keys = Object.keys(map)
          matchKey = keys.find(e => e.toLocaleLowerCase() === line.toLocaleLowerCase())
        }
      }
      return json
    }
    const [dateRaw, , subject] = header.split(/\t/)
    let reportType = 'espionage'
    if ([languageMap.messageType_en.enemySpy, languageMap.messageType_de.enemySpy].includes(subject)) {
      reportType = 'enemySpy'
    }
    const [report] = body.split(/\n\n/)
    const [title, ...content] = report.split(/\n/)
    const date = parseDate(dateRaw).toISOString()
    const planet = parsePlanet(title)
    const jsons = parseData(content)
    let isMoon = false
    if (reportType === 'espionage') {
      if (attackLink.includes('planettype=3')) isMoon = true
    }
    const data = {
      id,
      reportType,
      date,
      planet,
      ...jsons,
      isMoon
    }
    console.log(data)
    return data
  }
}

const languageMap = {
  months: {
    Jan: 'Jan',
    Feb: 'Feb',
    Mär: 'Mar',
    Apr: 'Apr',
    Mai: 'May',
    Jun: 'Jun',
    Jul: 'Jul',
    Aug: 'Aug',
    Sep: 'Sep',
    Okt: 'Oct',
    Nov: 'Nov',
    Dez: 'Dec'
  },
  spyitems_en: {
    // lowercased
    // resources
    metal: 'res_metal',
    crystal: 'res_crystal',
    deuterium: 'res_deuterium',
    energy: 'res_energy',
    // ships
    'light cargo': 'sh_lightCargo',
    'heavy cargo': 'sh_heavyCargo',
    'light fighter': 'sh_lightFighter',
    'heavy fighter': 'sh_heavyFighter',
    cruiser: 'sh_cruiser',
    battleship: 'sh_battleship',
    'colony ship': 'sh_colonyShip',
    recycler: 'sh_recycler',
    'spy probe': 'sh_spyProbe',
    'planet bomber': 'sh_planetBomber',
    'solar satellite': 'sh_solarSatellite',
    'star fighter': 'sh_starFighter',
    'battle fortress': 'sh_battleFortress',
    'battle cruiser': 'sh_battleCruiser',
    // defense
    'missile launcher': 'def_missileLauncher',
    'light laser turret': 'def_lightLaserTurret',
    'heavy laser turret': 'def_heavyLaserTurret',
    'gauss cannon': 'def_gaussCannon',
    'ion cannon': 'def_ionCannon',
    'plasma cannon': 'def_plasmaCannon',
    'small shield dome': 'def_smallShieldDome',
    'large shield dome': 'def_largeShieldDome',
    interceptor: 'def_interceptor',
    'interplanetary missiles': 'def_interplanetaryMissiles',
    // buildings
    'metal mine': 'b_metalMine',
    'crystal mine': 'b_crystalMine',
    'deuterium refinery': 'b_deuteriumRefinery',
    'solar power plant': 'b_solarPowerPlant',
    university: 'b_university',
    'deuterium power plant': 'b_deuteriumPowerPlant',
    'robot factory': 'b_robotFactory',
    'nanite factory': 'b_naniteFactory',
    shipyard: 'b_shipyard',
    'metal storage': 'b_metalStorage',
    'crystal storage': 'b_crystalStorage',
    'deuterium storage': 'b_deuteriumStorage',
    'research lab': 'b_researchLab',
    terraformer: 'b_terraformer',
    'alliance depot': 'b_allianceDepot',
    'moon base': 'b_moonBase',
    'phalanx sensor': 'b_phalanxSensor',
    jumpgate: 'b_jumpgate',
    'missile silo': 'b_missileSilo',
    // research
    'spy technology': 'r_spyTechnology',
    'computer technology': 'r_computerTechnology',
    'weapons technology': 'r_weaponsTechnology',
    'shield technology': 'r_shieldTechnology',
    'armour technology': 'r_armourTechnology',
    'energy technology': 'r_energyTechnology',
    'hyperspace technology': 'r_hyperspaceTechnology',
    'combustion engine': 'r_combustionEngine',
    'impulse engine': 'r_impulseEngine',
    'hyperspace engine': 'r_hyperspaceEngine',
    'laser technology': 'r_laserTechnology',
    'ion technology': 'r_ionTechnology',
    'plasma technology': 'r_plasmaTechnology',
    'intergalactic research network': 'r_intergalacticResearchNetwork',
    'expedition research': 'r_expeditionResearch',
    'mineral research': 'r_mineralResearch',
    'semi-crystals research': 'r_semiCrystalsResearch',
    'fuel research': 'r_fuelResearch',
    'graviton research': 'r_gravitonResearch'
  },
  spyitems_de: {
    // lowercased
    // resources
    metall: 'res_metal',
    kristall: 'res_crystal',
    deuterium: 'res_deuterium',
    energie: 'res_energy',
    // ships
    'kleiner transporter': 'sh_lightCargo',
    'großer transporter': 'sh_heavyCargo',
    'leichter jäger': 'sh_lightFighter',
    'schwerer jäger': 'sh_heavyFighter',
    kreuzer: 'sh_cruiser',
    schlachtschiff: 'sh_battleship',
    kolonieschiff: 'sh_colonyShip',
    recycler: 'sh_recycler',
    spionagesonde: 'sh_spyProbe',
    bomber: 'sh_planetBomber',
    solarsatellit: 'sh_solarSatellite',
    zerstörer: 'sh_starFighter',
    todesstern: 'sh_battleFortress',
    schlachtkreuzer: 'sh_battleCruiser',
    // defense
    raketenwerfer: 'def_missileLauncher',
    'leichtes lasergeschütz': 'def_lightLaserTurret',
    'schweres lasergeschütz': 'def_heavyLaserTurret',
    gaußkanone: 'def_gaussCannon',
    ionengeschütz: 'def_ionCannon',
    plasmawerfer: 'def_plasmaCannon',
    'kleine schildkuppel': 'def_smallShieldDome',
    'große schildkuppel': 'def_largeShieldDome',
    abfangrakete: 'def_interceptor',
    interplanetarrakete: 'def_interplanetaryMissiles',
    // buildings
    metallmine: 'b_metalMine',
    kristallmine: 'b_crystalMine',
    deuteriumsynthetisierer: 'b_deuteriumRefinery',
    solarkraftwerk: 'b_solarPowerPlant',
    technoDome: 'b_university',
    fusionskraftwerk: 'b_deuteriumPowerPlant',
    roboterfabrik: 'b_robotFactory',
    nanitenfabrik: 'b_naniteFactory',
    raumschiffwerft: 'b_shipyard',
    metallspeicher: 'b_metalStorage',
    kristallspeicher: 'b_crystalStorage',
    deuteriumtank: 'b_deuteriumStorage',
    forschungslabor: 'b_researchLab',
    terraformer: 'b_terraformer',
    allianzdepot: 'b_allianceDepot',
    basisstützpunkt: 'b_moonBase',
    sensorenphalanx: 'b_phalanxSensor',
    sprungtor: 'b_jumpgate',
    raketensilo: 'b_missileSilo',
    // research
    spionagetechnik: 'r_spyTechnology',
    computertechnik: 'r_computerTechnology',
    waffentechnik: 'r_weaponsTechnology',
    schildtechnik: 'r_shieldTechnology',
    raumschiffpanzerung: 'r_armourTechnology',
    energietechnik: 'r_energyTechnology',
    hyperraumtechnik: 'r_hyperspaceTechnology',
    verbrennungstriebwerk: 'r_combustionEngine',
    impulstriebwerk: 'r_impulseEngine',
    hyperraumantrieb: 'r_hyperspaceEngine',
    lasertechnik: 'r_laserTechnology',
    ionentechnik: 'r_ionTechnology',
    plasmatechnik: 'r_plasmaTechnology',
    'intergalaktisches forschungsnetzwerk': 'r_intergalacticResearchNetwork',
    astrophysik: 'r_expeditionResearch',
    'produktionsmaximierung metall': 'r_mineralResearch',
    'produktionsmaximierung kristall': 'r_semiCrystalsResearch',
    'produktionsmaximierung deuterium': 'r_fuelResearch',
    gravitonforschung: 'r_gravitonResearch'
  },
  messageType_en: {
    enemySpy: 'Spying activity',
    espionage: 'Intelligence report'
  },
  messageType_de: {
    enemySpy: 'Spionage-Aktivität',
    espionage: 'Spionagebericht'
  }
}

function uploadReports () {
  const sp = new SpioParser()
  const messages = sp.getMessages()
  const data = messages
    .map(e => sp.parse_text(e))
    .map(r => {
      return {
        reportId: r.id,
        reportType: r.reportType,
        galaxy: parseInt(r.planet.split(':')[0]),
        system: parseInt(r.planet.split(':')[1]),
        position: parseInt(r.planet.split(':')[2]),
        date: r.date,
        resources: r.resources,
        isMoon: r.isMoon,
        buildings: r.buildings,
        ships: r.ships,
        research: r.research,
        defense: r.defense
      }
    })
  const uploadedReports = TM_getValue('reports_uploaded')
  uploadedReports.push(...data.map(e => e.reportId))
  TM_setValue('reports_uploaded', uploadedReports)
  const p = req.uploadReports(data)
  p.then(res => {
    const { totalCount, successCount } = res
    setStatus('status-ok', `Submitted ${successCount}/${totalCount}`)
    colorReports()
  }).catch(e => {
    let errMessage = 'Error'
    if (e.status) {
      errMessage += ` [${e.status}]`
    }
    errMessage += ', see console'
    setStatus('status-error', errMessage)
    console.error(e)
  })
}

function addUploadSection () {
  const sectionHTML = `
    <td class="transparent" id="teamview-section">
      <table>
        <tbody><tr>
            <th colspan="4">Teamview</th>
          </tr>
          <tr>
            <td><button type="button" id="teamview-upload">Upload</button></td>
            <td><span style="font-weight: bold;">Status</span></div></td>
            <td><span id="teamview-status-icon" class="dot status-unknown"></td>
            <td><span id="teamview-status-text" style="font-size: 85%;"></span></td>
        </tr>
      </tbody></table>
    </td>
  `
  document.querySelector('#messagestable').insertAdjacentHTML('afterend', sectionHTML)
  document.getElementById('teamview-upload').addEventListener('click', uploadReports)

  setStatus('status-outdated', 'ready to upload')

  document.onkeydown = function (e) {
    e = e || window.event
    switch (e.which || e.keyCode) {
      case 13 : // enter
      case 32: // space
        uploadReports()
        break
    }
  }

  // make sure that clicking the default navigation buttons also uploads data
  const pagination = document.querySelector('#messagestable').querySelectorAll('.right a')
  pagination.forEach(link => {
    link.addEventListener('click', uploadReports.bind(this))
  })
}

function colorReports () {
  const uploadedReports = TM_getValue('reports_uploaded')
  const reportsOnPage = Array.from(document.querySelectorAll('.message_head')).map(e => parseInt(e.id.split('_')[1]))
  for (const id of reportsOnPage) {
    const title = document.querySelectorAll(`tr.message_${id}.message_head td`)[2]
    if (uploadedReports.includes(id)) {
      title.classList = 'status-ok text-black'
    } else {
      title.classList = 'status-outdated text-black'
    }
  }
}

function fetchUploadedReports () {
  return req.getUploadedReports().then(res => {
    const uploadedReports = TM_getValue('reports_uploaded')
    const data = res
    for (const id of data) {
      if (!uploadedReports.includes(id)) {
        uploadedReports.push(id)
      }
    }
    TM_setValue('reports_uploaded', uploadedReports.slice(-200)) // limit to last 200 items
  }).catch(e => {
    setStatus('status-error', 'Error, see console')
    console.error('Error while fetching uploaded reports', e)
  })
}
function init () {
  const sp = new SpioParser()
  if (!TM_getValue('reports_uploaded')) TM_setValue('reports_uploaded', [])
  if (sp.isSpioPage()) {
    addUploadSection()
    colorReports()
    fetchUploadedReports().then(colorReports.bind(this))
  }
}

module.exports = {
  SpioParser,
  init
}
