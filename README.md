# 🏏 CRICKET RANKING SYSTEM

**ICC-Style Rankings System with Automatic Calculations**

## 📋 PROJECT OVERVIEW

This is a complete cricket ranking system that automatically calculates player ratings based on:
- ✅ **Batting Performance** (runs, strike rate, boundaries)
- ✅ **Bowling Performance** (wickets, economy, balls bowled)
- ✅ **Fielding Performance** (catches, run-outs, stumpings)
- ✅ **All-Rounder Ratings** (combined performance)
- ✅ **Overall Rankings** (complete player value)

### 🎯 KEY FEATURES

1. **Ball-Based System** - Not limited to fixed overs
2. **Auto-Calculation** - Rankings update automatically when data is entered
3. **Fair Points System** - Every action has a point value
4. **ICC-Style Interface** - Professional rankings display
5. **Admin Panel** - Easy data input
6. **API-Based** - Can be used for web, mobile, and desktop apps

---

## 🗂️ PROJECT STRUCTURE

```
cricket-ranking-system/
├── backend/
│   ├── database.sql          # PostgreSQL schema with auto-calculation
│   ├── api.js                # Node.js REST API
│   └── package.json          # Dependencies
├── frontend/
│   ├── admin.html            # Admin panel for data input
│   └── public.html           # Public rankings display (ICC style)
└── README.md                 # This file
```

---

## 🚀 SETUP INSTRUCTIONS

### 1️⃣ Prerequisites

Install these first:
- **PostgreSQL** (version 12 or higher)
- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)

### 2️⃣ Database Setup

1. Create a new PostgreSQL database:
```bash
createdb cricket_ranking
```

2. Run the database schema:
```bash
psql -d cricket_ranking -f backend/database.sql
```

This will create:
- All tables (players, matches, batting_inputs, etc.)
- Stored procedures for calculations
- Triggers for auto-updates
- Sample data (optional)

### 3️⃣ Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Update database credentials in `api.js`:
```javascript
const pool = new Pool({
    user: 'postgres',           // Your PostgreSQL username
    host: 'localhost',
    database: 'cricket_ranking',
    password: 'your_password',  // Your PostgreSQL password
    port: 5432,
});
```

4. Start the API server:
```bash
npm start
```

Server will run on: `http://localhost:3000`

### 4️⃣ Frontend Setup

1. Open the frontend files in a browser:
   - **Admin Panel**: `frontend/admin.html`
   - **Public Rankings**: `frontend/public.html`

2. Make sure the API is running before opening the frontend.

---

## 📊 HOW THE SYSTEM WORKS

### Points Calculation

#### 🏏 BATTING POINTS
```
- 1 run = 1 point
- Boundary (4) = +1 extra point
- Six = +2 extra points
- Strike Rate > 150 = +10 bonus
- Strike Rate > 180 = +20 bonus
- Duck (out for 0) = -5 penalty
```

**Example:**
- Player scores 50 runs off 30 balls with 5 fours and 2 sixes
- Base: 50 points (runs)
- Fours: 5 × 1 = 5 points
- Sixes: 2 × 2 = 4 points
- Strike Rate: (50/30) × 100 = 166.67 → +10 bonus
- **Total Batting Rating: 69 points**

#### 🎯 BOWLING POINTS
```
- Wicket = +25 points
- Economy < 6 = +20 bonus
- Economy < 7 = +10 bonus
- Economy > 10 = -5 penalty
```

**Example:**
- Bowler takes 3 wickets in 4 overs, concedes 24 runs
- Wickets: 3 × 25 = 75 points
- Economy: 24/4 = 6.0
- **Total Bowling Rating: 75 points**

#### 🧤 FIELDING POINTS
```
- Catch = +8 points
- Run-out = +12 points
- Stumping = +15 points
```

#### ⭐ ALL-ROUNDER RATING
```
All-Rounder Rating = 
    (Batting Rating × 0.4) + 
    (Bowling Rating × 0.4) + 
    (Fielding Rating × 0.2)
```

#### 👑 OVERALL RATING
```
Overall Rating = 
    (Batting Rating × 0.35) + 
    (Bowling Rating × 0.35) + 
    (Fielding Rating × 0.15) + 
    (All-Rounder Rating × 0.15)
```

---

## 🎮 HOW TO USE

### Admin Panel (Data Input)

1. **Add Players**
   - Go to "Players" tab
   - Enter name, batting style, bowling style, role
   - Click "Add Player"

