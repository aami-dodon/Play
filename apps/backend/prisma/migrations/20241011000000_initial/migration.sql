-- Create quizzes table as the root of the quiz data model.
CREATE TABLE "quizzes" (
  "id" SERIAL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "difficulty" TEXT NOT NULL DEFAULT 'Spicy',
  "featured" BOOLEAN NOT NULL DEFAULT FALSE,
  "players_label" TEXT,
  "streak_label" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Questions belong to a quiz and store the possible options as JSONB.
CREATE TABLE "questions" (
  "id" SERIAL PRIMARY KEY,
  "quiz_id" INTEGER NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
  "question_text" TEXT NOT NULL,
  "options" JSONB NOT NULL,
  "correct_option" TEXT NOT NULL,
  "explanation" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE ("quiz_id", "question_text")
);

-- Leaderboard entries aggregate scores for each quiz.
CREATE TABLE "leaderboard" (
  "id" SERIAL PRIMARY KEY,
  "quiz_id" INTEGER NOT NULL REFERENCES "quizzes"("id") ON DELETE CASCADE,
  "username" VARCHAR(100),
  "completion_time_seconds" INTEGER,
  "score" INTEGER,
  "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);
