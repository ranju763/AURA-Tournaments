export const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rating Algo Viz</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js"></script>
    <style>
        body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; }
        .input-group { margin-bottom: 0.5rem; }
        .card { background: white; border-radius: 0.5rem; padding: 1.5rem; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1); }
    </style>
</head>
<body class="p-6 text-gray-800">
    <div class="max-w-6xl mx-auto">
        <header class="mb-8 flex justify-between items-center">
            <div>
                <h1 class="text-3xl font-bold text-indigo-600">Rating Algorithm Engine</h1>
                <p class="text-gray-500 text-sm mt-1">Bun/Hono Port • Exact Logic Replication</p>
            </div>
        </header>

        <!-- Config Section -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <!-- Team A Config -->
            <div class="card border-l-4 border-blue-500">
                <h2 class="text-xl font-semibold mb-4 text-blue-700">Team A</h2>
                <div class="space-y-3">
                    <div class="flex gap-2">
                        <input type="text" id="p1_name" value="Alice" class="w-1/3 border rounded px-2 py-1" placeholder="Name">
                        <input type="number" id="p1_mu" value="25.0" class="w-1/3 border rounded px-2 py-1" placeholder="Mu">
                        <input type="number" id="p1_sigma" value="8.33" class="w-1/3 border rounded px-2 py-1" placeholder="Sigma">
                    </div>
                    <div class="flex gap-2">
                        <input type="text" id="p2_name" value="Bob" class="w-1/3 border rounded px-2 py-1" placeholder="Name">
                        <input type="number" id="p2_mu" value="25.0" class="w-1/3 border rounded px-2 py-1" placeholder="Mu">
                        <input type="number" id="p2_sigma" value="8.33" class="w-1/3 border rounded px-2 py-1" placeholder="Sigma">
                    </div>
                </div>
            </div>

            <!-- Team B Config -->
            <div class="card border-l-4 border-red-500">
                <h2 class="text-xl font-semibold mb-4 text-red-700">Team B</h2>
                <div class="space-y-3">
                    <div class="flex gap-2">
                        <input type="text" id="p3_name" value="Charlie" class="w-1/3 border rounded px-2 py-1" placeholder="Name">
                        <input type="number" id="p3_mu" value="25.0" class="w-1/3 border rounded px-2 py-1" placeholder="Mu">
                        <input type="number" id="p3_sigma" value="8.33" class="w-1/3 border rounded px-2 py-1" placeholder="Sigma">
                    </div>
                    <div class="flex gap-2">
                        <input type="text" id="p4_name" value="Dave" class="w-1/3 border rounded px-2 py-1" placeholder="Name">
                        <input type="number" id="p4_mu" value="25.0" class="w-1/3 border rounded px-2 py-1" placeholder="Mu">
                        <input type="number" id="p4_sigma" value="8.33" class="w-1/3 border rounded px-2 py-1" placeholder="Sigma">
                    </div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <!-- Live Match Calc -->
            <div class="card lg:col-span-1">
                <h2 class="text-xl font-bold mb-4">🔴 Live Match Prob</h2>
                
                <div class="flex justify-between items-center mb-6">
                    <div class="text-center">
                        <div class="text-sm font-bold text-blue-600">Team A</div>
                        <input type="number" id="scoreA_live" value="0" class="text-3xl w-16 text-center border rounded font-mono">
                    </div>
                    <div class="text-gray-400 font-bold text-xl">:</div>
                    <div class="text-center">
                        <div class="text-sm font-bold text-red-600">Team B</div>
                        <input type="number" id="scoreB_live" value="0" class="text-3xl w-16 text-center border rounded font-mono">
                    </div>
                </div>

                <button id="btn-live" class="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition mb-4">Calculate Probability</button>

                <div class="relative pt-1">
                    <div class="flex mb-2 items-center justify-between">
                        <div>
                            <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                Team A Win %
                            </span>
                        </div>
                        <div class="text-right">
                            <span id="live_result_val" class="text-xs font-semibold inline-block text-blue-600">
                                50%
                            </span>
                        </div>
                    </div>
                    <div class="overflow-hidden h-4 mb-4 text-xs flex rounded bg-red-200">
                        <div id="live_bar" style="width:50%" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"></div>
                    </div>
                </div>
            </div>

            <!-- Post Match Update -->
            <div class="card lg:col-span-2">
                <h2 class="text-xl font-bold mb-4">🏁 Post-Match Update</h2>
                
                <div class="flex gap-4 items-end mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Team A Score</label>
                        <input type="number" id="scoreA_final" value="11" class="mt-1 block w-24 border rounded-md border-gray-300 shadow-sm p-2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Team B Score</label>
                        <input type="number" id="scoreB_final" value="9" class="mt-1 block w-24 border rounded-md border-gray-300 shadow-sm p-2">
                    </div>
                    <button id="btn-update" class="flex-grow bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition h-[42px]">Submit Result & Update Ratings</button>
                </div>

                <!-- Results Area -->
                <div id="update-results" class="hidden">
                    <div class="p-4 bg-gray-50 rounded mb-4">
                        <div class="flex justify-between text-sm mb-2">
                            <span>Pre-Match Prediction:</span>
                            <span class="font-mono" id="pre_match_pred">--</span>
                        </div>
                        <div class="flex justify-between text-sm">
                            <span>Surprise Factor:</span>
                            <span class="font-mono" id="surprise_factor">--</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <h4 class="font-bold text-blue-600 border-b mb-2">Team A Changes</h4>
                            <ul id="changes_A" class="text-sm space-y-2"></ul>
                        </div>
                        <div>
                            <h4 class="font-bold text-red-600 border-b mb-2">Team B Changes</h4>
                            <ul id="changes_B" class="text-sm space-y-2"></ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        function getTeam(teamPrefix) {
            return [
                {
                    name: document.getElementById(teamPrefix + '1_name').value,
                    mu: parseFloat(document.getElementById(teamPrefix + '1_mu').value),
                    sigma: parseFloat(document.getElementById(teamPrefix + '1_sigma').value)
                },
                {
                    name: document.getElementById(teamPrefix + '2_name').value,
                    mu: parseFloat(document.getElementById(teamPrefix + '2_mu').value),
                    sigma: parseFloat(document.getElementById(teamPrefix + '2_sigma').value)
                }
            ];
        }

        // --- Live Calc ---
        document.getElementById('btn-live').addEventListener('click', async () => {
            const tA = getTeam('p'); // p1, p2
            const tB = getTeam('p'); // p3, p4 is actually hardcoded in logic above? No, logic uses p1/p2 then p3/p4
            
            // Actually getTeam('p') gets p1, p2. Need distinct team fetchers.
            const teamA = [
                { mu: parseFloat(document.getElementById('p1_mu').value), sigma: parseFloat(document.getElementById('p1_sigma').value) },
                { mu: parseFloat(document.getElementById('p2_mu').value), sigma: parseFloat(document.getElementById('p2_sigma').value) }
            ];
            const teamB = [
                { mu: parseFloat(document.getElementById('p3_mu').value), sigma: parseFloat(document.getElementById('p3_sigma').value) },
                { mu: parseFloat(document.getElementById('p4_mu').value), sigma: parseFloat(document.getElementById('p4_sigma').value) }
            ];

            // Aggregate for Live Prob (Python logic expects aggregate Mu/Sigma)
            const muA = (teamA[0].mu + teamA[1].mu) / 2;
            const muB = (teamB[0].mu + teamB[1].mu) / 2;
            const sigmaA = Math.sqrt((teamA[0].sigma**2 + teamA[1].sigma**2) / 2);
            const sigmaB = Math.sqrt((teamB[0].sigma**2 + teamB[1].sigma**2) / 2);

            const payload = {
                muA, sigmaA, muB, sigmaB,
                scoreA: parseInt(document.getElementById('scoreA_live').value),
                scoreB: parseInt(document.getElementById('scoreB_live').value)
            };

            const res = await fetch('/live_probability', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            const pA = (data.p_a * 100).toFixed(1);
            document.getElementById('live_result_val').innerText = pA + '%';
            document.getElementById('live_bar').style.width = pA + '%';
        });

        // --- Post Match Update ---
        document.getElementById('btn-update').addEventListener('click', async () => {
            const teamA = [
                { name: document.getElementById('p1_name').value, mu: parseFloat(document.getElementById('p1_mu').value), sigma: parseFloat(document.getElementById('p1_sigma').value) },
                { name: document.getElementById('p2_name').value, mu: parseFloat(document.getElementById('p2_mu').value), sigma: parseFloat(document.getElementById('p2_sigma').value) }
            ];
            const teamB = [
                { name: document.getElementById('p3_name').value, mu: parseFloat(document.getElementById('p3_mu').value), sigma: parseFloat(document.getElementById('p3_sigma').value) },
                { name: document.getElementById('p4_name').value, mu: parseFloat(document.getElementById('p4_mu').value), sigma: parseFloat(document.getElementById('p4_sigma').value) }
            ];

            const payload = {
                teamA, teamB,
                scoreA: parseInt(document.getElementById('scoreA_final').value),
                scoreB: parseInt(document.getElementById('scoreB_final').value)
            };

            const res = await fetch('/update_ratings', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            document.getElementById('update-results').classList.remove('hidden');
            
            // Update Meta Info
            document.getElementById('pre_match_pred').innerText = \`Team A Win Prob: \${(data.p_win_A * 100).toFixed(1)}%\`;
            document.getElementById('surprise_factor').innerText = data.explain.surprise.toFixed(4);

            // Helper to render player changes
            const renderChange = (oldP, newP, details) => {
                const diff = (newP.mu - oldP.mu).toFixed(2);
                const color = parseFloat(diff) >= 0 ? 'text-green-600' : 'text-red-600';
                const sign = parseFloat(diff) >= 0 ? '+' : '';
                return \`
                    <li class="bg-white border p-2 rounded shadow-sm">
                        <div class="flex justify-between font-semibold">
                            <span>\${oldP.name}</span>
                            <span class="\${color}">\${sign}\${diff}</span>
                        </div>
                        <div class="text-xs text-gray-500 mt-1">
                            Mu: \${oldP.mu.toFixed(1)} ➝ \${newP.mu.toFixed(1)} <br>
                            (Raw Delta: \${details.raw_delta.toFixed(2)})
                        </div>
                    </li>
                \`;
            };

            // Render Lists
            const listA = document.getElementById('changes_A');
            listA.innerHTML = '';
            teamA.forEach((p, i) => {
                listA.innerHTML += renderChange(p, data.teamA_new[i], data.explain.per_player.teamA[i]);
            });

            const listB = document.getElementById('changes_B');
            listB.innerHTML = '';
            teamB.forEach((p, i) => {
                listB.innerHTML += renderChange(p, data.teamB_new[i], data.explain.per_player.teamB[i]);
            });
            
            // OPTIONAL: Update inputs with new values
            document.getElementById('p1_mu').value = data.teamA_new[0].mu.toFixed(2);
            document.getElementById('p1_sigma').value = data.teamA_new[0].sigma.toFixed(2);
            document.getElementById('p2_mu').value = data.teamA_new[1].mu.toFixed(2);
            document.getElementById('p2_sigma').value = data.teamA_new[1].sigma.toFixed(2);
            
            document.getElementById('p3_mu').value = data.teamB_new[0].mu.toFixed(2);
            document.getElementById('p3_sigma').value = data.teamB_new[0].sigma.toFixed(2);
            document.getElementById('p4_mu').value = data.teamB_new[1].mu.toFixed(2);
            document.getElementById('p4_sigma').value = data.teamB_new[1].sigma.toFixed(2);
        });
    </script>
</body>
</html>
`;