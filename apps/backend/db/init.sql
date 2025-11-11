DROP TABLE IF EXISTS leaderboard;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;

-- Main quizzes table with feature flags for the home page
CREATE TABLE quizzes (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  difficulty TEXT DEFAULT 'Spicy',
  featured BOOLEAN DEFAULT FALSE,
  players_label TEXT,
  streak_label TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Questions for each quiz
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard for each quiz
CREATE TABLE leaderboard (
  id SERIAL PRIMARY KEY,
  quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
  username VARCHAR(100),
  completion_time_seconds INT,
  score INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed quizzes that power the Featured Challenges rail
INSERT INTO quizzes (slug, title, description, category, difficulty, featured, players_label, streak_label)
VALUES
('db', 'Database Quiz', 'Test your knowledge of different database types and when to use them.', 'Tech', 'Chill', TRUE, '2.1k online', '13 wins'),
('api-chaos', 'API Chaos Mode', 'The backend incidents nobody writes postmortems for.', 'Backend', 'Chaotic', TRUE, '1.1k online', '9 wins'),
('ops-meltdown', 'Ops Meltdown Bingo', 'Predict which service page goes down first.', 'DevOps', 'Spicy', FALSE, '648 online', '6 wins'),
('latency-legends', 'Latency Legends', 'Keep p95 low while everything else is on fire.', 'Performance', 'Chaotic', TRUE, '742 online', '4 wins');

-- Database Quiz Questions (quiz_id = 1)
INSERT INTO questions (quiz_id, question_text, options, correct_option, explanation) VALUES
(1, 'Which database is best for storing and querying highly connected data (e.g. social networks)?',
    '["Graph DB","Document DB","Relational DB","Key-Value Store"]',
    'Graph DB',
    'Graph databases (like Neo4j, TigerGraph) are designed for traversing relationships.'),
(1, 'Which database type excels at flexible JSON-like documents with varying fields?',
    '["Relational DB","Document DB","Vector DB","Time-Series DB"]',
    'Document DB',
    'Document databases (like MongoDB, Couchbase) are schema-flexible and great for semi-structured data.'),
(1, 'Which type is optimized for storing embeddings and performing semantic similarity search?',
    '["Vector DB","Relational DB","Graph DB","Search Engine"]',
    'Vector DB',
    'Vector databases (like Pinecone, Weaviate) are used for AI and semantic search.'),
(1, 'Which database type is best for structured, transactional data with ACID guarantees?',
    '["Relational DB","Document DB","Key-Value Store","Graph DB"]',
    'Relational DB',
    'Relational databases (like PostgreSQL, MySQL) enforce schema and ensure strong transactional integrity.');

-- API Chaos Mode Questions (quiz_id = 2)
INSERT INTO questions (quiz_id, question_text, options, correct_option, explanation) VALUES
(2, 'Your API is returning 200s but clients see failures. First suspect?', '["Caching layer","DNS","Frontend bundle","Database"]', 'Caching layer', 'A stale or poisoned cache silently serves outdated error payloads.'),
(2, 'Which header do you inspect to confirm a request survived a gateway?', '["X-Request-ID","Retry-After","Authorization","Accept-Encoding"]', 'X-Request-ID', 'Trace IDs verify the hop trail across gateways.'),
(2, 'You need to roll out a breaking change without downtime. What pattern saves you?', '["Blue/green deploy","Single server deploy","Manual hotfix","Fail fast"]', 'Blue/green deploy', 'Blue/green keeps two production environments so you can flip traffic safely.');

-- Ops Meltdown Bingo Questions (quiz_id = 3)
INSERT INTO questions (quiz_id, question_text, options, correct_option, explanation) VALUES
(3, 'Pods keep crash-looping after deploy. What do you check first?', '["Probe config","CDN logs","Feature flags","Favicon"]', 'Probe config', 'Bad readiness probes are the fastest path to crash-loop limbo.'),
(3, 'Pager goes off at 3 AM. Which dashboard loads first?', '["Infrastructure latency","Signup conversion","Incident retro","Daily active users"]', 'Infrastructure latency', 'You start where the smoke is thickest: infra health.'),
(3, 'How do you calm a noisy alert that keeps flapping?', '["Tune thresholds","Restart cluster","Ignore it","Add more dashboards"]', 'Tune thresholds', 'Alerts should be actionable; recalibrating beats alert fatigue.');

-- Latency Legends Questions (quiz_id = 4)
INSERT INTO questions (quiz_id, question_text, options, correct_option, explanation) VALUES
(4, 'Which metric screams user pain before anything else?', '["p95 latency","Average CPU","Disk usage","Cron duration"]', 'p95 latency', 'High percentiles show the slow tail that users actually feel.'),
(4, 'What is the quickest band-aid for a slow query during peak traffic?', '["Add an index","Rewrite schema","Full vacuum","New microservice"]', 'Add an index', 'Indexes are the pragmatic quick win before heroic rewrites.'),
(4, 'You suspect GC pauses are killing throughput. What do you inspect?', '["Heap profiles","Load balancer","Dark mode","API version"]', 'Heap profiles', 'GC tuning starts with understanding memory pressure and heap churn.');

-- Sample leaderboard entries spanning multiple quizzes for the overall leaderboard
INSERT INTO leaderboard (quiz_id, username, completion_time_seconds, score) VALUES
(1, 'PixelBandit', 36, 4800),
(2, 'PixelBandit', 33, 5200),
(4, 'LagWizard', 39, 4650),
(2, 'LagWizard', 41, 4825),
(1, 'TriviaGoblin', 55, 4300),
(3, 'TriviaGoblin', 62, 4100),
(3, 'GlitchQueen', 44, 5050),
(4, 'GlitchQueen', 40, 4950),
(2, 'ByteKnight', 37, 4500),
(1, 'ByteKnight', 42, 4425),
(4, 'StackSage', 38, 4320),
(2, 'StackSage', 40, 4150),
(3, 'QueryNinja', 48, 4000),
(1, 'QueryNinja', 52, 4050),
(4, 'LatencyLord', 35, 4380);
