WITH player_info AS (
    SELECT 
        id AS player_id,
        gender AS player_gender,
        EXTRACT(YEAR FROM AGE(dob)) AS player_age
    FROM players
    WHERE id = 'p1' -- replace with actual player ID
),
tournament_data AS (
    SELECT
        t.id,
        t.name,
        t.image_url,
        t.start_time,
        t.end_time,
        t.capacity,
        t.venue AS venue_id,
        t.match_format AS match_format_id,
        t.host_id AS host_id
    FROM tournaments t
    WHERE t.id = 't2' -- replace with tournament id
),
venue_data AS (
    SELECT v.id AS venue_id, v.name AS venue_name, v.address AS venue_address
    FROM venue v
),
match_format_data AS (
    SELECT 
        mf.id AS match_format_id,
        mf.total_rounds,
        mf.max_age,
        mf.eligible_gender
    FROM match_format mf
),
host_data AS (
    SELECT 
        p.id AS host_id,
        p.username AS host_name,
        p.user_id,
        p.photo_url,
        p.gender,
        p.dob
    FROM players p
),
registrations_data AS (
    SELECT 
        tournament_id, 
        player_id
    FROM registrations
),
referee_data AS (
    SELECT 
        tr.tournament_id,
        p.id AS player_id,
        p.username AS name,
        p.photo_url,
        p.gender
    FROM tournaments_referee tr
    JOIN players p ON tr.player_id = p.id
)
SELECT
    td.id,
    td.name,
    json_build_object(
        'name', vd.venue_name,
        'address', vd.venue_address
    ) AS venue,
    td.image_url,
    td.start_time AS start_date,
    td.end_time AS end_date,
    td.capacity,
    json_build_object(
        'total_rounds', mfd.total_rounds,
        'max_age', mfd.max_age,
        'eligible_gender', mfd.eligible_gender
    ) AS match_format,
    json_build_object(
        'id', hd.host_id,
        'name', hd.host_name,
        'username', hd.user_id,
        'photo_url', hd.photo_url,
        'phone', NULL -- if phone column exists, use it
    ) AS hosted_by,
    COALESCE(r_player.player_id IS NOT NULL, false) AS registered,
    CASE
        WHEN (SELECT player_age FROM player_info) > mfd.max_age THEN false
        WHEN mfd.eligible_gender = 'MW' THEN true
        WHEN mfd.eligible_gender = 'M' AND (SELECT player_gender FROM player_info) = 'male' THEN true
        WHEN mfd.eligible_gender = 'W' AND (SELECT player_gender FROM player_info) = 'female' THEN true
        ELSE false
    END AS eligible,
    -- Referees
    (SELECT json_agg(json_build_object(
        'player_id', r.player_id,
        'name', r.name,
        'phone', NULL -- if phone column exists in players
    ))
    FROM referee_data r
    WHERE r.tournament_id = td.id) AS referee,
    -- Number of registered players
    (SELECT COUNT(*) FROM registrations_data reg WHERE reg.tournament_id = td.id) AS total_registered
FROM tournament_data td
LEFT JOIN venue_data vd ON td.venue_id = vd.venue_id
LEFT JOIN match_format_data mfd ON td.match_format_id = mfd.match_format_id
LEFT JOIN host_data hd ON td.host_id = hd.host_id
LEFT JOIN registrations_data r_player 
    ON td.id = r_player.tournament_id 
    AND r_player.player_id = (SELECT player_id FROM player_info)
; can u give me the bun hono code for this