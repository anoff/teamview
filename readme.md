# 0game Teamview

## Required use cases

| usecase | auth level | payload (H:eader) | route | returns |
|---------|------------|------------|-------|---------|
| create API token (=new user) | none | H:password, username/comment | POST /`v1/tokens` | token |
| delete API token | password | H:password | DELETE `/v1/tokens/<token>`| success |
| create a team | token | token, teamName | POST /v1/teams | team ID, teamCode (required to join) |
| retrieve a teams passcode | none (you must be part of the team) | none | GET `/v1/teams/<teamID>/passcode` | passcode
| join a team | password | H:password, H:teamCode, token | POST `/v1/teams/<teamID>/members` | success |
| leave a team | password | H:password, token | DELETE `/v1/teams/<teamID>/members` | success |
| add planet data | none | array of planet info, token | POST `/v1/planets`
| add player data | none | array of player info, token | POST `/v1/players`

Limitations:
1. deleting an API token or leaving a team does not remove the data that has been already sent
1. there is no way to delete submitted data
1. an API tokens password cannot be recovered
1. deleting a team is only possible for the last remaining member

## DB structure

```mermaid
classDiagram
  teamMembers --> teams
  teamMembers --> tokens
  planets --> players
  planets --> teams
  class tokens {
    id: int
    name: string
    value: string
    password: string [hashed]
  }
  class teams {
    id: int
    name: string
    code: string
  }
  class teamMembers {
    id: int
    token: int (tokens.id)
    team: int (teams.id)
  }
  class planets {
    id: int
    teamId: int (teams.id)
    universe: int
    galaxy: int
    system: int
    position: int
    resources: json
    buildings: json
    fleet: json
    defense: json
    playerId: int (players.id)
  }
  class players {
    id: int
    name: string
    alliance: string
    research: json
    rank: int
    points: json
  }
```

## Ideas

### Prevent API spam by implementing rate limit

Especially for POST/DELETE operations

- either via proxy https://faun.pub/prevent-ddos-attacks-with-traefik-2-44fb32eeac4f
- or in app https://www.npmjs.com/package/express-slow-down
