# POINTS & RATING SYSTEM EXPLAINED

## 🎯 CORE PHILOSOPHY

The system is designed to be:
1. **Fair** - Every action has appropriate weight
2. **Balanced** - No single stat dominates
3. **Comprehensive** - Considers batting, bowling, fielding
4. **ICC-Inspired** - Similar to international ranking methods

---

## 🏏 BATTING RATING CALCULATION

### Base Points
- **1 run = 1 point**

### Boundary Bonuses
- **Four = +1 extra point** (total 5 points for a 4)
- **Six = +2 extra points** (total 8 points for a 6)

### Strike Rate Bonuses
- **SR > 150**: +10 points
- **SR > 180**: +20 points

### Penalties
- **Duck (out for 0)**: -5 points

### Formula
```
batting_rating = 
    total_runs + 
    (fours × 1) + 
    (sixes × 2) + 
    strike_rate_bonus - 
    duck_penalty
```

### Examples

**Example 1: Aggressive Innings**
- Runs: 75
- Balls: 40
- Fours: 8
- Sixes: 4
- Out: Yes

Calculation:
- Base: 75 points
- Fours: 8 × 1 = 8 points
- Sixes: 4 × 2 = 8 points
- Strike Rate: (75/40) × 100 = 187.5 → +20 bonus
- **Total: 111 points**

**Example 2: Steady Innings**
- Runs: 45
- Balls: 35
- Fours: 5
- Sixes: 1
- Out: No

Calculation:
- Base: 45 points
- Fours: 5 × 1 = 5 points
- Sixes: 1 × 2 = 2 points
- Strike Rate: (45/35) × 100 = 128.57 → +0 bonus
- **Total: 52 points**

**Example 3: Duck**
- Runs: 0
- Balls: 3
- Fours: 0
- Sixes: 0
- Out: Yes

Calculation:
- Base: 0 points
- Duck penalty: -5 points
- **Total: -5 points**

---

## 🎯 BOWLING RATING CALCULATION

### Base Points
- **Wicket = +25 points**

### Economy Bonuses
- **Economy < 6**: +20 points
- **Economy < 7**: +10 points

### Penalties
- **Economy > 10**: -5 points

### Formula
```
bowling_rating = 
    (wickets × 25) + 
    economy_bonus - 
    economy_penalty
```

### Examples

**Example 1: Match-Winning Spell**
- Wickets: 4
- Balls: 24 (4 overs)
- Runs Conceded: 20

Calculation:
- Base: 4 × 25 = 100 points
- Economy: 20/4 = 5.0 → +20 bonus
- **Total: 120 points**

**Example 2: Economical Bowling**
- Wickets: 2
- Balls: 18 (3 overs)
- Runs Conceded: 18

Calculation:
- Base: 2 × 25 = 50 points
- Economy: 18/3 = 6.0
- **Total: 50 points** (no bonus, right at 6.0)

**Example 3: Expensive Bowling**
- Wickets: 1
- Balls: 12 (2 overs)
- Runs Conceded: 28

Calculation:
- Base: 1 × 25 = 25 points
- Economy: 28/2 = 14.0 → -5 penalty
- **Total: 20 points**

---

## 🧤 FIELDING RATING CALCULATION

### Point Values
- **Catch = +8 points**
- **Run-out = +12 points**
- **Stumping = +15 points**

### Formula
```
fielding_rating = 
    (catches × 8) + 
    (runouts × 12) + 
    (stumpings × 15)
```

### Examples

**Example 1: Excellent Fielder**
- Catches: 5
- Run-outs: 2
- Stumpings: 0

Calculation:
- Catches: 5 × 8 = 40 points
- Run-outs: 2 × 12 = 24 points
- **Total: 64 points**

**Example 2: Wicket-Keeper**
- Catches: 3
- Run-outs: 1
- Stumpings: 2

Calculation:
- Catches: 3 × 8 = 24 points
- Run-outs: 1 × 12 = 12 points
- Stumpings: 2 × 15 = 30 points
- **Total: 66 points**

---

## ⭐ ALL-ROUNDER RATING

