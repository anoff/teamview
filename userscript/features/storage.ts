const UNIVERSE: string | null = window.location.href.match(/\/\/([^\/]+)\/([^\/]+)\//)?.[2] ?? 'uni2';
const KEY_EMPIRE = `${UNIVERSE}_empire`
const KEY_TECHNOLOGIES = `${UNIVERSE}_technologies`

export class Planet {
    galaxy: number
    system: number
    position: number
    date: string
    resources: Object
    isMoon: boolean
    ships: Object
    defense: Object

    constructor(planet: Object) {
        if (Planet.isPlanet(planet)) {
          this.galaxy = planet.galaxy;
          this.system = planet.system;
          this.position = planet.position;
          this.date = planet.date;
          this.resources = planet.resources;
          this.isMoon = planet.isMoon;
          this.ships = planet.ships;
          this.defense = planet.defense;
        } else {
          throw new Error("Invalid planet object");
        }
    }

    static isPlanet(obj: any): obj is Planet {
        return (
          typeof obj.galaxy === "number" &&
          typeof obj.system === "number" &&
          typeof obj.position === "number" &&
          typeof obj.date === "string" &&
          typeof obj.resources === "object" &&
          typeof obj.isMoon === "boolean" &&
          typeof obj.ships === "object" &&
          typeof obj.defense === "object"
        );
    }
}

export class Research {
    spyTechnology: number = 0
    computerTechnology: number = 0
    weaponsTechnology: number = 0
    shieldTechnology: number = 0
    armourTechnology: number = 0
    energyTechnology: number = 0
    hyperspaceTechnology: number = 0
    combustionEngine: number = 0
    impulseEngine: number = 0
    hyperspaceEngine: number = 0
    laserTechnology: number = 0
    ionTechnology: number = 0
    plasmaTechnology: number = 0
    intergalacticResearchNetwork: number = 0
    expeditionResearch: number = 0
    mineralResearch: number = 0
    semiCrystalsResearch: number = 0
    fuelResearch: number = 0
    gravitonResearch: number = 0    

    constructor(research: Partial<Research> = {}) {
        Object.keys(this).forEach((key) => {
            if (key in research) {
                (this as any)[key] = (research as any)[key];
            }
        });
    }
}

export class Empire {
    planets: Array<Planet> = []
    research: Research

    constructor(empire: Array<Object>, research: Object) {
        empire.forEach(planet => {
            this.planets.push(new Planet(planet))
        })
        this.research = new Research(research)
    }
}

export class LocalStorage {
    static saveEmpire(empire: Empire) {
        const empireStr = JSON.stringify(empire)
        TM_setValue(KEY_EMPIRE, empireStr)
    }

    static getEmpire() :Empire {
        let empireStr = TM_getValue(KEY_EMPIRE)
        if (!empireStr || empireStr === '') TM_setValue(KEY_EMPIRE, new Empire([], new Research({})))

        const empire: Empire = JSON.parse(empireStr) ?? {}
        return empire
    }

    static getResearch(): Research {
        const empire = LocalStorage.getEmpire()
        if (!empire) {
          return new Research({})
        } else {
          return empire.research
        }
      }
}

export function init() {
    console.log(UNIVERSE)
}