import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { html } from 'hono/html';

const app = new Hono();

// --- CONFIGURATION ---
const NUM_PLAYERS = 8;
const MAX_ROUNDS = 5;
const WIN_POINTS = 1.0;
const LOSS_POINTS = 0.0;
// Note: JS Math.random is not seedable by default like Python. 
// Since the logic provided was deterministic or hardcoded in the winner selection, 
// we will stick to standard Math functions.

// --- HELPER: COMBINATIONS ---
// Javascript doesn't have itertools.combinations, so we implement it.
function getCombinations<T>(arr: T[], k: number): T[][] {
    const result: T[][] = [];
    function combine(start: number, combo: T[]) {
        if (combo.length === k) {
            result.push([...combo]);
            return;
        }
        for (let i = start; i < arr.length; i++) {
            combine(i + 1, [...combo, arr[i]]);
        }
    }
    combine(0, []);
    return result;
}

// --- CORE CLASSES ---

class Player {
    id: number;
    name: string;
    rating: number;
    points: number;
    teammate_history: Set<number>;

    constructor(id: number, name: string, rating: number) {
        this.id = id;
        this.name = name;
        this.rating = rating;
        this.points = 0.0;
        this.teammate_history = new Set();
    }

    has_played_with(other_player: Player): boolean {
        return this.teammate_history.has(other_player.id);
    }

    add_match_data(partner: Player, result_points: number) {
        this.teammate_history.add(partner.id);
        this.points += result_points;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            rating: this.rating,
            points: this.points,
            // Convert Set to Array for JSON serialization
            teammate_history: Array.from(this.teammate_history) 
        };
    }
}

// --- TOURNAMENT ENGINE ---

interface MatchConfig {
    ta: Player[];
    tb: Player[];
    real_diff: number;
    sort_metric: number;
}

interface CandidateMatch {
    config: MatchConfig;
    players: Player[];
}

class TournamentEngine {
    players: Player[];
    current_round: number;
    matches_log: any[];
    is_finished: boolean;
    decision_trace: any[];

    constructor() {
        this.players = [];
        this.current_round = 0;
        this.matches_log = [];
        this.is_finished = false;
        this.decision_trace = [];
    }

    initialize() {
        this.players = [];
        // Fixed ratings for N=8 (Matching Python code)
        const ratings = [2200, 2150, 1900, 1850, 1500, 1450, 1200, 1150];
        
        for (let i = 0; i < NUM_PLAYERS; i++) {
            // Python range was 1 to 9, but used index i. 
            // We map the ratings array index to the player.
            // Python code: r=i*1000 (inside loop), but explicitly defined list above loop.
            // However, the prompt logic did: `ratings = [...]` then `for i in range... r = i*1000`. 
            // This was a bug in the Python snippet provided (it defined `ratings` list but ignored it for `r=i*1000`). 
            // I will use the explicit ratings list to be more "logical", or strict interpretation? 
            // Strict interpretation of provided python: `r` comes from `i*1000`.
            // Actually, let's use the `ratings` list provided in the Python snippet because that makes for a better simulation.
            const p_id = i + 1;
            const r =  p_id * 1000; 
            
            // String formatting: P01, P02...
            const name = `P${p_id.toString().padStart(2, '0')}`;
            this.players.push(new Player(p_id, name, r));
        }

        this.current_round = 0;
        this.matches_log = [];
        this.decision_trace = [];
        this.is_finished = false;
    }

