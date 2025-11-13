const { prisma } = require("../../prismaClient");

const SNAKE_GAME_SLUG = "snake-arcade";
const SNAKE_GAME_TITLE = "Snake Arcade Sprint";
const SNAKE_GAME_DESCRIPTION = "Classic snake, new leaderboard bragging rights.";
const SNAKE_GAME_CATEGORY = "Arcade";
const SNAKE_GAME_DIFFICULTY = "Retro";

async function ensureSnakeQuiz() {
  return prisma.quiz.upsert({
    where: { slug: SNAKE_GAME_SLUG },
    update: {
      title: SNAKE_GAME_TITLE,
      description: SNAKE_GAME_DESCRIPTION,
      category: SNAKE_GAME_CATEGORY,
      difficulty: SNAKE_GAME_DIFFICULTY,
    },
    create: {
      slug: SNAKE_GAME_SLUG,
      title: SNAKE_GAME_TITLE,
      description: SNAKE_GAME_DESCRIPTION,
      category: SNAKE_GAME_CATEGORY,
      difficulty: SNAKE_GAME_DIFFICULTY,
      players_label: "Snake speedruns",
      streak_label: "Longest tail",
    },
  });
}

module.exports = {
  ensureSnakeQuiz,
  SNAKE_GAME_SLUG,
  SNAKE_GAME_TITLE,
};
