-- Remove all existing data and reset sequences
TRUNCATE TABLE registrations CASCADE;
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE tournaments CASCADE;
TRUNCATE TABLE match_format CASCADE;
TRUNCATE TABLE venue CASCADE;
TRUNCATE TABLE players CASCADE;
TRUNCATE TABLE courts CASCADE;
TRUNCATE TABLE ratings CASCADE;
TRUNCATE TABLE pairing CASCADE;
TRUNCATE TABLE team_players CASCADE;
TRUNCATE TABLE team CASCADE;
TRUNCATE TABLE pairing CASCADE;
TRUNCATE TABLE tournaments_referee CASCADE;




INSERT INTO players (id, user_id, username, dob, gender, photo_url, created_at) VALUES
('p1', 'u1', 'ranjeev', '2001-05-21', 'male', 'https://img/p1.jpg', NOW()),
('p2', 'u2', 'arun', '2000-04-11', 'male', 'https://img/p2.jpg', NOW()),
('p3', 'u3', 'priya', '1999-08-18', 'female', 'https://img/p3.jpg', NOW()),
('p4', 'u4', 'kavin', '1998-12-10', 'male', 'https://img/p4.jpg', NOW()),
('p5', 'u5', 'sneha', '2002-03-19', 'female', 'https://img/p5.jpg', NOW()),
('p6', 'u6', 'rahul', '1997-07-23', 'male', 'https://img/p6.jpg', NOW()),
('p7', 'u7', 'meera', '2001-11-05', 'female', 'https://img/p7.jpg', NOW()),
('p8', 'u8', 'vignesh', '1999-01-29', 'male', 'https://img/p8.jpg', NOW()),
('p9', 'u9', 'ananya', '2000-06-10', 'female', 'https://img/p9.jpg', NOW()),
('p10', 'u10', 'yuvan', '2003-02-14', 'male', 'https://img/p10.jpg', NOW()),
('p11', 'u11', 'divya', '1998-09-17', 'female', 'https://img/p11.jpg', NOW()),
('p12', 'u12', 'sanjay', '2001-04-20', 'male', 'https://img/p12.jpg', NOW()),
('p13', 'u13', 'harini', '1997-12-01', 'female', 'https://img/p13.jpg', NOW()),
('p14', 'u14', 'gokul', '1999-05-07', 'male', 'https://img/p14.jpg', NOW()),
('p15', 'u15', 'isha', '2002-08-30', 'female', 'https://img/p15.jpg', NOW()),
('p16', 'u16', 'tarun', '2000-10-02', 'male', 'https://img/p16.jpg', NOW());



INSERT INTO venue (id, name, address, created_at, updated_at) VALUES
('v1', 'SmashHub Arena', 'OMR, Chennai, Tamil Nadu', NOW(), NOW()),
('v2', 'ProServe Courts', 'Indiranagar, Bangalore, Karnataka', NOW(), NOW()),
('v3', 'AceZone Sports Complex', 'Gachibowli, Hyderabad, Telangana', NOW(), NOW()),
('v4', 'RallyUp Indoor Center', 'Viman Nagar, Pune, Maharashtra', NOW(), NOW()),
('v5', 'Baseline Sports Arena', 'Kakkanad, Kochi, Kerala', NOW(), NOW());

