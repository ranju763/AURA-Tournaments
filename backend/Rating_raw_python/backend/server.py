from flask import Flask, request, jsonify
import math, random, statistics
from functools import lru_cache
from flask import send_from_directory


app = Flask(__name__)

# ---------- Helpers ----------
def Phi(t):
    return 0.5 * (1 + math.erf(t / math.sqrt(2)))

def per_point_base_prob(muA, sigmaA, muB, sigmaB):
    combined_std = math.sqrt(sigmaA**2 + sigmaB**2)
    if combined_std == 0: return 0.5
    z = (muA - muB) / (math.sqrt(2) * combined_std)
    return Phi(z)

def points_component(scoreA, scoreB, target=11):
    s = scoreA - scoreB
    remA = max(0, target - scoreA)
    remB = max(0, target - scoreB)
    rem = max(1, remA + remB)
    return 0.5 + 0.25 * math.tanh(s / (rem * 0.6))

def blended_point_prob(muA, sigmaA, muB, sigmaB, scoreA, scoreB, target=11, w_mu=0.2):
    base = per_point_base_prob(muA, sigmaA, muB, sigmaB)
    pts = points_component(scoreA, scoreB, target)
    return w_mu * base + (1 - w_mu) * pts

@lru_cache(maxsize=None)
def match_win_probability_fixed_p(p, a, b, target=11, win_by=2):
    if a >= target and a - b >= win_by:
        return 1.0
    if b >= target and b - a >= win_by:
        return 0.0
    if a >= target - 1 and b >= target - 1:
        denom = p*p + (1-p)*(1-p)
        if denom == 0: return 1.0 if p > 0.5 else 0.0
        return (p*p) / denom
    return p * match_win_probability_fixed_p(p, a+1, b, target, win_by) + \
           (1-p) * match_win_probability_fixed_p(p, a, b+1, target, win_by)

def match_prob_with_beta_uncertainty(p_blend, a, b, target=11, phi=5, n_samples=300):
    alpha = max(1e-6, p_blend * phi)
    beta = max(1e-6, (1 - p_blend) * phi)
    vals = []
    for _ in range(n_samples):
        p_match = random.betavariate(alpha, beta)
        vals.append(match_win_probability_fixed_p(p_match, a, b, target))
    return statistics.mean(vals)

