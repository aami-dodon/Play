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
 *           default: 20
 *           minimum: 1
 *           maximum: 50
 *         description: Number of rows to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: Paginated aggregated leaderboard entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entries:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       username:
 *                         type: string
 *                       total_score:
 *                         type: integer
 *                       attempts:
 *                         type: integer
 *                       best_time_seconds:
 *                         type: integer
 *                       last_played:
 *                         type: string
 *                         format: date-time
 *                       top_category:
 *                         type: string
 *                 hasMore:
 *                   type: boolean
 *                 nextOffset:
 *                   type: integer
 *       500:
 *         description: Internal server error
 */
const express = require("express");
const router = express.Router();
const { prisma } = require("../prismaClient");
const LEADERBOARD_PAGE_SIZE_DEFAULT = 20;
const LEADERBOARD_PAGE_SIZE_MAX = 50;
const { Prisma } = require("@prisma/client");

router.get("/", async (req, res) => {
  const limitParam = parseInt(req.query.limit, 10);
  const offsetParam = parseInt(req.query.offset, 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), LEADERBOARD_PAGE_SIZE_MAX)
    : LEADERBOARD_PAGE_SIZE_DEFAULT;
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
  const fetchLimit = limit + 1;

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
      LIMIT ${fetchLimit}
      OFFSET ${offset}
    `);

    const normalized = leaderboard.map((row) => ({
      ...row,
      total_score: row.total_score != null ? Number(row.total_score) : row.total_score,
      attempts: row.attempts != null ? Number(row.attempts) : row.attempts,
      best_time_seconds:
        row.best_time_seconds != null ? Number(row.best_time_seconds) : row.best_time_seconds,
    }));

    const hasMore = leaderboard.length > limit;
    const entries = hasMore ? normalized.slice(0, limit) : normalized;
    const nextOffset = offset + entries.length;

    res.json({ entries, hasMore, nextOffset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