-- INSERT 5 TOURNAMENT MATCH FORMATS WITH SET_RULES METADATA
INSERT INTO match_format (id, type, min_age, max_age, eligible_gender, total_rounds, metadata) VALUES
(
  'mf1',
  'mens_doubles',
  0,
  11,
  'M',
  0,
  '{
    "set_rules": {
      "final": { "best_of": 7 },
      "semi_final": { "best_of": 5 },
      "league": { "best_of": 3, "_rounds": 4 }
    }
  }'
),
(
  'mf2',
  'mens_doubles',
  0,
  17,
  'M',
  0,
  '{
    "set_rules": {
      "final": { "best_of": 7 },
      "semi_final": { "best_of": 5 },
      "league": { "best_of": 3, "_rounds": 4 }
    }
  }'
),
(
  'mf3',
  'mens_doubles',
  0,
  25,
  'M',
  0,
  '{
    "set_rules": {
      "final": { "best_of": 7 },
      "semi_final": { "best_of": 5 },
      "league": { "best_of": 3, "_rounds": 4 }
    }
  }'
),
(
  'mf4',
  'mixed_doubles',
  NULL,
  NULL,
  'MW',
  0,
  '{
    "set_rules": {
      "final": { "best_of": 7 },
      "semi_final": { "best_of": 5 },
      "league": { "best_of": 3, "_rounds": 4 }
    }
  }'
),
(
  'mf5',
  'womens_doubles',
  NULL,
  NULL,
  'W',
  0,
  '{
    "set_rules": {
      "final": { "best_of": 7 },
      "semi_final": { "best_of": 5 },
      "league": { "best_of": 3, "_rounds": 4 }
    }
  }'
);

-- INSERT 3 TOURNAMENTS
INSERT INTO tournaments (
  id, host_id, name, description, sport_id, venue, start_time, end_time, capacity, image_url, match_format, metadata
) VALUES
(
  't1',
  'p1',  -- Host player ID from players table
  'U-11 Men''s Doubles Championship',
  'Tournament for boys under 11 in doubles format',
  'sport1',
  'v1',  -- Venue ID
  '2025-12-01 09:00:00+05:30',
  '2025-12-01 17:00:00+05:30',
  16,
  'https://img/t1.jpg',
  'mf1',  -- Match format ID (U-11 men doubles)
  '{"level":"U-11","type":"mens_doubles"}'
),
(
  't2',
  'p2',
  'Mixed Doubles Open Tournament',
  'Open tournament for mixed doubles',
  'sport1',
  'v1',  -- Same venue
  '2025-12-01 09:00:00+05:30',
  '2025-12-01 19:00:00+05:30',
  24,
  'https://img/t2.jpg',
  'mf4',  -- Match format ID (mixed doubles)
  '{"level":"open","type":"mixed_doubles"}'
),
(
  't3',
  'p3',
  'Women''s Doubles Open Championship',
  'Open tournament for women''s doubles',
  'sport1',
  'v1',  -- Same venue
  '2025-12-01 09:00:00+05:30',
  '2025-12-01 18:00:00+05:30',
  20,
  'https://img/t3.jpg',
  'mf5',  -- Match format ID (women doubles)
  '{"level":"open","type":"womens_doubles"}'
);


-- INSERT TRANSACTIONS (one per registration)
INSERT INTO transactions (id, amount, type, status, created_at) VALUES
('txn1', 500, 'registration', 'completed', NOW()),
('txn2', 500, 'registration', 'completed', NOW()),
('txn3', 500, 'registration', 'completed', NOW()),
('txn4', 500, 'registration', 'completed', NOW()),
('txn5', 500, 'registration', 'completed', NOW()),
('txn6', 500, 'registration', 'completed', NOW()),
('txn7', 500, 'registration', 'completed', NOW()),
('txn8', 500, 'registration', 'completed', NOW()),
('txn9', 500, 'registration', 'completed', NOW()),
('txn10', 500, 'registration', 'completed', NOW()),
('txn11', 500, 'registration', 'completed', NOW()),
('txn12', 500, 'registration', 'completed', NOW()),
('txn13', 500, 'registration', 'completed', NOW()),
('txn14', 500, 'registration', 'completed', NOW()),
('txn15', 500, 'registration', 'completed', NOW()),
('txn16', 500, 'registration', 'completed', NOW());

-- REGISTRATIONS FOR U-11 MEN'S DOUBLES (t1)
INSERT INTO registrations (id, tournament_id, player_id, txn_id, created_at) VALUES
('r1', 't1', 'p10', 'txn10', NOW());

