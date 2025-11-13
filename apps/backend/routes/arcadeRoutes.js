const express = require("express");
const router = express.Router();
const { prisma } = require("../prismaClient");

const ARCADE_HREFS = {
  "snake-arcade": "/snake",
};

/**
 * @openapi
 * /arcades:
 *   get:
 *     summary: Retrieve arcade challenges
 *     tags:
 *       - Arcades
 *     parameters:
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: Optional category filter
 *     responses:
 *       200:
 *         description: List of arcade entries with metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   slug:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                   difficulty:
 *                     type: string
 *                   players:
 *                     type: string
 *                   streak:
 *                     type: string
 *                   href:
 *                     type: string
 *                     nullable: true
 *       500:
 *         description: Failed to load arcade entries
 */
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

/**
 * @openapi
 * /arcades/categories:
 *   get:
 *     summary: Aggregate statistics for arcade categories
 *     tags:
 *       - Arcades
 *     responses:
 *       200:
 *         description: Arcade category metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   category:
 *                     type: string
 *                   totalChallenges:
 *                     type: integer
 *                   lastActivity:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 *       500:
 *         description: Failed to load arcade categories
 */
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
