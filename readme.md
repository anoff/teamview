# 0game Teamview

## Required use cases

| usecase | auth level | payload (H:eader) | route | returns |
|---------|------------|------------|-------|---------|
| create API token (=new user) | none | H:password, username/comment | POST /`v1/tokens` | token |
| delete API token | password | H:password | DELETE `/v1/tokens/<token>`| success |
| create a team | password | H:password, teamName | POST /v1/teams | team ID, teamCode (required to join) |
| retrieve a teams passcode | none (you must be part of the team) | none | GET `/v1/teams/<teamID>/passcode` | passcode
| join a team | password | H:password, H:teamCode | POST `/v1/tokens/<token>/teams/<teamID>` | success |
| leave a team | password | H:password | DELETE `/v1/tokens/<token>/teams/<teamID>` | success |
| add galaxy data | none | array of planet info | POST `/v1/tokens/<token>/planets`

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
    playerId: int (players.id)
  }
  class players {
    id: int
    name: string
    alliance: string
    rank: int
    points: int
    pointsDefense: int
    pointsBuildings: int
    pointsFleet: int
  }
```