-- REGISTRATIONS FOR MIXED DOUBLES (t2) - ALL PLAYERS
INSERT INTO registrations (id, tournament_id, player_id, txn_id, created_at) VALUES
('r2', 't2', 'p1', 'txn1', NOW()),
('r3', 't2', 'p2', 'txn2', NOW()),
('r4', 't2', 'p3', 'txn3', NOW()),
('r5', 't2', 'p4', 'txn4', NOW()),
('r6', 't2', 'p5', 'txn5', NOW()),
('r7', 't2', 'p6', 'txn6', NOW()),
('r8', 't2', 'p7', 'txn7', NOW()),
('r9', 't2', 'p8', 'txn8', NOW()),
('r10', 't2', 'p9', 'txn9', NOW()),
('r11', 't2', 'p10', 'txn10', NOW()),
('r12', 't2', 'p11', 'txn11', NOW()),
('r13', 't2', 'p12', 'txn12', NOW()),
('r14', 't2', 'p13', 'txn13', NOW()),
('r15', 't2', 'p14', 'txn14', NOW()),
('r16', 't2', 'p15', 'txn15', NOW()),
('r17', 't2', 'p16', 'txn16', NOW());

-- REGISTRATIONS FOR WOMEN'S DOUBLES (t3)
INSERT INTO registrations (id, tournament_id, player_id, txn_id, created_at) VALUES
('r18', 't3', 'p3', 'txn3', NOW()),
('r19', 't3', 'p5', 'txn5', NOW()),
('r20', 't3', 'p7', 'txn7', NOW()),
('r21', 't3', 'p9', 'txn9', NOW()),
('r22', 't3', 'p11', 'txn11', NOW()),
('r23', 't3', 'p13', 'txn13', NOW()),
('r24', 't3', 'p15', 'txn15', NOW());


-- CREATE COURTS FOR VENUE v1 (SmashHub Arena)
INSERT INTO courts (id, venue_id, court_number) VALUES
('c1', 'v1', 1),
('c2', 'v1', 2);

-- INSERT INITIAL RATINGS FOR ALL PLAYERS
INSERT INTO ratings (id, player_id, aura_mu, aura_sigma, last_updated) VALUES
('r1', 'p1', 25, 8, NOW()),
('r2', 'p2', 25, 8, NOW()),
('r3', 'p3', 25, 8, NOW()),
('r4', 'p4', 25, 8, NOW()),
('r5', 'p5', 25, 8, NOW()),
('r6', 'p6', 25, 8, NOW()),
('r7', 'p7', 25, 8, NOW()),
('r8', 'p8', 25, 8, NOW()),
('r9', 'p9', 25, 8, NOW()),
('r10', 'p10', 25, 8, NOW()),
('r11', 'p11', 25, 8, NOW()),
('r12', 'p12', 25, 8, NOW()),
('r13', 'p13', 25, 8, NOW()),
('r14', 'p14', 25, 8, NOW()),
('r15', 'p15', 25, 8, NOW()),
('r16', 'p16', 25, 8, NOW());

-- ===============================
-- ROUND 1
-- ===============================

-- TEAMS
INSERT INTO team (id, tournament_id, round, name, avg_aura, metadata, created_at) VALUES
('t1','t1','1','Team 1',25,'{}',NOW()),
('t2','t1','1','Team 2',25,'{}',NOW()),
('t3','t1','1','Team 3',25,'{}',NOW()),
('t4','t1','1','Team 4',25,'{}',NOW()),
('t5','t1','1','Team 5',25,'{}',NOW()),
('t6','t1','1','Team 6',25,'{}',NOW()),
('t7','t1','1','Team 7',25,'{}',NOW()),
('t8','t1','1','Team 8',25,'{}',NOW());

-- TEAM PLAYERS
INSERT INTO team_players (team_id, player_id, created_at) VALUES
('t1','p1',NOW()),('t1','p2',NOW()),
('t2','p3',NOW()),('t2','p4',NOW()),
('t3','p5',NOW()),('t3','p6',NOW()),
('t4','p7',NOW()),('t4','p8',NOW()),
('t5','p9',NOW()),('t5','p10',NOW()),
('t6','p11',NOW()),('t6','p12',NOW()),
('t7','p13',NOW()),('t7','p14',NOW()),
('t8','p15',NOW()),('t8','p16',NOW());