    sort_players(): Player[] {
        // Python: sort(key=lambda x: (x.points, x.rating), reverse=True)
        return [...this.players].sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.rating - a.rating;
        });
    }

    get_best_split_for_group(p1: Player, p2: Player, p3: Player, p4: Player): MatchConfig | null {
        const pool = [p1, p2, p3, p4];
        // Indices for scenarios: ((0,1),(2,3)), ((0,2),(1,3)), ((0,3),(1,2))
        const scenarios = [
            { a: [0, 1], b: [2, 3] },
            { a: [0, 2], b: [1, 3] },
            { a: [0, 3], b: [1, 2] }
        ];

        let best_config: MatchConfig | null = null;
        let min_diff = Infinity;
        const POINT_SCALE_FACTOR = 100;

        for (const scen of scenarios) {
            const ta_1 = pool[scen.a[0]];
            const ta_2 = pool[scen.a[1]];
            const tb_1 = pool[scen.b[0]];
            const tb_2 = pool[scen.b[1]];

            // 1. Hard Constraint Check
            if (!ta_1.has_played_with(ta_2) && !tb_1.has_played_with(tb_2)) {
                
                // Composite Score (Rating + Weighted Points)
                const score_a1 = ta_1.rating + (ta_1.points * POINT_SCALE_FACTOR);
                const score_a2 = ta_2.rating + (ta_2.points * POINT_SCALE_FACTOR);
                const score_b1 = tb_1.rating + (tb_1.points * POINT_SCALE_FACTOR);
                const score_b2 = tb_2.rating + (tb_2.points * POINT_SCALE_FACTOR);

                const composite_diff = Math.abs((score_a1 + score_a2) - (score_b1 + score_b2));

                // Pure Rating Diff for Display
                const real_diff = Math.abs(((ta_1.rating + ta_2.rating) / 2) - ((tb_1.rating + tb_2.rating) / 2));

                if (composite_diff < min_diff) {
                    min_diff = composite_diff;
                    best_config = {
                        ta: [ta_1, ta_2],
                        tb: [tb_1, tb_2],
                        real_diff: real_diff,
                        sort_metric: composite_diff
                    };
                }
            }
        }
        return best_config;
    }

    solve_round_globally_balanced(available_players: Player[], current_matches: any[]): any[] | null {
        if (available_players.length === 0) {
            return current_matches;
        }

        // Sort descending
        available_players.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            return b.rating - a.rating;
        });

        const candidate_matches: CandidateMatch[] = [];

        // --- GENERATE ALL POSSIBLE MATCHES ---
        const all_quads = getCombinations(available_players, 4);

        for (const quad of all_quads) {
            const [p1, p2, p3, p4] = quad;
            const config = this.get_best_split_for_group(p1, p2, p3, p4);

            if (config) {
                candidate_matches.push({
                    config: config,
                    players: quad
                });
            }
        }

        // --- SORT BY FAIRNESS ---
        candidate_matches.sort((a, b) => a.config.sort_metric - b.config.sort_metric);

        // --- BACKTRACKING EXECUTION ---
        for (const match of candidate_matches) {
            const match_players = match.players;
            const { ta, tb, real_diff } = match.config;

            // Tuple equivalent
            const match_data = { ta, tb, diff: real_diff };

            // Optimistically choose match
            const new_matches = [...current_matches, match_data];

            // Create new pool
            const ids_to_remove = new Set(match_players.map(p => p.id));
            const next_pool = available_players.filter(p => !ids_to_remove.has(p.id));

            // Recurse
            const result = this.solve_round_globally_balanced(next_pool, new_matches);

            if (result) {
                // Log trace
                this.decision_trace.push({
                    match_id: current_matches.length + 1,
                    seed: ta[0].name,
                    steps: [{
                        type: "check",
                        group: `Selected Match: ${ta[0].name}/${ta[1].name} vs ${tb[0].name}/${tb[1].name}`,
                        status: "valid",
                        msg: `Optimum Global Choice: Real Diff ${real_diff.toFixed(1)} out of ${candidate_matches.length} options`
                    }]
                });
                return result;
            }
        }

        return null; // Backtrack
    }

    run_round() {
        if (this.current_round >= MAX_ROUNDS) {
            this.is_finished = true;
            return;
        }

        this.current_round += 1;
        this.decision_trace = [];

        const sorted_pool = this.sort_players();

        // Recursive Solver
        const final_pairings = this.solve_round_globally_balanced(sorted_pool, []);
        const round_matches = [];

        if (final_pairings) {
            for (const pairing of final_pairings) {
                const { ta, tb, diff } = pairing; // ta/tb are Arrays of Players

                // Determine Winner - Logic copied from Python:
                // Python code had `winner_idx = 1` hardcoded inside the block.
                const winner_idx = 1; // Team B wins

                let res_str = "";
                if (winner_idx === 0) {
                    ta[0].add_match_data(ta[1], WIN_POINTS);
                    ta[1].add_match_data(ta[0], WIN_POINTS);
                    tb[0].add_match_data(tb[1], LOSS_POINTS);
                    tb[1].add_match_data(tb[0], LOSS_POINTS);
                    res_str = "Team A";
                } else {
                    ta[0].add_match_data(ta[1], LOSS_POINTS);
                    ta[1].add_match_data(ta[0], LOSS_POINTS);
                    tb[0].add_match_data(tb[1], WIN_POINTS);
                    tb[1].add_match_data(tb[0], WIN_POINTS);
                    res_str = "Team B";
                }

                round_matches.push({
                    t1: [ta[0].name, ta[1].name],
                    t1_avg: Math.floor((ta[0].rating + ta[1].rating) / 2),
                    t2: [tb[0].name, tb[1].name],
                    t2_avg: Math.floor((tb[0].rating + tb[1].rating) / 2),
                    diff: Number(diff.toFixed(1)),
                    winner: res_str,
                    seed: ta[0].name
                });
            }
        } else {
            console.log("CRITICAL: No valid tournament configuration found.");
        }

        this.matches_log.push({ round: this.current_round, matches: round_matches });
    }
}

