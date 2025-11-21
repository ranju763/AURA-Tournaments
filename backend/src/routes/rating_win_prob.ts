import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';

const app = new Hono();

// ==========================================
// MATH UTILITIES (Polyfills for Python libs)
// ==========================================

// Error Function approximation (Abramowitz and Stegun 7.1.26)
function erf(x: number): number {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
}

// Standard Normal CDF
function Phi(t: number): number {
    return 0.5 * (1 + erf(t / Math.sqrt(2)));
}

// Marsaglia and Tsang's Method for Gamma Distribution
function randomGamma(alpha: number, beta: number = 1): number {
    if (alpha < 1) {
        return randomGamma(1 + alpha, beta) * Math.pow(Math.random(), 1 / alpha);
    }
    const d = alpha - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
        let x, v;
        do {
            x = generateNormal();
            v = 1 + c * x;
        } while (v <= 0);
        v = v * v * v;
        const u = Math.random();
        if (u < 1 - 0.0331 * x * x * x * x) return d * v / beta;
        if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v / beta;
    }
}

// Box-Muller transform for Standard Normal
function generateNormal(): number {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// Beta Distribution generator
function randomBeta(alpha: number, beta: number): number {
    const x = randomGamma(alpha, 1);
    const y = randomGamma(beta, 1);
    return x / (x + y);
}

function tanh(x: number): number {
    return Math.tanh(x);
}

function mean(arr: number[]): number {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// ==========================================
// CORE ALGORITHM (Ported from Python)
// ==========================================

function per_point_base_prob(muA: number, sigmaA: number, muB: number, sigmaB: number): number {
    const combined_std = Math.sqrt(Math.pow(sigmaA, 2) + Math.pow(sigmaB, 2));
    if (combined_std === 0) return 0.5;
    const z = (muA - muB) / (Math.sqrt(2) * combined_std);
    return Phi(z);
}

function points_component(scoreA: number, scoreB: number, target: number = 11): number {
    const s = scoreA - scoreB;
    const remA = Math.max(0, target - scoreA);
    const remB = Math.max(0, target - scoreB);
    const rem = Math.max(1, remA + remB);
    return 0.5 + 0.25 * tanh(s / (rem * 0.6));
}

function blended_point_prob(muA: number, sigmaA: number, muB: number, sigmaB: number, scoreA: number, scoreB: number, target: number = 11, w_mu: number = 0.2): number {
    const base = per_point_base_prob(muA, sigmaA, muB, sigmaB);
    const pts = points_component(scoreA, scoreB, target);
    return w_mu * base + (1 - w_mu) * pts;
}

// Memoization container for match_win_probability
const memo = new Map<string, number>();

function match_win_probability_fixed_p(p: number, a: number, b: number, target: number = 11, win_by: number = 2): number {
    const key = `${p.toFixed(6)}-${a}-${b}`; // Simple key for recursion within a request context if needed, though p varies between requests
    // Note: In the python code, lru_cache handles this. 
    // Since p is a continuous float, global caching is less effective across different matches, 
    // but effective within the recursive tree of a single calc.
    // For this implementation, we'll use a local logic or a simplified recursive approach.
    
    if (a >= target && a - b >= win_by) return 1.0;
    if (b >= target && b - a >= win_by) return 0.0;
    
    if (memo.has(key)) return memo.get(key)!;

    if (a >= target - 1 && b >= target - 1) {
        const denom = p * p + (1 - p) * (1 - p);
        if (denom === 0) return p > 0.5 ? 1.0 : 0.0;
        return (p * p) / denom;
    }

    const res = p * match_win_probability_fixed_p(p, a + 1, b, target, win_by) +
                (1 - p) * match_win_probability_fixed_p(p, a, b + 1, target, win_by);
    
    memo.set(key, res);
    return res;
}

function match_prob_with_beta_uncertainty(p_blend: number, a: number, b: number, target: number = 11, phi: number = 5, n_samples: number = 300): number {
    const alpha = Math.max(1e-6, p_blend * phi);
    const beta = Math.max(1e-6, (1 - p_blend) * phi);
    const vals: number[] = [];
    
    // Clear memo for this simulation run to avoid memory leaks over time with random keys
    memo.clear();

    for (let i = 0; i < n_samples; i++) {
        const p_match = randomBeta(alpha, beta);
        vals.push(match_win_probability_fixed_p(p_match, a, b, target));
    }
    return mean(vals);
}

// --- Rating Update Logic ---

interface Player {
    name?: string;
    mu: number;
    sigma: number;
}

function update_team_ratings(
    teamA: Player[], 
    teamB: Player[], 
    scoreA: number, 
    scoreB: number,
    options: {
        beta?: number,
        tau?: number,
        K?: number,
        lambda_uncertainty?: number,
        softmax_temp?: number,
        MAX_R?: number,
        GAMMA_POS?: number,
        GAMMA_NEG?: number
    } = {}
) {
    const beta = options.beta ?? 4.1667;
    const tau = options.tau ?? 0.05;
    const K = options.K ?? 2.5;
    const lambda_uncertainty = options.lambda_uncertainty ?? 0.6;
    const softmax_temp = options.softmax_temp ?? 5.0;
    const MAX_R = options.MAX_R ?? 100.0;
    const GAMMA_POS = options.GAMMA_POS ?? 2.0;
    const GAMMA_NEG = options.GAMMA_NEG ?? 1.0;

    // --- Team Aggregates ---
    const muA = (teamA[0].mu + teamA[1].mu) / 2.0;
    const muB = (teamB[0].mu + teamB[1].mu) / 2.0;
    const sigmaA = Math.sqrt((Math.pow(teamA[0].sigma, 2) + Math.pow(teamA[1].sigma, 2)) / 2.0);
    const sigmaB = Math.sqrt((Math.pow(teamB[0].sigma, 2) + Math.pow(teamB[1].sigma, 2)) / 2.0);

    const denom = Math.sqrt(2.0 * (Math.pow(beta, 2) + Math.pow(sigmaA, 2) + Math.pow(sigmaB, 2)));
    const t = (muA - muB) / denom;
    const p_win_A = Phi(t);

    const actual_A = scoreA > scoreB ? 1 : 0;
    const margin_mult = 1.0 + Math.abs(scoreA - scoreB) / 11.0;
    const deltaA_team = K * (actual_A - p_win_A) * margin_mult;
    const deltaB_team = -deltaA_team;

    // --- Split Helper ---
    function split_weights(team: Player[], team_won: boolean) {
        // Uncertainty weights
        const inv_vars = team.map(p => 1.0 / Math.pow(Math.max(1e-6, p.sigma), 2));
        const sum_inv = inv_vars.reduce((a,b) => a+b, 0) || 1.0;
        const u = inv_vars.map(v => v / sum_inv);

        // Strength share via softmax
        const mus = team.map(p => p.mu);
        const exps = mus.map(m => Math.exp(m / Math.max(1e-6, softmax_temp)));
        const s_sum = exps.reduce((a,b) => a+b, 0) || 1.0;
        const s = exps.map(e => e / s_sum);

        let raw: number[];
        if (team_won) {
            raw = team.map((_, i) => lambda_uncertainty * u[i] + (1 - lambda_uncertainty) * (1 - s[i]));
        } else {
            raw = team.map((_, i) => lambda_uncertainty * u[i] + (1 - lambda_uncertainty) * s[i]);
        }

        const tot = raw.reduce((a,b) => a+b, 0) || 1.0;
        const w = raw.map(x => x / tot);
        return { w, u, s };
    }

    const splitA = split_weights(teamA, actual_A === 1);
    const splitB = split_weights(teamB, actual_A === 0);

    // Upset -> Sigma Shrink
    const surprise = Math.abs(actual_A - p_win_A);
    let sigma_shrink_mult = 1.0 - tau * (1.0 + 0.5 * surprise);
    sigma_shrink_mult = Math.max(0.80, sigma_shrink_mult);

    // Tapering
    function apply_taper(mu: number, delta: number) {
        if (delta >= 0) {
            let g = (MAX_R - mu) / MAX_R;
            g = Math.max(0.0, Math.min(1.0, g));
            return delta * Math.pow(g, GAMMA_POS);
        } else {
            let l = mu / MAX_R;
            l = Math.max(0.0, Math.min(1.0, l));
            return delta * Math.pow(l, GAMMA_NEG);
        }
    }

    const deltasA = teamA.map((_, i) => deltaA_team * splitA.w[i]);
    const deltasB = teamB.map((_, i) => deltaB_team * splitB.w[i]);

    const explain_players = { teamA: [] as any[], teamB: [] as any[] };

    // Apply updates A
    const teamA_new = teamA.map((p, i) => {
        const raw = deltasA[i];
        const tapered = apply_taper(p.mu, raw);
        const newMu = Math.max(0.0, Math.min(MAX_R, p.mu + tapered));
        const newSigma = Math.max(1.0, p.sigma * sigma_shrink_mult);
        
        explain_players.teamA.push({
            mu_before: p.mu,
            raw_delta: raw,
            tapered_delta: tapered
        });
        
        return { ...p, mu: newMu, sigma: newSigma };
    });

    // Apply updates B
    const teamB_new = teamB.map((p, i) => {
        const raw = deltasB[i];
        const tapered = apply_taper(p.mu, raw);
        const newMu = Math.max(0.0, Math.min(MAX_R, p.mu + tapered));
        const newSigma = Math.max(1.0, p.sigma * sigma_shrink_mult);

        explain_players.teamB.push({
            mu_before: p.mu,
            raw_delta: raw,
            tapered_delta: tapered
        });

        return { ...p, mu: newMu, sigma: newSigma };
    });

    return {
        p_win_A: p_win_A,
        p_win_B: 1 - p_win_A,
        teamA_new,
        teamB_new,
        explain: {
            delta_teamA: deltaA_team,
            delta_teamB: deltaB_team,
            weights: { teamA: splitA.w, teamB: splitB.w },
            surprise,
            sigma_shrink_mult,
            per_player: explain_players
        }
    };
}

// ==========================================
// HTML TEMPLATE (Imported below)
// ==========================================
import { htmlTemplate } from '../ui/rating_win_prob';

// ==========================================
// API ROUTES
// ==========================================

app.get('/', (c) => c.html(htmlTemplate));

app.post('/update_ratings', async (c) => {
    const data = await c.req.json();
    // @ts-ignore
    const result = update_team_ratings(data.teamA, data.teamB, data.scoreA, data.scoreB);
    return c.json(result);
});

app.post('/win_probability', async (c) => {
    const data = await c.req.json();
    // @ts-ignore
    const teamA = data.teamA; const teamB = data.teamB;
    const muA = (teamA[0].mu + teamA[1].mu) / 2;
    const muB = (teamB[0].mu + teamB[1].mu) / 2;
    const sigmaA = Math.sqrt((Math.pow(teamA[0].sigma, 2) + Math.pow(teamA[1].sigma, 2)) / 2);
    const sigmaB = Math.sqrt((Math.pow(teamB[0].sigma, 2) + Math.pow(teamB[1].sigma, 2)) / 2);
    
    const denom = Math.sqrt(2 * (Math.pow(sigmaA, 2) + Math.pow(sigmaB, 2)));
    const p_win_A = Phi((muA - muB) / denom);
    
    return c.json({ p_teamA: p_win_A, p_teamB: 1 - p_win_A });
});

app.post('/live_probability', async (c) => {
    const data = await c.req.json();
    // Expects { muA, sigmaA, muB, sigmaB, scoreA, scoreB }
    const p_blend = blended_point_prob(data.muA, data.sigmaA, data.muB, data.sigmaB, data.scoreA, data.scoreB);
    const match_prob = match_prob_with_beta_uncertainty(p_blend, data.scoreA, data.scoreB);
    return c.json({ p_b: 1 - match_prob, p_a: match_prob });
});

export default {
    port: 5002,
    fetch: app.fetch,
};