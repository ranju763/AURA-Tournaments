-- PLAYERS
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  username VARCHAR,
  dob DATE,
  gender VARCHAR,
  photo_url TEXT,
  created_at TIMESTAMPTZ
);

-- VENUE
CREATE TABLE venue (
  id TEXT PRIMARY KEY,
  name VARCHAR,
  address TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- MATCH FORMAT
CREATE TABLE match_format (
  id TEXT PRIMARY KEY,
  type VARCHAR NOT NULL CHECK (type IN ('mens_doubles', 'womens_doubles', 'mixed_doubles')),
  min_age INT,
  max_age INT,
  eligible_gender VARCHAR NOT NULL CHECK (eligible_gender IN ('M', 'W', 'MW')),
  total_rounds INT DEFAULT 0 CHECK (total_rounds >= 0),
  metadata JSONB,
  CHECK ((min_age IS NULL AND max_age IS NULL) OR (max_age >= min_age))
);

-- TOURNAMENTS
CREATE TABLE tournaments (
  id TEXT PRIMARY KEY,
  host_id TEXT NOT NULL REFERENCES players(id),
  name VARCHAR NOT NULL,
  description TEXT NOT NULL,
  sport_id TEXT,
  venue TEXT NOT NULL REFERENCES venue(id),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  capacity INT NOT NULL CHECK (capacity > 0),
  image_url TEXT,
  match_format TEXT NOT NULL REFERENCES match_format(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (end_time > start_time)
);


-- TRANSACTIONS
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  amount NUMERIC,
  type VARCHAR,
  status VARCHAR,
  created_at TIMESTAMPTZ
);

-- REGISTRATIONS
CREATE TABLE registrations (
  id TEXT PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id),
  player_id TEXT REFERENCES players(id),
  txn_id TEXT REFERENCES transactions(id),
  created_at TIMESTAMPTZ
);

-- COURTS
CREATE TABLE courts (
  id TEXT PRIMARY KEY,
  venue_id TEXT REFERENCES venue(id),
  court_number INT
);

-- RATINGS
CREATE TABLE ratings (
  id TEXT PRIMARY KEY,
  player_id TEXT REFERENCES players(id),
  aura_mu FLOAT,
  aura_sigma FLOAT,
  last_updated TIMESTAMPTZ
);

-- TEAM
CREATE TABLE team (
  id TEXT PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id),
  round VARCHAR,
  name VARCHAR,
  avg_aura FLOAT,
  metadata JSONB,
  created_at TIMESTAMPTZ
);

-- TEAM PLAYERS
CREATE TABLE team_players (
  team_id TEXT REFERENCES team(id),
  player_id TEXT REFERENCES players(id),
  created_at TIMESTAMPTZ,
  PRIMARY KEY (team_id, player_id)
);

-- MATCHES
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id),
  player_id TEXT REFERENCES players(id),
  status VARCHAR,
  court_id TEXT REFERENCES courts(id),
  round VARCHAR,
  set INT,
  pairing_id TEXT,
  winner_team TEXT REFERENCES team(id),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
);

-- PAIRING
CREATE TABLE pairing (
  id TEXT PRIMARY KEY,
  tournament_id TEXT REFERENCES tournaments(id),
  match_id TEXT REFERENCES matches(id),
  team_id TEXT REFERENCES team(id)
);

-- RATING HISTORY
CREATE TABLE rating_history (
  id TEXT PRIMARY KEY,
  player_id TEXT REFERENCES players(id),
  match_id TEXT REFERENCES matches(id),
  old_mu FLOAT,
  old_sigma FLOAT,
  new_mu FLOAT,
  new_sigma FLOAT,
  created_at TIMESTAMPTZ
);

-- SCORES
CREATE TABLE scores (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id),
  team_a INT,
  team_b INT,
  metadata JSONB,
  created_at TIMESTAMPTZ
);

-- TOURNAMENT REFEREE
CREATE TABLE tournaments_referee (
  id TEXT PRIMARY KEY,
  player_id TEXT REFERENCES players(id),
  tournament_id TEXT REFERENCES tournaments(id)
);