-- MATCHES
INSERT INTO matches (id, tournament_id, player_id, status, court_id, round, set, pairing_id, winner_team, start_time, end_time) VALUES
('m1','t1','p3','scheduled','c1','1',0,'t1',NULL,'2025-12-01 09:00:00+05:30','2025-12-01 10:00:00+05:30'),
('m2','t1','p4','scheduled','c2','1',0,'t2',NULL,'2025-12-01 09:00:00+05:30','2025-12-01 10:00:00+05:30'),
('m3','t1','p5','scheduled','c1','1',0,'t3',NULL,'2025-12-01 10:15:00+05:30','2025-12-01 11:15:00+05:30'),
('m4','t1','p6','scheduled','c2','1',0,'t4',NULL,'2025-12-01 10:15:00+05:30','2025-12-01 11:15:00+05:30'),
('m5','t1','p7','scheduled','c1','1',0,'t5',NULL,'2025-12-01 11:30:00+05:30','2025-12-01 12:30:00+05:30'),
('m6','t1','p8','scheduled','c2','1',0,'t6',NULL,'2025-12-01 11:30:00+05:30','2025-12-01 12:30:00+05:30'),
('m7','t1','p9','scheduled','c1','1',0,'t7',NULL,'2025-12-01 12:45:00+05:30','2025-12-01 13:45:00+05:30'),
('m8','t1','p10','scheduled','c2','1',0,'t8',NULL,'2025-12-01 12:45:00+05:30','2025-12-01 13:45:00+05:30');

-- PAIRINGS
INSERT INTO pairing (id, tournament_id, match_id, team_id) VALUES
('p1','t1','m1','t1'),
('p2','t1','m2','t2'),
('p3','t1','m3','t3'),
('p4','t1','m4','t4'),
('p5','t1','m5','t5'),
('p6','t1','m6','t6'),
('p7','t1','m7','t7'),
('p8','t1','m8','t8');

-- ===============================
-- ROUND 2
-- ===============================
INSERT INTO team (id, tournament_id, round, name, avg_aura, metadata, created_at) VALUES
('t9','t1','2','Team 1',25,'{}',NOW()),
('t10','t1','2','Team 2',25,'{}',NOW()),
('t11','t1','2','Team 3',25,'{}',NOW()),
('t12','t1','2','Team 4',25,'{}',NOW()),
('t13','t1','2','Team 5',25,'{}',NOW()),
('t14','t1','2','Team 6',25,'{}',NOW()),
('t15','t1','2','Team 7',25,'{}',NOW()),
('t16','t1','2','Team 8',25,'{}',NOW());

INSERT INTO team_players (team_id, player_id, created_at) VALUES
('t9','p1',NOW()),('t9','p3',NOW()),
('t10','p2',NOW()),('t10','p4',NOW()),
('t11','p5',NOW()),('t11','p7',NOW()),
('t12','p6',NOW()),('t12','p8',NOW()),
('t13','p9',NOW()),('t13','p11',NOW()),
('t14','p10',NOW()),('t14','p12',NOW()),
('t15','p13',NOW()),('t15','p15',NOW()),
('t16','p14',NOW()),('t16','p16',NOW());

INSERT INTO matches (id, tournament_id, player_id, status, court_id, round, set, pairing_id, winner_team, start_time, end_time) VALUES
('m9','t1','p1','scheduled','c1','2',0,'t9',NULL,'2025-12-01 14:00:00+05:30','2025-12-01 15:00:00+05:30'),
('m10','t1','p2','scheduled','c2','2',0,'t10',NULL,'2025-12-01 14:00:00+05:30','2025-12-01 15:00:00+05:30'),
('m11','t1','p3','scheduled','c1','2',0,'t11',NULL,'2025-12-01 15:15:00+05:30','2025-12-01 16:15:00+05:30'),
('m12','t1','p4','scheduled','c2','2',0,'t12',NULL,'2025-12-01 15:15:00+05:30','2025-12-01 16:15:00+05:30'),
('m13','t1','p5','scheduled','c1','2',0,'t13',NULL,'2025-12-01 16:30:00+05:30','2025-12-01 17:30:00+05:30'),
('m14','t1','p6','scheduled','c2','2',0,'t14',NULL,'2025-12-01 16:30:00+05:30','2025-12-01 17:30:00+05:30'),
('m15','t1','p7','scheduled','c1','2',0,'t15',NULL,'2025-12-01 17:45:00+05:30','2025-12-01 18:45:00+05:30'),
('m16','t1','p8','scheduled','c2','2',0,'t16',NULL,'2025-12-01 17:45:00+05:30','2025-12-01 18:45:00+05:30');

