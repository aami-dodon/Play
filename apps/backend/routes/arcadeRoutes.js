const express = require("express");
const router = express.Router();
const { prisma } = require("../prismaClient");

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
