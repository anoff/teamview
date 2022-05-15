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
      messages.push({
        id,
        header,
        body
      })
    }
    return messages
  }

  parse_text ({
    id,
    header,
    body
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
      const map = languageMap.spyitems_en
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
          const value = parseInt(line.replace('.', '').replace(',', ''))
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
    const [dateRaw] = header.split(/\t/)
    const [report] = body.split(/\n\n/)
    const [title, ...content] = report.split(/\n/)
    const date = parseDate(dateRaw).toISOString()
    const planet = parsePlanet(title)
    const jsons = parseData(content)
    return {
      id,
      date,
      planet,
      jsons
    }
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
  }
}

function uploadSpies (reports) {

}

module.exports = {
  SpioParser
}