INSERT INTO pairing (id, tournament_id, match_id, team_id) VALUES
('p9','t1','m9','t9'),
('p10','t1','m10','t10'),
('p11','t1','m11','t11'),
('p12','t1','m12','t12'),
('p13','t1','m13','t13'),
('p14','t1','m14','t14'),
('p15','t1','m15','t15'),
('p16','t1','m16','t16');

-- ===============================
-- ROUND 3
-- ===============================
INSERT INTO team (id, tournament_id, round, name, avg_aura, metadata, created_at) VALUES
('t33','t1','3','Team 1',25,'{}',NOW()),
('t34','t1','3','Team 2',25,'{}',NOW()),
('t35','t1','3','Team 3',25,'{}',NOW()),
('t36','t1','3','Team 4',25,'{}',NOW()),
('t37','t1','3','Team 5',25,'{}',NOW()),
('t38','t1','3','Team 6',25,'{}',NOW()),
('t39','t1','3','Team 7',25,'{}',NOW()),
('t40','t1','3','Team 8',25,'{}',NOW());

INSERT INTO team_players (team_id, player_id, created_at) VALUES
('t33','p1',NOW()),('t33','p4',NOW()),
('t34','p2',NOW()),('t34','p3',NOW()),
('t35','p5',NOW()),('t35','p8',NOW()),
('t36','p6',NOW()),('t36','p7',NOW()),
('t37','p9',NOW()),('t37','p12',NOW()),
('t38','p10',NOW()),('t38','p11',NOW()),
('t39','p13',NOW()),('t39','p16',NOW()),
('t40','p14',NOW()),('t40','p15',NOW());

INSERT INTO matches (id, tournament_id, player_id, status, court_id, round, set, pairing_id, winner_team, start_time, end_time) VALUES
('m33','t1','p2','scheduled','c1','3',0,'t33',NULL,'2025-12-02 09:00:00+05:30','2025-12-02 10:00:00+05:30'),
('m34','t1','p3','scheduled','c2','3',0,'t34',NULL,'2025-12-02 09:00:00+05:30','2025-12-02 10:00:00+05:30'),
('m35','t1','p4','scheduled','c1','3',0,'t35',NULL,'2025-12-02 10:15:00+05:30','2025-12-02 11:15:00+05:30'),
('m36','t1','p5','scheduled','c2','3',0,'t36',NULL,'2025-12-02 10:15:00+05:30','2025-12-02 11:15:00+05:30'),
('m37','t1','p6','scheduled','c1','3',0,'t37',NULL,'2025-12-02 11:30:00+05:30','2025-12-02 12:30:00+05:30'),
('m38','t1','p7','scheduled','c2','3',0,'t38',NULL,'2025-12-02 11:30:00+05:30','2025-12-02 12:30:00+05:30'),
('m39','t1','p8','scheduled','c1','3',0,'t39',NULL,'2025-12-02 12:45:00+05:30','2025-12-02 13:45:00+05:30'),
('m40','t1','p9','scheduled','c2','3',0,'t40',NULL,'2025-12-02 12:45:00+05:30','2025-12-02 13:45:00+05:30');

INSERT INTO pairing (id, tournament_id, match_id, team_id) VALUES
('p33','t1','m33','t33'),
('p34','t1','m34','t34'),
('p35','t1','m35','t35'),
('p36','t1','m36','t36'),
('p37','t1','m37','t37'),
('p38','t1','m38','t38'),
('p39','t1','m39','t39'),
('p40','t1','m40','t40');

