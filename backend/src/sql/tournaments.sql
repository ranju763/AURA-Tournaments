WITH player_info AS (
    SELECT 
        id AS player_id,
        gender AS player_gender,
        EXTRACT(YEAR FROM AGE(dob)) AS player_age
    FROM players
    WHERE id = 'p11' -- Replace with your player ID
),
tournament_data AS (
    SELECT
        t.id,
        t.name,
        v.name AS venue_name,
        v.address AS venue_address,
        t.image_url,
        t.start_time,
        t.end_time,
        t.capacity,
        mf.total_rounds,
        mf.max_age,
        mf.eligible_gender,
        COUNT(r_all.player_id) AS total_registered,
        r_player.player_id AS registered_player
    FROM tournaments t
    JOIN venue v ON t.venue = v.id
    JOIN match_format mf ON t.match_format= mf.id
    LEFT JOIN registrations r_all ON t.id = r_all.tournament_id
    LEFT JOIN registrations r_player 
        ON t.id = r_player.tournament_id 
        AND r_player.player_id = 'p1' -- replace with actual player ID
    GROUP BY t.id, t.name, v.name, v.address, t.image_url, t.start_time, t.end_time, t.capacity, mf.total_rounds, mf.max_age, mf.eligible_gender, r_player.player_id
)
SELECT
    td.id,
    td.name,
    json_build_object(
        'name', td.venue_name,
        'address', td.venue_address
    ) AS venue,
    td.image_url,
    td.start_time AS start_date,
    td.end_time AS end_date,
    td.capacity,
    td.total_registered,
    json_build_object(
        'total_rounds', td.total_rounds,
        'max_age', td.max_age,
        'eligible_gender', td.eligible_gender
    ) AS match_format,
    (td.registered_player IS NOT NULL) AS registered,
    -- Eligibility check: age & gender mapping
   CASE
        WHEN (SELECT player_age FROM player_info) > td.max_age THEN false
        WHEN td.eligible_gender = 'MW' THEN true
        WHEN td.eligible_gender = 'M' AND (SELECT player_gender FROM player_info) = 'male' THEN true
        WHEN td.eligible_gender = 'W' AND (SELECT player_gender FROM player_info) = 'female' THEN true
        ELSE false
    END AS eligible
FROM tournament_data td
ORDER BY td.start_time;