# ---------- Rating Update ----------
def update_team_ratings(
    teamA, teamB, scoreA, scoreB, *,
    beta=4.1667,           # performance noise scale (keep your value)
    tau=0.05,              # base sigma decay
    K=2.5,                 # base step size
    lambda_uncertainty=0.6,# how much to weight 1/sigma^2 vs mu-based credit/blame
    softmax_temp=5.0,      # softmax temperature for mu-based credit/blame
    MAX_R=100.0,           # <-- rating ceiling
    GAMMA_POS=2.0,         # <-- growth taper exponent (higher = harder to gain near MAX)
    GAMMA_NEG=1.0          # <-- loss taper exponent (higher = harsher losses near MAX)
):
    """
    - Bounded rating in [0, MAX_R].
    - Positive updates taper as mu -> MAX_R.
    - Negative updates increase as mu -> MAX_R.
    """
    # --- team aggregates (for expectation only) ---
    muA = (teamA[0]["mu"] + teamA[1]["mu"]) / 2.0
    muB = (teamB[0]["mu"] + teamB[1]["mu"]) / 2.0
    sigmaA = math.sqrt((teamA[0]["sigma"]**2 + teamA[1]["sigma"]**2) / 2.0)
    sigmaB = math.sqrt((teamB[0]["sigma"]**2 + teamB[1]["sigma"]**2) / 2.0)

    denom = math.sqrt(2.0 * (beta**2 + sigmaA**2 + sigmaB**2))
    t = (muA - muB) / denom
    p_win_A = Phi(t)

    actual_A = 1 if scoreA > scoreB else 0
    margin_mult = 1.0 + abs(scoreA - scoreB) / 11.0
    deltaA_team = K * (actual_A - p_win_A) * margin_mult
    deltaB_team = -deltaA_team

    # --- split team delta among players ---
    def split_weights(team, team_won: bool):
        # uncertainty weights (inverse variance)
        inv_vars = [1.0 / (max(1e-6, p["sigma"])**2) for p in team]
        sum_inv = sum(inv_vars) if sum(inv_vars) > 0 else 1.0
        u = [v / sum_inv for v in inv_vars]  # sum to 1

        # strength share via softmax over mu
        mus = [p["mu"] for p in team]
        exps = [math.exp(m / max(1e-6, softmax_temp)) for m in mus]
        s_sum = sum(exps) if sum(exps) > 0 else 1.0
        s = [e / s_sum for e in exps]  # sum to 1, higher mu ⇒ larger s

        # winner credits weaker (1 - s_i), loser blames stronger (s_i)
        if team_won:
            raw = [lambda_uncertainty * u[i] + (1 - lambda_uncertainty) * (1 - s[i]) for i in range(2)]
        else:
            raw = [lambda_uncertainty * u[i] + (1 - lambda_uncertainty) * (s[i])     for i in range(2)]

        tot = sum(raw) if sum(raw) > 0 else 1.0
        w = [x / tot for x in raw]  # normalize
        return w, u, s

    wA, uA, sA = split_weights(teamA, team_won=bool(actual_A == 1))
    wB, uB, sB = split_weights(teamB, team_won=bool(actual_A == 0))

    # upset → stronger sigma shrink
    surprise = abs(actual_A - p_win_A)  # 0..1
    sigma_shrink_mult = 1.0 - tau * (1.0 + 0.5 * surprise)
    sigma_shrink_mult = max(0.80, sigma_shrink_mult)  # floor

    # --- per-player tapers for bounded scale ---
    def apply_taper(mu, delta):
        if delta >= 0:
            # gains taper near MAX_R
            g = ((MAX_R - mu) / MAX_R)
            g = max(0.0, min(1.0, g))
            return delta * (g ** GAMMA_POS)
        else:
            # losses bigger near MAX_R (and smaller near 0)
            l = (mu / MAX_R)
            l = max(0.0, min(1.0, l))
            return delta * (l ** GAMMA_NEG)

    deltasA = [deltaA_team * wA[i] for i in range(2)]
    deltasB = [deltaB_team * wB[i] for i in range(2)]

    # --- apply updates with taper + clipping ---
    explain_players = {"teamA": [], "teamB": []}

    for i, p in enumerate(teamA):
        raw = deltasA[i]
        tapered = apply_taper(p["mu"], raw)
        p["mu"] = max(0.0, min(MAX_R, p["mu"] + tapered))
        p["sigma"] = max(1.0, p["sigma"] * sigma_shrink_mult)
        explain_players["teamA"].append({"mu_before": p["mu"] - tapered, "raw_delta": raw, "tapered_delta": tapered})

    for i, p in enumerate(teamB):
        raw = deltasB[i]
        tapered = apply_taper(p["mu"], raw)
        p["mu"] = max(0.0, min(MAX_R, p["mu"] + tapered))
        p["sigma"] = max(1.0, p["sigma"] * sigma_shrink_mult)
        explain_players["teamB"].append({"mu_before": p["mu"] - tapered, "raw_delta": raw, "tapered_delta": tapered})

    return {
        "p_win_A": p_win_A,
        "p_win_B": 1 - p_win_A,
        "teamA_new": teamA,
        "teamB_new": teamB,
        "explain": {
            "delta_teamA": deltaA_team, "delta_teamB": deltaB_team,
            "weights": {"teamA": wA, "teamB": wB},
            "uncertainty_weights": {"teamA": uA, "teamB": uB},
            "strength_shares": {"teamA": sA, "teamB": sB},
            "surprise": surprise,
            "sigma_shrink_multiplier": sigma_shrink_mult,
            "per_player": explain_players
        }
    }


# ---------- API Routes ----------

@app.route("/update_ratings", methods=["POST"])
def api_update():
    data = request.get_json()
    teamA, teamB = data["teamA"], data["teamB"]
    scoreA, scoreB = data["scoreA"], data["scoreB"]
    result = update_team_ratings(teamA, teamB, scoreA, scoreB)
    return jsonify(result)

@app.route("/win_probability", methods=["POST"])
def api_win_prob():
    data = request.get_json()
    teamA, teamB = data["teamA"], data["teamB"]
    muA = (teamA[0]["mu"] + teamA[1]["mu"]) / 2
    muB = (teamB[0]["mu"] + teamB[1]["mu"]) / 2
    sigmaA = math.sqrt((teamA[0]["sigma"]**2 + teamA[1]["sigma"]**2) / 2)
    sigmaB = math.sqrt((teamB[0]["sigma"]**2 + teamB[1]["sigma"]**2) / 2)
    p_win_A = Phi((muA - muB) / math.sqrt(2 * (sigmaA**2 + sigmaB**2)))
    return jsonify({"p_teamA": p_win_A, "p_teamB": 1 - p_win_A})

@app.route("/live_probability", methods=["POST"])
def api_live_prob():
    data = request.get_json()
    muA, sigmaA = data["muA"], data["sigmaA"]
    muB, sigmaB = data["muB"], data["sigmaB"]
    scoreA, scoreB = data["scoreA"], data["scoreB"]
    p_blend = blended_point_prob(muA, sigmaA, muB, sigmaB, scoreA, scoreB)
    match_prob = match_prob_with_beta_uncertainty(p_blend, scoreA, scoreB)
    return jsonify({"p_b": 1-match_prob, "p_a": match_prob})


@app.route('/')
def home():
    return send_from_directory('templates', 'index.html')

@app.route('/templates/<path:path>')
def send_static(path):
    return send_from_directory('templates', path)


if __name__ == "__main__":
    app.run(port=5000, debug=True)