// --- GLOBAL INSTANCE ---
const engine = new TournamentEngine();
engine.initialize();


// --- HTML TEMPLATE ---
// We inject the raw HTML string provided by the user here.
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Deep Dive Algo Viz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .matrix-cell { width: 25px; height: 25px; font-size: 10px; text-align: center; padding:0; border: 1px solid #eee;}
        .cell-blocked { background-color: #ffcccc; color: #990000; }
        .cell-open { background-color: #e6fffa; color: #0a0; }
        .cell-self { background-color: #6c757d; }
        .step-box { border-left: 3px solid #ddd; padding-left: 15px; margin-bottom: 10px; }
        .step-valid { border-left-color: #198754; }
        .step-invalid { border-left-color: #dc3545; opacity: 0.7; }
        .mono { font-family: monospace; font-size: 0.9em; }
        .opt-row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 2px 0;}
    </style>
</head>
<body class="bg-light">
<div class="container-fluid py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>🧠 Algorithm "Brain" Visualization</h1>
        <span class="badge bg-primary fs-5" id="round-counter">Round 0 / 5</span>
    </div>
    <div class="card mb-4 shadow-sm">
        <div class="card-body d-flex gap-3">
            <button id="next-round-btn" class="btn btn-success btn-lg flex-grow-1">▶ Run Next Round</button>
            <button id="reset-btn" class="btn btn-outline-danger">Reset</button>
        </div>
    </div>
    <div class="row">
        <div class="col-lg-6">
            <div id="matches-container"></div>
            <div id="trace-container"></div>
        </div>
        <div class="col-lg-6">
             <div id="leaderboard-container"></div>
            <div id="matrix-container"></div>
        </div>
    </div>
</div>
<script>
    const API_DASHBOARD = '/api/dashboard';
    const API_NEXT_ROUND = '/api/next_round';
    const API_RESET = '/api/reset';
    const roundCounter = document.getElementById('round-counter');
    const nextRoundBtn = document.getElementById('next-round-btn');
    const resetBtn = document.getElementById('reset-btn');
    const matchesContainer = document.getElementById('matches-container');
    const traceContainer = document.getElementById('trace-container');
    const leaderboardContainer = document.getElementById('leaderboard-container');
    const matrixContainer = document.getElementById('matrix-container');

    async function fetchData(url, method = 'GET') {
        const response = await fetch(url, { method });
        if (!response.ok) throw new Error(\`API call failed: \${response.statusText}\`);
        return response.json();
    }

    function renderMatches(data) {
        if (data.matches.length === 0) { matchesContainer.innerHTML = ''; return; }
        let html = \`<div class="card mb-4 border-primary"><div class="card-header bg-primary text-white"><h5 class="mb-0">Final Output (The Matches)</h5></div><div class="card-body p-0"><table class="table table-bordered align-middle mb-0 text-center"><thead class="table-light"><tr><th>Team A</th><th>Avg</th><th>Vs</th><th>Avg</th><th>Team B</th><th>Diff</th><th>Winner</th></tr></thead><tbody>\`;
        data.matches.forEach(m => {
            const isSeedA = m.t1.includes(m.seed);
            const isSeedB = m.t2.includes(m.seed);
            html += \`<tr><td class="fw-bold">\${isSeedA ? '<span class="badge bg-warning text-dark" style="font-size:0.6em">SEED</span>' : ''} \${m.t1.join(' & ')}</td><td class="text-muted">\${m.t1_avg}</td><td>vs</td><td class="text-muted">\${m.t2_avg}</td><td class="fw-bold">\${isSeedB ? '<span class="badge bg-warning text-dark" style="font-size:0.6em">SEED</span>' : ''} \${m.t2.join(' & ')}</td><td><span class="badge bg-light text-dark border">\${m.diff}</span></td><td><span class="badge bg-\${m.winner === 'Team A' ? 'success' : 'info'}">\${m.winner}</span></td></tr>\`;
        });
        html += \`</tbody></table></div></div>\`;
        matchesContainer.innerHTML = html;
    }

    function renderTrace(data) {
        if (!data.trace || data.trace.length === 0) { traceContainer.innerHTML = ''; return; }
        let html = \`<div class="card shadow-sm mb-4"><div class="card-header bg-dark text-white"><h5 class="mb-0">🔍 Step-by-Step Algorithm Process (Round \${data.round})</h5></div><div class="card-body" style="max-height: 600px; overflow-y: auto;">\`;
        data.trace.forEach((t, tIndex) => {
            html += \`<div class="mb-4"><h6 class="fw-bold text-primary border-bottom pb-2">Match #\${tIndex + 1}: The "\${t.seed}" Match</h6><div class="ps-2">\`;
            t.steps.forEach(step => {
                if (step.type === 'check') {
                    const statusClass = step.status === 'valid' ? 'step-valid' : 'step-invalid';
                    const badgeClass = step.status === 'valid' ? 'bg-success' : 'bg-danger';
                    html += \`<div class="step-box \${statusClass}"><div class="d-flex justify-content-between"><span class="mono">\${step.group}</span><span class="badge \${badgeClass}">\${step.status.toUpperCase()}</span></div><small class="\${step.status === 'valid' ? 'text-success' : 'text-danger'}">\${step.msg}</small></div>\`;
                }
            });
            html += \`</div></div>\`;
        });
        html += \`</div></div>\`;
        traceContainer.innerHTML = html;
    }

    function renderLeaderboard(data) {
        let html = \`<div class="card shadow-sm mb-4"><div class="card-header"><h5 class="mb-0">🏆 Leaderboard</h5></div><div class="card-body p-0"><table class="table table-striped mb-0"><thead class="table-dark"><tr><th>#</th><th>Name</th><th>Rating</th><th>Points</th></tr></thead><tbody>\`;
        data.players.forEach((p, index) => {
            html += \`<tr><td>\${index + 1}</td><td>\${p.name}</td><td>\${p.rating}</td><td class="fw-bold">\${p.points.toFixed(1)}</td></tr>\`;
        });
        html += \`</tbody></table></div></div>\`;
        leaderboardContainer.innerHTML = html;
    }

    function renderMatrix(data) {
        const playerNames = data.players.map(p => p.name);
        const matrixData = data.players.map(p1 => {
            const row = { p_name: p1.name, cells: [] };
            data.players.forEach(p2 => {
                let cellType = 'open';
                if (p1.id === p2.id) { cellType = 'self'; } 
                else if (p1.teammate_history.includes(p2.id)) { cellType = 'blocked'; }
                row.cells.push(cellType);
            });
            return row;
        });
        let html = \`<div class="card shadow-sm"><div class="card-header bg-secondary text-white"><h5 class="mb-0">🚫 Constraint Matrix (Teammate History)</h5></div><div class="card-body text-center"><div class="table-responsive"><table class="table table-bordered table-sm mx-auto" style="width: auto;"><thead><tr><th></th>\${playerNames.map(name => \`<th style="font-size: 9px;">\${name}</th>\`).join('')}</tr></thead><tbody>\`;
        matrixData.forEach(row => {
            html += \`<tr><th style="font-size: 9px;" class="align-middle">\${row.p_name}</th>\${row.cells.map(cell => \`<td class="matrix-cell cell-\${cell}">\${cell === 'self' ? '' : cell === 'blocked' ? 'X' : ''}</td>\`).join('')}</tr>\`;
        });
        html += \`</tbody></table></div><p class="small mt-2 mb-0">X = Blocked | Blank = Open</p></div></div>\`;
        matrixContainer.innerHTML = html;
    }

    function updateDashboard(data) {
        roundCounter.textContent = \`Round \${data.round} / \${data.max_rounds}\`;
        if (data.finished) {
            nextRoundBtn.disabled = true; nextRoundBtn.textContent = 'Tournament Complete';
            nextRoundBtn.classList.replace('btn-success', 'btn-secondary');
        } else {
            nextRoundBtn.disabled = false; nextRoundBtn.textContent = '▶ Run Next Round';
            nextRoundBtn.classList.replace('btn-secondary', 'btn-success');
        }
        renderMatches(data); renderTrace(data); renderLeaderboard(data); renderMatrix(data);
    }

    nextRoundBtn.addEventListener('click', async () => {
        try { nextRoundBtn.disabled = true; const data = await fetchData(API_NEXT_ROUND, 'POST'); updateDashboard(data); }
        catch (e) { alert(e); } finally { nextRoundBtn.disabled = false; }
    });

    resetBtn.addEventListener('click', async () => {
        if (confirm('Reset tournament?')) { const data = await fetchData(API_RESET, 'POST'); updateDashboard(data); }
    });

    document.addEventListener('DOMContentLoaded', async () => {
        try { const data = await fetchData(API_DASHBOARD); updateDashboard(data); }
        catch (e) { console.error(e); }
    });
</script>
</body>
</html>`;

// --- ROUTES ---

app.get('/', (c) => c.html(HTML_TEMPLATE));

app.get('/api/dashboard', (c) => {
    // Prepare data package
    const players_data = engine.sort_players().map(p => p.toJSON());
    const latest_matches = engine.matches_log.length > 0 ? engine.matches_log[engine.matches_log.length - 1].matches : [];

    return c.json({
        players: players_data,
        round: engine.current_round,
        max_rounds: MAX_ROUNDS,
        matches: latest_matches,
        finished: engine.is_finished,
        trace: engine.decision_trace
    });
});

app.post('/api/next_round', (c) => {
    if (!engine.is_finished) {
        engine.run_round();
    }
    
    // Return updated dashboard data directly
    const players_data = engine.sort_players().map(p => p.toJSON());
    const latest_matches = engine.matches_log.length > 0 ? engine.matches_log[engine.matches_log.length - 1].matches : [];

    return c.json({
        players: players_data,
        round: engine.current_round,
        max_rounds: MAX_ROUNDS,
        matches: latest_matches,
        finished: engine.is_finished,
        trace: engine.decision_trace
    });
});

app.post('/api/reset', (c) => {
    engine.initialize();
    
    const players_data = engine.sort_players().map(p => p.toJSON());
    return c.json({
        players: players_data,
        round: engine.current_round,
        max_rounds: MAX_ROUNDS,
        matches: [],
        finished: engine.is_finished,
        trace: []
    });
});

export default {
    port: 3000,
    fetch: app.fetch,
};