2. **Create Match**
   - Go to "Matches" tab
   - Enter date, overs, venue
   - Click "Create Match"

3. **Enter Performance**
   - Go to "Performance Entry" tab
   - Select match from dropdown
   - Click on a player
   - Enter batting, bowling, fielding stats
   - Click "Save Performance"
   - **Rankings will update automatically!**

### Public Rankings (View)

1. Open `public.html` in browser
2. Navigate between tabs:
   - **Home**: Top 5 performers
   - **Batting**: All batting rankings
   - **Bowling**: All bowling rankings
   - **Fielding**: All fielding rankings
   - **All-Rounder**: Combined rankings
   - **Overall**: Complete rankings

---

## 🔌 API ENDPOINTS

### Players
- `GET /api/players` - Get all players
- `GET /api/players/:id` - Get player details
- `POST /api/players` - Add new player

### Matches
- `GET /api/matches` - Get all matches
- `POST /api/matches` - Create new match

### Performance Input
- `POST /api/batting` - Add batting performance
- `POST /api/bowling` - Add bowling performance
- `POST /api/fielding` - Add fielding performance

### Rankings
- `GET /api/rankings/batting` - Batting rankings
- `GET /api/rankings/bowling` - Bowling rankings
- `GET /api/rankings/fielding` - Fielding rankings
- `GET /api/rankings/allrounder` - All-rounder rankings
- `GET /api/rankings/overall` - Overall rankings

### Stats
- `GET /api/stats/top-performers` - Top 5 in each category

---

## 📱 MOBILE APP (Android APK)

### Using React Native

1. Install React Native CLI:
```bash
npm install -g react-native-cli
```

2. Create new project:
```bash
npx react-native init CricketRankings
```

3. Install dependencies:
```bash
cd CricketRankings
npm install axios @react-navigation/native
```

4. Use the same API endpoints to fetch data
5. Build APK:
```bash
cd android
./gradlew assembleRelease
```

APK will be in: `android/app/build/outputs/apk/release/`

---

## 💻 WINDOWS APP

### Using Electron

1. Create Electron app:
```bash
npm install -g electron
```

2. Create `main.js`:
```javascript
const { app, BrowserWindow } = require('electron');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
  });
  
  win.loadFile('frontend/public.html');
}

app.whenReady().then(createWindow);
```

3. Build Windows executable:
```bash
npm install electron-builder --save-dev
npm run build
```

---

## 🛠️ CUSTOMIZATION

### Change Points System

Edit the stored procedure `calculate_ratings()` in `database.sql`:

```sql
-- Example: Change boundary points
v_batting_rating := stats.total_runs + (stats.fours * 2) + (stats.sixes * 3);
```

### Add New Stats

1. Add column to `player_stats` table
2. Update `calculate_player_stats()` procedure
3. Update `calculate_ratings()` to include new stat
4. Update frontend to display new stat

---

## 🐛 TROUBLESHOOTING

### Database Connection Error
- Check PostgreSQL is running: `pg_isready`
- Verify credentials in `api.js`
- Check database exists: `psql -l`

### API Not Working
- Check if server is running on port 3000
- Look for error messages in console
- Verify CORS is enabled

### Rankings Not Updating
- Check if triggers are created: `\df` in psql
- Verify data is being inserted
- Check PostgreSQL logs

---

## 📈 FUTURE ENHANCEMENTS

- [ ] Player comparison tool
- [ ] Career graphs and charts
- [ ] Match-by-match breakdown
- [ ] Export rankings to PDF
- [ ] Player profile pages
- [ ] Team rankings
- [ ] Tournament mode
- [ ] Historical data analysis

---

## 🤝 CONTRIBUTING

This is a complete, production-ready system. Feel free to:
- Add new features
- Improve the UI
- Optimize calculations
- Add more statistics

---

## 📄 LICENSE

MIT License - Free to use and modify

---

## 📞 SUPPORT

For issues or questions:
1. Check the troubleshooting section
2. Review the API endpoints
3. Check PostgreSQL logs
4. Verify all services are running

---

## 🎉 CONCLUSION

You now have a **complete, ICC-style cricket ranking system** that:
- ✅ Automatically calculates ratings
- ✅ Updates rankings in real-time
- ✅ Works with any number of overs
- ✅ Includes batting, bowling, and fielding
- ✅ Has a professional UI
- ✅ Can be extended to mobile and desktop

**Happy Ranking! 🏏**