-- ===============================
-- ROUND 4
-- ===============================
INSERT INTO team (id, tournament_id, round, name, avg_aura, metadata, created_at) VALUES
('t41','t1','4','Team 1',25,'{}',NOW()),
('t42','t1','4','Team 2',25,'{}',NOW()),
('t43','t1','4','Team 3',25,'{}',NOW()),
('t44','t1','4','Team 4',25,'{}',NOW()),
('t45','t1','4','Team 5',25,'{}',NOW()),
('t46','t1','4','Team 6',25,'{}',NOW()),
('t47','t1','4','Team 7',25,'{}',NOW()),
('t48','t1','4','Team 8',25,'{}',NOW());

INSERT INTO team_players (team_id, player_id, created_at) VALUES
('t41','p1',NOW()),('t41','p5',NOW()),
('t42','p2',NOW()),('t42','p6',NOW()),
('t43','p3',NOW()),('t43','p7',NOW()),
('t44','p4',NOW()),('t44','p8',NOW()),
('t45','p9',NOW()),('t45','p13',NOW()),
('t46','p10',NOW()),('t46','p14',NOW()),
('t47','p11',NOW()),('t47','p15',NOW()),
('t48','p12',NOW()),('t48','p16',NOW());

INSERT INTO matches (id, tournament_id, player_id, status, court_id, round, set, pairing_id, winner_team, start_time, end_time) VALUES
('m41','t1','p3','scheduled','c1','4',0,'t41',NULL,'2025-12-03 09:00:00+05:30','2025-12-03 10:00:00+05:30'),
('m42','t1','p4','scheduled','c2','4',0,'t42',NULL,'2025-12-03 09:00:00+05:30','2025-12-03 10:00:00+05:30'),
('m43','t1','p5','scheduled','c1','4',0,'t43',NULL,'2025-12-03 10:15:00+05:30','2025-12-03 11:15:00+05:30'),
('m44','t1','p6','scheduled','c2','4',0,'t44',NULL,'2025-12-03 10:15:00+05:30','2025-12-03 11:15:00+05:30'),
('m45','t1','p7','scheduled','c1','4',0,'t45',NULL,'2025-12-03 11:30:00+05:30','2025-12-03 12:30:00+05:30'),
('m46','t1','p8','scheduled','c2','4',0,'t46',NULL,'2025-12-03 11:30:00+05:30','2025-12-03 12:30:00+05:30'),
('m47','t1','p9','scheduled','c1','4',0,'t47',NULL,'2025-12-03 12:45:00+05:30','2025-12-03 13:45:00+05:30'),
('m48','t1','p10','scheduled','c2','4',0,'t48',NULL,'2025-12-03 12:45:00+05:30','2025-12-03 13:45:00+05:30');

INSERT INTO pairing (id, tournament_id, match_id, team_id) VALUES
('p41','t1','m41','t41'),
('p42','t1','m42','t42'),
('p43','t1','m43','t43'),
('p44','t1','m44','t44'),
('p45','t1','m45','t45'),
('p46','t1','m46','t46'),
('p47','t1','m47','t47'),
('p48','t1','m48','t48');

-- ===============================
-- ROUND 5
-- ===============================
INSERT INTO team (id, tournament_id, round, name, avg_aura, metadata, created_at) VALUES
('t49','t1','5','Team 1',25,'{}',NOW()),
('t50','t1','5','Team 2',25,'{}',NOW()),
('t51','t1','5','Team 3',25,'{}',NOW()),
('t52','t1','5','Team 4',25,'{}',NOW()),
('t53','t1','5','Team 5',25,'{}',NOW()),
('t54','t1','5','Team 6',25,'{}',NOW()),
('t55','t1','5','Team 7',25,'{}',NOW()),
('t56','t1','5','Team 8',25,'{}',NOW());

INSERT INTO team_players (team_id, player_id, created_at) VALUES
('t49','p1',NOW()),('t49','p6',NOW()),
('t50','p2',NOW()),('t50','p7',NOW()),
('t51','p3',NOW()),('t51','p8',NOW()),
('t52','p4',NOW()),('t52','p5',NOW()),
('t53','p9',NOW()),('t53','p14',NOW()),
('t54','p10',NOW()),('t54','p15',NOW()),
('t55','p11',NOW()),('t55','p16',NOW()),
('t56','p12',NOW()),('t56','p13',NOW());