Combines batting, bowling, and fielding prowess.

### Formula
```
allrounder_rating = 
    (batting_rating × 0.4) + 
    (bowling_rating × 0.4) + 
    (fielding_rating × 0.2)
```

### Weights Explanation
- **40% Batting** - Primary skill
- **40% Bowling** - Primary skill
- **20% Fielding** - Supporting skill

### Example
- Batting Rating: 500
- Bowling Rating: 400
- Fielding Rating: 50

Calculation:
- Batting: 500 × 0.4 = 200
- Bowling: 400 × 0.4 = 160
- Fielding: 50 × 0.2 = 10
- **Total: 370 points**

---

## 👑 OVERALL RATING

The ultimate player value metric.

### Formula
```
overall_rating = 
    (batting_rating × 0.35) + 
    (bowling_rating × 0.35) + 
    (fielding_rating × 0.15) + 
    (allrounder_rating × 0.15)
```

### Weights Explanation
- **35% Batting** - Core skill
- **35% Bowling** - Core skill
- **15% Fielding** - Important but secondary
- **15% All-rounder** - Versatility bonus

### Complete Example

Player stats after 10 matches:
- Total Runs: 450 (380 balls, 45 fours, 12 sixes)
- Wickets: 15 (240 balls, 150 runs conceded)
- Catches: 8, Run-outs: 2, Stumpings: 0

**Step 1: Batting Rating**
- Base: 450
- Fours: 45 × 1 = 45
- Sixes: 12 × 2 = 24
- SR: (450/380) × 100 = 118.4 → +0
- **Batting Rating: 519**

**Step 2: Bowling Rating**
- Wickets: 15 × 25 = 375
- Economy: 150/(240/6) = 3.75 → +20
- **Bowling Rating: 395**

**Step 3: Fielding Rating**
- Catches: 8 × 8 = 64
- Run-outs: 2 × 12 = 24
- **Fielding Rating: 88**

**Step 4: All-rounder Rating**
- (519 × 0.4) + (395 × 0.4) + (88 × 0.2)
- 207.6 + 158 + 17.6
- **All-rounder Rating: 383.2**

**Step 5: Overall Rating**
- (519 × 0.35) + (395 × 0.35) + (88 × 0.15) + (383.2 × 0.15)
- 181.65 + 138.25 + 13.2 + 57.48
- **Overall Rating: 390.58**

---

## 📊 RATING SCALES

### Batting Rating Scale
- **0-100**: Beginner
- **101-300**: Amateur
- **301-500**: Good
- **501-800**: Very Good
- **801+**: Excellent

### Bowling Rating Scale
- **0-50**: Occasional Bowler
- **51-150**: Regular Bowler
- **151-300**: Good Bowler
- **301-500**: Very Good Bowler
- **501+**: Excellent Bowler

### Overall Rating Scale
- **0-100**: Beginner
- **101-250**: Amateur
- **251-400**: Good Player
- **401-600**: Very Good Player
- **601+**: Excellent Player

---

## 🔄 AUTOMATIC UPDATES

The system uses PostgreSQL triggers to:
1. Recalculate player stats after each performance entry
2. Update ratings automatically
3. Refresh rankings in real-time

**You never need to manually calculate anything!**

---

## 🎮 WHY THIS SYSTEM WORKS

1. **Balanced Scoring**: No single stat dominates
2. **Rewards Excellence**: High strike rates and low economies get bonuses
3. **Penalizes Failure**: Ducks and expensive bowling have penalties
4. **Comprehensive**: All three disciplines are considered
5. **Fair**: Ball-based, not over-limited
6. **Scalable**: Works for any match length

---

## 🛠️ CUSTOMIZATION

Want to change the points? Edit the `calculate_ratings()` function in `database.sql`:

```sql
-- Example: Make sixes worth more
v_batting_rating := stats.total_runs + (stats.fours * 1) + (stats.sixes * 5);

-- Example: Change economy bonus threshold
IF v_economy < 5 THEN
    v_bowling_rating := v_bowling_rating + 30;
END IF;
```

Then reload the database schema!
