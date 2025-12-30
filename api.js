const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// ============================================
// DATABASE CONNECTION
// ============================================
// Choose ONE configuration:

// OPTION 1: For LOCAL development (PostgreSQL)
// const pool = new Pool({
//     user: 'postgres',
//     host: 'localhost',
//     database: 'cricket_ranking',
//     password: 'Ahmad2466',
//     port: 5432,
// });

// OPTION 2: For PRODUCTION (Neon/Supabase/any cloud DB)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:Ahmad2466@localhost:5432/cricket_ranking',
    ssl: process.env.DATABASE_URL ? {
        rejectUnauthorized: false
    } : false
});

// Test connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
    } else {
        console.log('✅ Database connected successfully!');
        console.log('⏰ Server time:', res.rows[0].now);
    }
});

app.use(cors());
app.use(express.json());

// ============================================
// PLAYERS ENDPOINTS
// ============================================

// Get all players
app.get('/api/players', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM players ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get single player with full details
app.get('/api/players/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const player = await pool.query('SELECT * FROM players WHERE id = $1', [id]);
        const stats = await pool.query('SELECT * FROM player_stats WHERE player_id = $1', [id]);
        const ratings = await pool.query('SELECT * FROM ratings WHERE player_id = $1', [id]);

        res.json({
            player: player.rows[0],
            stats: stats.rows[0],
            ratings: ratings.rows[0]
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get player match history
app.get('/api/players/:id/matches', async (req, res) => {
    try {
        const { id } = req.params;
        const { year } = req.query;

        let query = `
            SELECT 
                m.id,
                m.match_date,
                m.venue,
                m.overs,
                b.runs,
                b.balls,
                b.fours,
                b.sixes,
                b.out,
                bo.wickets,
                bo.balls as bowling_balls,
                bo.runs_conceded,
                f.catches,
                f.runouts,
                f.stumpings
            FROM matches m
            LEFT JOIN batting_inputs b ON m.id = b.match_id AND b.player_id = $1
            LEFT JOIN bowling_inputs bo ON m.id = bo.match_id AND bo.player_id = $1
            LEFT JOIN fielding_inputs f ON m.id = f.match_id AND f.player_id = $1
            WHERE (b.player_id = $1 OR bo.player_id = $1 OR f.player_id = $1)
        `;

        const params = [id];

        if (year && year !== 'all') {
            query += ' AND EXTRACT(YEAR FROM m.match_date) = $2';
            params.push(year);
        }

        query += ' ORDER BY m.match_date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new player
app.post('/api/players', async (req, res) => {
    try {
        const { name, batting_style, bowling_style, role, photo_url } = req.body;
        const result = await pool.query(
            'INSERT INTO players (name, batting_style, bowling_style, role, photo_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, batting_style, bowling_style, role, photo_url]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete player
app.delete('/api/players/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if player exists
        const playerCheck = await pool.query('SELECT name FROM players WHERE id = $1', [id]);

        if (playerCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Delete player (CASCADE will delete all related records)
        await pool.query('DELETE FROM players WHERE id = $1', [id]);

        res.json({
            success: true,
            message: `Player "${playerCheck.rows[0].name}" deleted successfully`
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// MATCHES ENDPOINTS
// ============================================

// Get all matches
app.get('/api/matches', async (req, res) => {
    try {
        const { year } = req.query;

        let query = 'SELECT * FROM matches';
        const params = [];

        if (year && year !== 'all') {
            query += ' WHERE EXTRACT(YEAR FROM match_date) = $1';
            params.push(year);
        }

        query += ' ORDER BY match_date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add new match
app.post('/api/matches', async (req, res) => {
    try {
        const { match_date, overs, venue } = req.body;
        const result = await pool.query(
            'INSERT INTO matches (match_date, overs, venue) VALUES ($1, $2, $3) RETURNING *',
            [match_date, overs, venue]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// BATTING INPUT ENDPOINTS
// ============================================

// Add batting performance
app.post('/api/batting', async (req, res) => {
    try {
        const { match_id, player_id, runs, balls, fours, sixes, out } = req.body;
        const result = await pool.query(
            `INSERT INTO batting_inputs (match_id, player_id, runs, balls, fours, sixes, out) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT (match_id, player_id) 
             DO UPDATE SET runs = $3, balls = $4, fours = $5, sixes = $6, out = $7
             RETURNING *`,
            [match_id, player_id, runs, balls, fours, sixes, out]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get batting for a match
app.get('/api/batting/match/:match_id', async (req, res) => {
    try {
        const { match_id } = req.params;
        const result = await pool.query(
            `SELECT b.*, p.name 
             FROM batting_inputs b 
             JOIN players p ON b.player_id = p.id 
             WHERE b.match_id = $1`,
            [match_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete batting performance
app.delete('/api/batting/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM batting_inputs WHERE id = $1', [id]);
        res.json({ success: true, message: 'Batting performance deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// BOWLING INPUT ENDPOINTS
// ============================================

// Add bowling performance
app.post('/api/bowling', async (req, res) => {
    try {
        const { match_id, player_id, balls, runs_conceded, wickets } = req.body;
        const result = await pool.query(
            `INSERT INTO bowling_inputs (match_id, player_id, balls, runs_conceded, wickets) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (match_id, player_id) 
             DO UPDATE SET balls = $3, runs_conceded = $4, wickets = $5
             RETURNING *`,
            [match_id, player_id, balls, runs_conceded, wickets]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get bowling for a match
app.get('/api/bowling/match/:match_id', async (req, res) => {
    try {
        const { match_id } = req.params;
        const result = await pool.query(
            `SELECT bo.*, p.name 
             FROM bowling_inputs bo 
             JOIN players p ON bo.player_id = p.id 
             WHERE bo.match_id = $1`,
            [match_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete bowling performance
app.delete('/api/bowling/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM bowling_inputs WHERE id = $1', [id]);
        res.json({ success: true, message: 'Bowling performance deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// FIELDING INPUT ENDPOINTS
// ============================================

// Add fielding performance
app.post('/api/fielding', async (req, res) => {
    try {
        const { match_id, player_id, catches, runouts, stumpings } = req.body;
        const result = await pool.query(
            `INSERT INTO fielding_inputs (match_id, player_id, catches, runouts, stumpings) 
             VALUES ($1, $2, $3, $4, $5) 
             ON CONFLICT (match_id, player_id) 
             DO UPDATE SET catches = $3, runouts = $4, stumpings = $5
             RETURNING *`,
            [match_id, player_id, catches, runouts, stumpings]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get fielding for a match
app.get('/api/fielding/match/:match_id', async (req, res) => {
    try {
        const { match_id } = req.params;
        const result = await pool.query(
            `SELECT f.*, p.name 
             FROM fielding_inputs f 
             JOIN players p ON f.player_id = p.id 
             WHERE f.match_id = $1`,
            [match_id]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete fielding performance
app.delete('/api/fielding/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM fielding_inputs WHERE id = $1', [id]);
        res.json({ success: true, message: 'Fielding performance deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// RANKINGS ENDPOINTS (WITH YEAR FILTERING)
// ============================================

// Get batting rankings
app.get('/api/rankings/batting', async (req, res) => {
    try {
        const { year } = req.query;

        let query = `
            SELECT p.*, 
                   COALESCE(SUM(b.runs), 0) as total_runs,
                   COALESCE(SUM(b.balls), 0) as total_balls,
                   COALESCE(SUM(b.fours), 0) as fours,
                   COALESCE(SUM(b.sixes), 0) as sixes,
                   COALESCE(SUM(CASE WHEN b.out THEN 1 ELSE 0 END), 0) as times_out,
                   CASE WHEN COALESCE(SUM(b.balls), 0) > 0 
                        THEN ROUND((COALESCE(SUM(b.runs), 0)::FLOAT / COALESCE(SUM(b.balls), 0) * 100)::numeric, 2)
                        ELSE 0 
                   END as strike_rate,
                   (COALESCE(SUM(b.runs), 0) + 
                    (COALESCE(SUM(b.fours), 0) * 1) + 
                    (COALESCE(SUM(b.sixes), 0) * 2) +
                    CASE 
                        WHEN COALESCE(SUM(b.balls), 0) > 0 AND 
                             (COALESCE(SUM(b.runs), 0)::FLOAT / COALESCE(SUM(b.balls), 0) * 100) > 180 
                        THEN 20
                        WHEN COALESCE(SUM(b.balls), 0) > 0 AND 
                             (COALESCE(SUM(b.runs), 0)::FLOAT / COALESCE(SUM(b.balls), 0) * 100) > 150 
                        THEN 10
                        ELSE 0
                    END -
                    CASE 
                        WHEN COALESCE(SUM(b.runs), 0) = 0 AND COALESCE(SUM(CASE WHEN b.out THEN 1 ELSE 0 END), 0) > 0
                        THEN (COALESCE(SUM(CASE WHEN b.out THEN 1 ELSE 0 END), 0) * 5)
                        ELSE 0
                    END) as batting_rating
            FROM players p
            LEFT JOIN batting_inputs b ON p.id = b.player_id
        `;

        const params = [];

        if (year && year !== 'all') {
            query += ` LEFT JOIN matches m ON b.match_id = m.id
                       WHERE EXTRACT(YEAR FROM m.match_date) = $1 OR b.match_id IS NULL`;
            params.push(year);
        }

        query += ` GROUP BY p.id
                   HAVING COALESCE(SUM(b.balls), 0) > 0
                   ORDER BY batting_rating DESC LIMIT 100`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get bowling rankings
app.get('/api/rankings/bowling', async (req, res) => {
    try {
        const { year } = req.query;

        let query = `
            SELECT p.*, 
                   COALESCE(SUM(bo.wickets), 0) as wickets,
                   COALESCE(SUM(bo.balls), 0) as bowling_balls,
                   COALESCE(SUM(bo.runs_conceded), 0) as runs_conceded,
                   CASE WHEN COALESCE(SUM(bo.balls), 0) > 0 
                        THEN ROUND((COALESCE(SUM(bo.runs_conceded), 0)::FLOAT / (COALESCE(SUM(bo.balls), 0) / 6.0))::numeric, 2)
                        ELSE 0 
                   END as economy,
                   (COALESCE(SUM(bo.wickets), 0) * 25 +
                    CASE 
                        WHEN COALESCE(SUM(bo.balls), 0) > 0 AND 
                             (COALESCE(SUM(bo.runs_conceded), 0)::FLOAT / (COALESCE(SUM(bo.balls), 0) / 6.0)) < 6
                        THEN 20
                        WHEN COALESCE(SUM(bo.balls), 0) > 0 AND 
                             (COALESCE(SUM(bo.runs_conceded), 0)::FLOAT / (COALESCE(SUM(bo.balls), 0) / 6.0)) < 7
                        THEN 10
                        ELSE 0
                    END -
                    CASE 
                        WHEN COALESCE(SUM(bo.balls), 0) > 0 AND 
                             (COALESCE(SUM(bo.runs_conceded), 0)::FLOAT / (COALESCE(SUM(bo.balls), 0) / 6.0)) > 10
                        THEN 5
                        ELSE 0
                    END) as bowling_rating
            FROM players p
            LEFT JOIN bowling_inputs bo ON p.id = bo.player_id
        `;

        const params = [];

        if (year && year !== 'all') {
            query += ` LEFT JOIN matches m ON bo.match_id = m.id
                       WHERE EXTRACT(YEAR FROM m.match_date) = $1 OR bo.match_id IS NULL`;
            params.push(year);
        }

        query += ` GROUP BY p.id
                   HAVING COALESCE(SUM(bo.balls), 0) > 0
                   ORDER BY bowling_rating DESC LIMIT 100`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get fielding rankings
app.get('/api/rankings/fielding', async (req, res) => {
    try {
        const { year } = req.query;

        let query = `
            SELECT p.*, 
                   COALESCE(SUM(f.catches), 0) as catches,
                   COALESCE(SUM(f.runouts), 0) as runouts,
                   COALESCE(SUM(f.stumpings), 0) as stumpings,
                   ((COALESCE(SUM(f.catches), 0) * 8) + 
                    (COALESCE(SUM(f.runouts), 0) * 12) + 
                    (COALESCE(SUM(f.stumpings), 0) * 15)) as fielding_rating
            FROM players p
            LEFT JOIN fielding_inputs f ON p.id = f.player_id
        `;

        const params = [];

        if (year && year !== 'all') {
            query += ` LEFT JOIN matches m ON f.match_id = m.id
                       WHERE EXTRACT(YEAR FROM m.match_date) = $1 OR f.match_id IS NULL`;
            params.push(year);
        }

        query += ` GROUP BY p.id
                   HAVING (COALESCE(SUM(f.catches), 0) + COALESCE(SUM(f.runouts), 0) + COALESCE(SUM(f.stumpings), 0)) > 0
                   ORDER BY fielding_rating DESC LIMIT 100`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all-rounder rankings
app.get('/api/rankings/allrounder', async (req, res) => {
    try {
        const { year } = req.query;

        let query = `
            SELECT p.*,
                   COALESCE(SUM(b.runs), 0) as total_runs,
                   COALESCE(SUM(b.balls), 0) as total_balls,
                   COALESCE(SUM(bo.wickets), 0) as wickets,
                   COALESCE(SUM(bo.balls), 0) as bowling_balls,
                   COALESCE(SUM(bo.runs_conceded), 0) as runs_conceded,
                   COALESCE(SUM(f.catches), 0) as catches,
                   COALESCE(SUM(f.runouts), 0) as runouts,
                   COALESCE(SUM(f.stumpings), 0) as stumpings,
                   (COALESCE(SUM(b.runs), 0) + (COALESCE(SUM(b.fours), 0) * 1) + (COALESCE(SUM(b.sixes), 0) * 2)) as batting_rating,
                   (COALESCE(SUM(bo.wickets), 0) * 25) as bowling_rating,
                   ((COALESCE(SUM(f.catches), 0) * 8) + (COALESCE(SUM(f.runouts), 0) * 12) + (COALESCE(SUM(f.stumpings), 0) * 15)) as fielding_rating,
                   ((COALESCE(SUM(b.runs), 0) + (COALESCE(SUM(b.fours), 0) * 1) + (COALESCE(SUM(b.sixes), 0) * 2)) * 0.4 +
                    (COALESCE(SUM(bo.wickets), 0) * 25) * 0.4 +
                    ((COALESCE(SUM(f.catches), 0) * 8) + (COALESCE(SUM(f.runouts), 0) * 12) + (COALESCE(SUM(f.stumpings), 0) * 15)) * 0.2) as allrounder_rating
            FROM players p
            LEFT JOIN batting_inputs b ON p.id = b.player_id
            LEFT JOIN bowling_inputs bo ON p.id = bo.player_id
            LEFT JOIN fielding_inputs f ON p.id = f.player_id
        `;

        const params = [];

        if (year && year !== 'all') {
            query += ` LEFT JOIN matches m1 ON b.match_id = m1.id
                       LEFT JOIN matches m2 ON bo.match_id = m2.id
                       LEFT JOIN matches m3 ON f.match_id = m3.id
                       WHERE (EXTRACT(YEAR FROM m1.match_date) = $1 OR b.match_id IS NULL)
                       AND (EXTRACT(YEAR FROM m2.match_date) = $1 OR bo.match_id IS NULL)
                       AND (EXTRACT(YEAR FROM m3.match_date) = $1 OR f.match_id IS NULL)`;
            params.push(year);
        }

        query += ` GROUP BY p.id
                   ORDER BY allrounder_rating DESC LIMIT 100`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get overall rankings
app.get('/api/rankings/overall', async (req, res) => {
    try {
        const { year } = req.query;

        let query = `
            SELECT p.*,
                   COUNT(DISTINCT COALESCE(b.match_id, bo.match_id, f.match_id)) as matches,
                   COALESCE(SUM(b.runs), 0) as total_runs,
                   COALESCE(SUM(bo.wickets), 0) as wickets,
                   (COALESCE(SUM(b.runs), 0) + (COALESCE(SUM(b.fours), 0) * 1) + (COALESCE(SUM(b.sixes), 0) * 2)) as batting_rating,
                   (COALESCE(SUM(bo.wickets), 0) * 25) as bowling_rating,
                   ((COALESCE(SUM(f.catches), 0) * 8) + (COALESCE(SUM(f.runouts), 0) * 12) + (COALESCE(SUM(f.stumpings), 0) * 15)) as fielding_rating,
                   ((COALESCE(SUM(b.runs), 0) + (COALESCE(SUM(b.fours), 0) * 1) + (COALESCE(SUM(b.sixes), 0) * 2)) * 0.4 +
                    (COALESCE(SUM(bo.wickets), 0) * 25) * 0.4 +
                    ((COALESCE(SUM(f.catches), 0) * 8) + (COALESCE(SUM(f.runouts), 0) * 12) + (COALESCE(SUM(f.stumpings), 0) * 15)) * 0.2) as allrounder_rating,
                   ((COALESCE(SUM(b.runs), 0) + (COALESCE(SUM(b.fours), 0) * 1) + (COALESCE(SUM(b.sixes), 0) * 2)) * 0.35 +
                    (COALESCE(SUM(bo.wickets), 0) * 25) * 0.35 +
                    ((COALESCE(SUM(f.catches), 0) * 8) + (COALESCE(SUM(f.runouts), 0) * 12) + (COALESCE(SUM(f.stumpings), 0) * 15)) * 0.15 +
                    ((COALESCE(SUM(b.runs), 0) + (COALESCE(SUM(b.fours), 0) * 1) + (COALESCE(SUM(b.sixes), 0) * 2)) * 0.4 +
                     (COALESCE(SUM(bo.wickets), 0) * 25) * 0.4 +
                     ((COALESCE(SUM(f.catches), 0) * 8) + (COALESCE(SUM(f.runouts), 0) * 12) + (COALESCE(SUM(f.stumpings), 0) * 15)) * 0.2) * 0.15) as overall_rating
            FROM players p
            LEFT JOIN batting_inputs b ON p.id = b.player_id
            LEFT JOIN bowling_inputs bo ON p.id = bo.player_id
            LEFT JOIN fielding_inputs f ON p.id = f.player_id
        `;

        const params = [];

        if (year && year !== 'all') {
            query += ` LEFT JOIN matches m1 ON b.match_id = m1.id
                       LEFT JOIN matches m2 ON bo.match_id = m2.id
                       LEFT JOIN matches m3 ON f.match_id = m3.id
                       WHERE (EXTRACT(YEAR FROM m1.match_date) = $1 OR b.match_id IS NULL)
                       AND (EXTRACT(YEAR FROM m2.match_date) = $1 OR bo.match_id IS NULL)
                       AND (EXTRACT(YEAR FROM m3.match_date) = $1 OR f.match_id IS NULL)`;
            params.push(year);
        }

        query += ` GROUP BY p.id
                   ORDER BY overall_rating DESC LIMIT 100`;

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// STATS ENDPOINTS
// ============================================

// Get top performers
app.get('/api/stats/top-performers', async (req, res) => {
    try {
        const { year } = req.query;
        const params = [];

        let yearFilter = '';
        if (year && year !== 'all') {
            yearFilter = ' AND EXTRACT(YEAR FROM m.match_date) = $1';
            params.push(year);
        }

        const topBatsmen = await pool.query(
            `SELECT p.id, p.name,
                    COALESCE(SUM(b.runs), 0) as total_runs,
                    (COALESCE(SUM(b.runs), 0) + (COALESCE(SUM(b.fours), 0) * 1) + (COALESCE(SUM(b.sixes), 0) * 2)) as batting_rating
             FROM players p
             LEFT JOIN batting_inputs b ON p.id = b.player_id
             LEFT JOIN matches m ON b.match_id = m.id
             WHERE 1=1 ${yearFilter}
             GROUP BY p.id, p.name
             HAVING COALESCE(SUM(b.balls), 0) > 0
             ORDER BY batting_rating DESC LIMIT 5`,
            params
        );

        const topBowlers = await pool.query(
            `SELECT p.id, p.name,
                    COALESCE(SUM(bo.wickets), 0) as wickets,
                    (COALESCE(SUM(bo.wickets), 0) * 25) as bowling_rating
             FROM players p
             LEFT JOIN bowling_inputs bo ON p.id = bo.player_id
             LEFT JOIN matches m ON bo.match_id = m.id
             WHERE 1=1 ${yearFilter}
             GROUP BY p.id, p.name
             HAVING COALESCE(SUM(bo.balls), 0) > 0
             ORDER BY bowling_rating DESC LIMIT 5`,
            params
        );

        const topOverall = await pool.query(
            `SELECT p.id, p.name,
                    ((COALESCE(SUM(b.runs), 0) + (COALESCE(SUM(b.fours), 0) * 1) + (COALESCE(SUM(b.sixes), 0) * 2)) * 0.35 +
                     (COALESCE(SUM(bo.wickets), 0) * 25) * 0.35 +
                     ((COALESCE(SUM(f.catches), 0) * 8) + (COALESCE(SUM(f.runouts), 0) * 12) + (COALESCE(SUM(f.stumpings), 0) * 15)) * 0.15) as overall_rating
             FROM players p
             LEFT JOIN batting_inputs b ON p.id = b.player_id
             LEFT JOIN bowling_inputs bo ON p.id = bo.player_id
             LEFT JOIN fielding_inputs f ON p.id = f.player_id
             LEFT JOIN matches m1 ON b.match_id = m1.id
             LEFT JOIN matches m2 ON bo.match_id = m2.id
             LEFT JOIN matches m3 ON f.match_id = m3.id
             WHERE 1=1 ${yearFilter.replace('m.match_date', 'm1.match_date')}
             GROUP BY p.id, p.name
             ORDER BY overall_rating DESC LIMIT 5`,
            params
        );

        res.json({
            topBatsmen: topBatsmen.rows,
            topBowlers: topBowlers.rows,
            topOverall: topOverall.rows
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================
// START SERVER
// ============================================
app.listen(port, () => {
    console.log(`🏏 Cricket Ranking API running on http://localhost:${port}`);
});