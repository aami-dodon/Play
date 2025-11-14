const { prisma } = require("../../prismaClient");

const CHAOS_GAME_SLUG = "chaos-drop";
const CHAOS_GAME_TITLE = "Chaos Drop Sabotage";
const CHAOS_GAME_DESCRIPTION = "Drop junk blocks, force the AI to panic-clean.";
const CHAOS_GAME_CATEGORY = "Arcade";
const CHAOS_GAME_DIFFICULTY = "Tactical";

async function ensureChaosArcade() {
  return prisma.arcade.upsert({
    where: { slug: CHAOS_GAME_SLUG },
    update: {
      title: CHAOS_GAME_TITLE,
      description: CHAOS_GAME_DESCRIPTION,
      category: CHAOS_GAME_CATEGORY,
      difficulty: CHAOS_GAME_DIFFICULTY,
    },
    create: {
      slug: CHAOS_GAME_SLUG,
      title: CHAOS_GAME_TITLE,
      description: CHAOS_GAME_DESCRIPTION,
      category: CHAOS_GAME_CATEGORY,
      difficulty: CHAOS_GAME_DIFFICULTY,
      players_label: "Saboteurs online",
      streak_label: "Holes planted",
    },
  });
}

module.exports = {
  ensureChaosArcade,
  CHAOS_GAME_SLUG,
  CHAOS_GAME_TITLE,
};
