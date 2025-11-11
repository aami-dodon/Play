-- Drop old tables if re-running
DROP TABLE IF EXISTS leaderboard;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS quizzes;

-- Main quizzes table
CREATE TABLE quizzes (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
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

-- Seed the Database Quiz
INSERT INTO quizzes (slug, title, description, category)
VALUES ('db', 'Database Quiz', 'Test your knowledge of different database types and when to use them.', 'Tech');

-- Get the quiz ID
-- (In a real seed script, you'd query it dynamically, but here we use a static id of 1)
INSERT INTO questions (quiz_id, question_text, options, correct_option, explanation)
VALUES
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
