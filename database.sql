-- ============================================
-- CRICKET RANKING SYSTEM - DATABASE SCHEMA
-- ============================================

-- 1. PLAYERS TABLE
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    batting_style TEXT,
    bowling_style TEXT,
    role TEXT, -- Batsman, Bowler, All-Rounder, Wicket-Keeper
    photo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. MATCHES TABLE
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    match_date DATE NOT NULL,
    overs FLOAT NOT NULL,
    venue TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. BATTING INPUT (PER MATCH)
CREATE TABLE batting_inputs (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id) ON DELETE CASCADE,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    runs INT DEFAULT 0,
    balls INT DEFAULT 0,
    fours INT DEFAULT 0,
    sixes INT DEFAULT 0,
    out BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_id, player_id)
);

-- 4. BOWLING INPUT (PER MATCH)
CREATE TABLE bowling_inputs (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id) ON DELETE CASCADE,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    balls INT DEFAULT 0,
    runs_conceded INT DEFAULT 0,
    wickets INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_id, player_id)
);

-- 5. FIELDING INPUT (PER MATCH)
CREATE TABLE fielding_inputs (
    id SERIAL PRIMARY KEY,
    match_id INT REFERENCES matches(id) ON DELETE CASCADE,
    player_id INT REFERENCES players(id) ON DELETE CASCADE,
    catches INT DEFAULT 0,
    runouts INT DEFAULT 0,
    stumpings INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(match_id, player_id)
);

