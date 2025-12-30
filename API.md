# API DOCUMENTATION

Base URL: `http://localhost:3000/api`

## 📋 Players

### Get All Players
```http
GET /api/players
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Ali Khan",
    "batting_style": "Right Hand Bat",
    "bowling_style": "Right Arm Fast",
    "role": "All-Rounder",
    "photo_url": null
  }
]
```

### Get Single Player
```http
GET /api/players/:id
```

**Response:**
```json
{
  "player": {
    "id": 1,
    "name": "Ali Khan",
    "role": "All-Rounder"
  },
  "stats": {
    "matches": 10,
    "total_runs": 450,
    "total_balls": 380,
    "wickets": 15
  },
  "ratings": {
    "batting_rating": 520,
    "bowling_rating": 375,
    "overall_rating": 625
  }
}
```

### Add Player
```http
POST /api/players
```

**Body:**
```json
{
  "name": "Hassan Ahmed",
  "batting_style": "Left Hand Bat",
  "bowling_style": null,
  "role": "Batsman",
  "photo_url": null
}
```

---

## 🏏 Matches

### Get All Matches
```http
GET /api/matches
```

### Create Match
```http
POST /api/matches
```

**Body:**
```json
{
  "match_date": "2024-01-15",
  "overs": 10.5,
  "venue": "Gaddafi Stadium"
}
```

---

## 📊 Performance Input

### Add Batting Performance
```http
POST /api/batting
```

**Body:**
```json
{
  "match_id": 1,
  "player_id": 1,
  "runs": 45,
  "balls": 30,
  "fours": 5,
  "sixes": 2,
  "out": true
}
```

### Add Bowling Performance
```http
POST /api/bowling
```

**Body:**
```json
{
  "match_id": 1,
  "player_id": 1,
  "balls": 24,
  "runs_conceded": 28,
  "wickets": 2
}
```

### Add Fielding Performance
```http
POST /api/fielding
```

**Body:**
```json
{
  "match_id": 1,
  "player_id": 1,
  "catches": 2,
  "runouts": 1,
  "stumpings": 0
}
```

---

## 🏆 Rankings

### Batting Rankings
```http
GET /api/rankings/batting
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Ali Khan",
    "role": "All-Rounder",
    "batting_rating": 520,
    "total_runs": 450,
    "total_balls": 380,
    "strike_rate": 118.42,
    "fours": 45,
    "sixes": 12
  }
]
```

### Bowling Rankings
```http
GET /api/rankings/bowling
```

### Fielding Rankings
```http
GET /api/rankings/fielding
```

### All-Rounder Rankings
```http
GET /api/rankings/allrounder
```

### Overall Rankings
```http
GET /api/rankings/overall
```

---

## 📈 Statistics

### Top Performers
```http
GET /api/stats/top-performers
```

**Response:**
```json
{
  "topBatsmen": [
    {
      "name": "Ali Khan",
      "batting_rating": 520,
      "total_runs": 450
    }
  ],
  "topBowlers": [
    {
      "name": "Usman Qadir",
      "bowling_rating": 400,
      "wickets": 18
    }
  ],
  "topOverall": [
    {
      "name": "Ali Khan",
      "overall_rating": 625
    }
  ]
}
```

---

## 🔒 Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

**Error Response:**
```json
{
  "error": "Error message here"
}
```

---

## 📝 Notes

1. All ratings are calculated automatically via database triggers
2. Stats are aggregated in real-time
3. Rankings are sorted by rating in descending order
4. Duplicate entries (same player, same match) are updated, not inserted
