const express = require("express");
const router = express.Router();
const { prisma } = require("../prismaClient");

const ARCADE_HREFS = {
  "snake-arcade": "/snake",
};

router.get("/", async (req, res) => {
  try {
    const categoryFilter = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const where = {};
    if (categoryFilter) {
      if (categoryFilter.toLowerCase() === "uncategorized") {
        where.OR = [{ category: null }, { category: "" }];
      } else {
        where.category = { equals: categoryFilter, mode: "insensitive" };
      }
    }

    const arcades = await prisma.arcade.findMany({
      where,
      orderBy: { created_at: "desc" },
      select: {
        slug: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        players_label: true,
        streak_label: true,
      },
    });

    res.json(
      arcades.map((arcade) => ({
        slug: arcade.slug,
        title: arcade.title,
        description: arcade.description,
        category: arcade.category ?? "Arcade",
        difficulty: arcade.difficulty,
        players: arcade.players_label,
        streak: arcade.streak_label,
        href: ARCADE_HREFS[arcade.slug] || null,
      }))
    );
  } catch (err) {
    console.error("Failed to load arcade entries:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/categories", async (_req, res) => {
  try {
    const categories = await prisma.$queryRaw`
      SELECT
        COALESCE(NULLIF(category, ''), 'Uncategorized') AS category,
        COUNT(*) AS total_arcades,
        MAX(created_at) AS last_activity
      FROM arcades
      GROUP BY category
      ORDER BY total_arcades DESC, category ASC;
    `;

    res.json(
      categories.map((row) => ({
        category: row.category,
        totalChallenges: Number(row.total_arcades),
        lastActivity: row.last_activity ? new Date(row.last_activity).toISOString() : null,
      }))
    );
  } catch (err) {
    console.error("Failed to load arcade categories:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