-- 6. AGGREGATED PLAYER STATS (AUTO CALCULATED)
CREATE TABLE player_stats (
    player_id INT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    matches INT DEFAULT 0,
    
    -- Batting
    total_runs INT DEFAULT 0,
    total_balls INT DEFAULT 0,
    fours INT DEFAULT 0,
    sixes INT DEFAULT 0,
    times_out INT DEFAULT 0,
    
    -- Bowling
    bowling_balls INT DEFAULT 0,
    runs_conceded INT DEFAULT 0,
    wickets INT DEFAULT 0,
    
    -- Fielding
    catches INT DEFAULT 0,
    runouts INT DEFAULT 0,
    stumpings INT DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. RATINGS TABLE
CREATE TABLE ratings (
    player_id INT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
    batting_rating FLOAT DEFAULT 0,
    bowling_rating FLOAT DEFAULT 0,
    fielding_rating FLOAT DEFAULT 0,
    allrounder_rating FLOAT DEFAULT 0,
    overall_rating FLOAT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_batting_match ON batting_inputs(match_id);
CREATE INDEX idx_batting_player ON batting_inputs(player_id);
CREATE INDEX idx_bowling_match ON bowling_inputs(match_id);
CREATE INDEX idx_bowling_player ON bowling_inputs(player_id);
CREATE INDEX idx_fielding_match ON fielding_inputs(match_id);
CREATE INDEX idx_fielding_player ON fielding_inputs(player_id);
CREATE INDEX idx_ratings_batting ON ratings(batting_rating DESC);
CREATE INDEX idx_ratings_bowling ON ratings(bowling_rating DESC);
CREATE INDEX idx_ratings_overall ON ratings(overall_rating DESC);

-- ============================================
-- STORED PROCEDURE: CALCULATE PLAYER STATS
-- ============================================
CREATE OR REPLACE FUNCTION calculate_player_stats(p_player_id INT)
RETURNS VOID AS $$
BEGIN
    -- Update player_stats table
    INSERT INTO player_stats (player_id, matches, total_runs, total_balls, fours, sixes, times_out,
                              bowling_balls, runs_conceded, wickets,
                              catches, runouts, stumpings)
    SELECT 
        p_player_id,
        COUNT(DISTINCT COALESCE(b.match_id, bo.match_id, f.match_id)),
        COALESCE(SUM(b.runs), 0),
        COALESCE(SUM(b.balls), 0),
        COALESCE(SUM(b.fours), 0),
        COALESCE(SUM(b.sixes), 0),
        COALESCE(SUM(CASE WHEN b.out THEN 1 ELSE 0 END), 0),
        COALESCE(SUM(bo.balls), 0),
        COALESCE(SUM(bo.runs_conceded), 0),
        COALESCE(SUM(bo.wickets), 0),
        COALESCE(SUM(f.catches), 0),
        COALESCE(SUM(f.runouts), 0),
        COALESCE(SUM(f.stumpings), 0)
    FROM players p
    LEFT JOIN batting_inputs b ON p.id = b.player_id
    LEFT JOIN bowling_inputs bo ON p.id = bo.player_id
    LEFT JOIN fielding_inputs f ON p.id = f.player_id
    WHERE p.id = p_player_id
    GROUP BY p.id
    ON CONFLICT (player_id) DO UPDATE SET
        matches = EXCLUDED.matches,
        total_runs = EXCLUDED.total_runs,
        total_balls = EXCLUDED.total_balls,
        fours = EXCLUDED.fours,
        sixes = EXCLUDED.sixes,
        times_out = EXCLUDED.times_out,
        bowling_balls = EXCLUDED.bowling_balls,
        runs_conceded = EXCLUDED.runs_conceded,
        wickets = EXCLUDED.wickets,
        catches = EXCLUDED.catches,
        runouts = EXCLUDED.runouts,
        stumpings = EXCLUDED.stumpings,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STORED PROCEDURE: CALCULATE RATINGS
-- ============================================
CREATE OR REPLACE FUNCTION calculate_ratings(p_player_id INT)
RETURNS VOID AS $$
DECLARE
    v_batting_rating FLOAT := 0;
    v_bowling_rating FLOAT := 0;
    v_fielding_rating FLOAT := 0;
    v_allrounder_rating FLOAT := 0;
    v_overall_rating FLOAT := 0;
    v_strike_rate FLOAT := 0;
    v_economy FLOAT := 0;
    stats RECORD;
BEGIN
    -- Get player stats
    SELECT * INTO stats FROM player_stats WHERE player_id = p_player_id;
    
    IF stats IS NULL THEN
        RETURN;
    END IF;
    
    -- ========================================
    -- BATTING RATING CALCULATION
    -- ========================================
    v_batting_rating := stats.total_runs + (stats.fours * 1) + (stats.sixes * 2);
    
    -- Strike rate bonus
    IF stats.total_balls > 0 THEN
        v_strike_rate := (stats.total_runs::FLOAT / stats.total_balls) * 100;
        IF v_strike_rate > 180 THEN
            v_batting_rating := v_batting_rating + 20;
        ELSIF v_strike_rate > 150 THEN
            v_batting_rating := v_batting_rating + 10;
        END IF;
    END IF;
    
    -- Duck penalty
    IF stats.total_runs = 0 AND stats.times_out > 0 THEN
        v_batting_rating := v_batting_rating - (stats.times_out * 5);
    END IF;
    
    -- ========================================
    -- BOWLING RATING CALCULATION
    -- ========================================
    v_bowling_rating := stats.wickets * 25;
    
    -- Economy bonus (for bowlers who have bowled)
    IF stats.bowling_balls > 0 THEN
        v_economy := (stats.runs_conceded::FLOAT / (stats.bowling_balls / 6.0));
        IF v_economy < 6 THEN
            v_bowling_rating := v_bowling_rating + 20;
        ELSIF v_economy < 7 THEN
            v_bowling_rating := v_bowling_rating + 10;
        END IF;
        
        -- Penalty for expensive bowling
        IF v_economy > 10 THEN
            v_bowling_rating := v_bowling_rating - 5;
        END IF;
    END IF;
    
    -- ========================================
    -- FIELDING RATING CALCULATION
    -- ========================================
    v_fielding_rating := (stats.catches * 8) + (stats.runouts * 12) + (stats.stumpings * 15);
    
    -- ========================================
    -- ALL-ROUNDER RATING
    -- ========================================
    v_allrounder_rating := (v_batting_rating * 0.4) + (v_bowling_rating * 0.4) + (v_fielding_rating * 0.2);
    
    -- ========================================
    -- OVERALL RATING
    -- ========================================
    v_overall_rating := (v_batting_rating * 0.35) + (v_bowling_rating * 0.35) + 
                        (v_fielding_rating * 0.15) + (v_allrounder_rating * 0.15);
    
    -- Insert or update ratings
    INSERT INTO ratings (player_id, batting_rating, bowling_rating, fielding_rating, 
                        allrounder_rating, overall_rating)
    VALUES (p_player_id, v_batting_rating, v_bowling_rating, v_fielding_rating,
            v_allrounder_rating, v_overall_rating)
    ON CONFLICT (player_id) DO UPDATE SET
        batting_rating = EXCLUDED.batting_rating,
        bowling_rating = EXCLUDED.bowling_rating,
        fielding_rating = EXCLUDED.fielding_rating,
        allrounder_rating = EXCLUDED.allrounder_rating,
        overall_rating = EXCLUDED.overall_rating,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: AUTO UPDATE STATS & RATINGS
-- ============================================
CREATE OR REPLACE FUNCTION trigger_update_player()
RETURNS TRIGGER AS $$
BEGIN
    -- Update stats
    PERFORM calculate_player_stats(NEW.player_id);
    
    -- Update ratings
    PERFORM calculate_ratings(NEW.player_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_after_batting
AFTER INSERT OR UPDATE OR DELETE ON batting_inputs
FOR EACH ROW EXECUTE FUNCTION trigger_update_player();

CREATE TRIGGER update_after_bowling
AFTER INSERT OR UPDATE OR DELETE ON bowling_inputs
FOR EACH ROW EXECUTE FUNCTION trigger_update_player();

CREATE TRIGGER update_after_fielding
AFTER INSERT OR UPDATE OR DELETE ON fielding_inputs
FOR EACH ROW EXECUTE FUNCTION trigger_update_player();

-- ============================================
-- SAMPLE DATA (OPTIONAL)
-- ============================================
INSERT INTO players (name, batting_style, bowling_style, role) VALUES
('Muzammil khan', 'Right Hand Bat', 'Right Arm Fast', 'All-Rounder'),
('Hassan Ahmed', 'Left Hand Bat', NULL, 'Batsman'),
('Usman Qadir', 'Right Hand Bat', 'Leg Spin', 'Bowler'),
('Rizwan Shah', 'Right Hand Bat', NULL, 'Wicket-Keeper');
