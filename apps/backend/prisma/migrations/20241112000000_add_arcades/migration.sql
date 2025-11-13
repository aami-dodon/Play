-- Create arcades table to separate arcade challenge metadata from quizzes.
CREATE TABLE "arcades" (
  "id" SERIAL PRIMARY KEY,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "difficulty" TEXT NOT NULL DEFAULT 'Spicy',
  "players_label" TEXT,
  "streak_label" TEXT,
  "created_at" TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- Allow leaderboard rows to optionally point at quizzes or arcades.
ALTER TABLE "leaderboard" ALTER COLUMN "quiz_id" DROP NOT NULL;
ALTER TABLE "leaderboard"
  ADD COLUMN "arcade_id" INTEGER REFERENCES "arcades"("id") ON DELETE CASCADE;