INSERT INTO matches (id, tournament_id, player_id, status, court_id, round, set, pairing_id, winner_team, start_time, end_time) VALUES
('m49','t1','p1','scheduled','c1','5',0,'t49',NULL,'2025-12-04 09:00:00+05:30','2025-12-04 10:00:00+05:30'),
('m50','t1','p2','scheduled','c2','5',0,'t50',NULL,'2025-12-04 09:00:00+05:30','2025-12-04 10:00:00+05:30'),
('m51','t1','p3','scheduled','c1','5',0,'t51',NULL,'2025-12-04 10:15:00+05:30','2025-12-04 11:15:00+05:30'),
('m52','t1','p4','scheduled','c2','5',0,'t52',NULL,'2025-12-04 10:15:00+05:30','2025-12-04 11:15:00+05:30'),
('m53','t1','p5','scheduled','c1','5',0,'t53',NULL,'2025-12-04 11:30:00+05:30','2025-12-04 12:30:00+05:30'),
('m54','t1','p6','scheduled','c2','5',0,'t54',NULL,'2025-12-04 11:30:00+05:30','2025-12-04 12:30:00+05:30'),
('m55','t1','p7','scheduled','c1','5',0,'t55',NULL,'2025-12-04 12:45:00+05:30','2025-12-04 13:45:00+05:30'),
('m56','t1','p8','scheduled','c2','5',0,'t56',NULL,'2025-12-04 12:45:00+05:30','2025-12-04 13:45:00+05:30');

INSERT INTO pairing (id, tournament_id, match_id, team_id) VALUES
('p49','t1','m49','t49'),
('p50','t1','m50','t50'),
('p51','t1','m51','t51'),
('p52','t1','m52','t52'),
('p53','t1','m53','t53'),
('p54','t1','m54','t54'),
('p55','t1','m55','t55'),
('p56','t1','m56','t56');

INSERT INTO scores (id, match_id, team_a, team_b, metadata, created_at) VALUES
-- Match 1: m1
('S1','m1',0,0,'{"teamA":"t1","teamB":"t2","p1":1,"p2":2,"p3":3,"p4":4}', NOW()),
('S2','m1',1,0,'{"p1":2,"p2":1,"p3":3,"p4":4}', NOW()),
('S3','m1',1,1,'{"p1":2,"p2":1,"p3":3,"p4":4}', NOW()),
('S4','m1',2,1,'{"p1":3,"p2":2,"p3":3,"p4":4}', NOW()),
('S5','m1',2,2,'{"p1":3,"p2":2,"p3":4,"p4":4}', NOW()),
('S6','m1',3,2,'{"p1":4,"p2":2,"p3":4,"p4":4}', NOW()),
('S7','m1',3,3,'{"p1":4,"p2":3,"p3":4,"p4":4}', NOW()),

('S8','m2',0,0,'{"teamA":"t3","teamB":"t4","p5":5,"p6":6,"p7":7,"p8":8}', NOW()),
('S9','m2',0,1,'{"p5":5,"p6":6,"p7":8,"p8":7}', NOW()),
('S10','m2',1,1,'{"p5":6,"p6":5,"p7":8,"p8":7}', NOW()),
('S11','m2',1,2,'{"p5":6,"p6":5,"p7":9,"p8":7}', NOW()),
('S12','m2',2,2,'{"p5":7,"p6":5,"p7":9,"p8":7}', NOW()),
('S13','m2',2,3,'{"p5":7,"p6":6,"p7":9,"p8":8}', NOW()),
('S14','m2',3,3,'{"p5":8,"p6":6,"p7":9,"p8":8}', NOW());

INSERT INTO tournaments_referee (id, player_id, tournament_id) VALUES
('tr1', 'p1', 't1'),
('tr2', 'p2', 't1'),
('tr3', 'p3', 't2'),
('tr4', 'p4', 't2'),
('tr5', 'p5', 't3'),
('tr6', 'p6', 't3');
