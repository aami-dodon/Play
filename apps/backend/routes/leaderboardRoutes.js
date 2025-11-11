/**
 * @openapi
 * /leaderboard:
 *   get:
 *     summary: Retrieve the overall leaderboard across all quizzes
 *     tags:
 *       - Leaderboard
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 50
 *         description: Number of rows to return
 *     responses:
 *       200:
 *         description: Aggregated leaderboard entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   username:
 *                     type: string
 *                   total_score:
 *                     type: integer
 *                   attempts:
 *                     type: integer
 *                   best_time_seconds:
 *                     type: integer
 *                   last_played:
 *                     type: string
 *                     format: date-time
 *                   top_category:
 *                     type: string
 *       500:
 *         description: Internal server error
 */
const express = require("express");
const router = express.Router();
const { prisma } = require("../prismaClient");
const { Prisma } = require("@prisma/client");

router.get("/", async (req, res) => {
  const limitParam = parseInt(req.query.limit, 10);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 10;

  try {
    const leaderboard = await prisma.$queryRaw(Prisma.sql`
      WITH aggregated AS (
        SELECT
          username,
          SUM(score) AS total_score,
          COUNT(*) AS attempts,
          MIN(completion_time_seconds) AS best_time_seconds,
          MAX(created_at) AS last_played
        FROM leaderboard
        WHERE username IS NOT NULL AND username <> ''
        GROUP BY username
      ),
      category_base AS (
        SELECT
          l.username,
          q.category,
          COUNT(*) AS plays,
          MAX(l.created_at) AS last_played_category
        FROM leaderboard l
        JOIN quizzes q ON q.id = l.quiz_id
        WHERE l.username IS NOT NULL AND l.username <> ''
        GROUP BY l.username, q.category
      ),
      category_ranked AS (
        SELECT
          *,
          ROW_NUMBER() OVER (PARTITION BY username ORDER BY plays DESC, last_played_category DESC) AS rn
        FROM category_base
      )
      SELECT
        a.username,
        a.total_score,
        a.attempts,
        a.best_time_seconds,
        a.last_played,
        cr.category AS top_category
      FROM aggregated a
      LEFT JOIN category_ranked cr ON cr.username = a.username AND cr.rn = 1
      ORDER BY a.total_score DESC, a.best_time_seconds ASC NULLS LAST
      LIMIT ${limit}
    `);

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
