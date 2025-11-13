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

const normalizePeriod = (period) => {
  if (!period || typeof period !== "string") return "";
  return period.trim().toLowerCase();
};

const getPeriodStart = (period) => {
  const normalized = normalizePeriod(period);
  const now = new Date();
  if (normalized === "today") {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  }

  if (normalized === "week" || normalized === "this week") {
    const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const utcDay = startOfDay.getUTCDay();
    const isoDay = (utcDay + 6) % 7;
    startOfDay.setUTCDate(startOfDay.getUTCDate() - isoDay);
    return startOfDay;
  }

  return null;
};

router.get("/", async (req, res) => {
  const limitParam = parseInt(req.query.limit, 10);
  const offsetParam = parseInt(req.query.offset, 10);
  const limit = Number.isFinite(limitParam)
    ? Math.min(Math.max(limitParam, 1), LEADERBOARD_PAGE_SIZE_MAX)
    : LEADERBOARD_PAGE_SIZE_DEFAULT;
  const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
  const fetchLimit = limit + 1;

  const filterConditions = [];
  if (req.query.category && req.query.category.trim()) {
    const categoryParam = req.query.category.trim();
    filterConditions.push(
      Prisma.sql`LOWER(COALESCE(q.category, a.category, '')) = LOWER(${categoryParam})`
    );
  }

  if (req.query.challenge && req.query.challenge.trim()) {
    const challengeParam = req.query.challenge.trim();
    filterConditions.push(Prisma.sql`COALESCE(q.slug, a.slug, '') = ${challengeParam}`);
  }

  const periodStart = getPeriodStart(req.query.period);
  if (periodStart) {
    filterConditions.push(Prisma.sql`l.created_at >= ${periodStart}`);
  }

  const filterWhere =
    filterConditions.length > 0 ? Prisma.sql`AND ${Prisma.join(filterConditions, " AND ")}` : Prisma.empty;

  try {
    const leaderboard = await prisma.$queryRaw(Prisma.sql`
      WITH filtered_leaderboard AS (
        SELECT
          l.*,
          COALESCE(NULLIF(q.category, ''), NULLIF(a.category, ''), '') AS category,
          COALESCE(q.slug, a.slug, '') AS slug,
          COALESCE(q.title, a.title, '') AS title
        FROM leaderboard l
        LEFT JOIN quizzes q ON q.id = l.quiz_id
        LEFT JOIN arcades a ON a.id = l.arcade_id
        WHERE l.username IS NOT NULL AND l.username <> ''
          AND (q.id IS NOT NULL OR a.id IS NOT NULL)
        ${filterWhere}
      ),
      aggregated AS (
        SELECT
          username,
          SUM(COALESCE(score, 0)) AS total_score,
          COUNT(*) AS attempts,
          MIN(completion_time_seconds) AS best_time_seconds,
          MAX(created_at) AS last_played
        FROM filtered_leaderboard
        GROUP BY username
      ),
      category_base AS (
        SELECT
          username,
          category,
          COUNT(*) AS plays,
          MAX(created_at) AS last_played_category
        FROM filtered_leaderboard
        GROUP BY username, category
      ),
      category_ranked AS (
        SELECT
          *,
          ROW_NUMBER() OVER (PARTITION BY username ORDER BY plays DESC, last_played_category DESC) AS rn
        FROM category_base
      ),
      challenge_base AS (
        SELECT
          username,
          title AS challenge_title,
          slug AS challenge_slug,
          COUNT(*) AS plays,
          MAX(created_at) AS last_played_challenge
        FROM filtered_leaderboard
        GROUP BY username, title, slug
      ),
      challenge_ranked AS (
        SELECT
          *,
          ROW_NUMBER() OVER (PARTITION BY username ORDER BY plays DESC, last_played_challenge DESC) AS rn
        FROM challenge_base
      ),
      category_score_rows AS (
        SELECT
          username,
          COALESCE(NULLIF(TRIM(category), ''), 'Uncategorized') AS category_key,
          SUM(COALESCE(score, 0)) AS total_score
        FROM filtered_leaderboard
        GROUP BY username, category_key
      ),
      category_score_map AS (
        SELECT username, jsonb_object_agg(category_key, total_score) AS category_scores
        FROM category_score_rows
        GROUP BY username
      ),
      challenge_score_rows AS (
        SELECT
          username,
          COALESCE(NULLIF(TRIM(slug), ''), 'legacy-challenge') AS challenge_slug,
          SUM(COALESCE(score, 0)) AS total_score
        FROM filtered_leaderboard
        GROUP BY username, challenge_slug
      ),
      challenge_score_map AS (
        SELECT username, jsonb_object_agg(challenge_slug, total_score) AS challenge_scores
        FROM challenge_score_rows
        GROUP BY username
      )
      SELECT
        a.username,
        a.total_score,
        a.attempts,
        a.best_time_seconds,
        a.last_played,
        cr.category AS top_category,
        ch.challenge_title AS top_challenge,
        ch.challenge_slug AS top_challenge_slug,
        cat.category_scores,
        chm.challenge_scores
      FROM aggregated a
      LEFT JOIN category_ranked cr ON cr.username = a.username AND cr.rn = 1
      LEFT JOIN challenge_ranked ch ON ch.username = a.username AND ch.rn = 1
      LEFT JOIN category_score_map cat ON cat.username = a.username
      LEFT JOIN challenge_score_map chm ON chm.username = a.username
      ORDER BY a.total_score DESC, a.best_time_seconds ASC NULLS LAST
      LIMIT ${fetchLimit}
      OFFSET ${offset}
    `);

    const challengeLookupResult = await prisma.$queryRaw(Prisma.sql`
      SELECT jsonb_object_agg(tmp.slug, tmp.title) AS challenge_lookup
      FROM (
        SELECT DISTINCT
          COALESCE(q.slug, a.slug, '') AS slug,
          COALESCE(q.title, a.title, '') AS title
        FROM leaderboard l
        LEFT JOIN quizzes q ON q.id = l.quiz_id
        LEFT JOIN arcades a ON a.id = l.arcade_id
        WHERE l.username IS NOT NULL AND l.username <> ''
          AND (q.id IS NOT NULL OR a.id IS NOT NULL)
        ${filterWhere}
      ) tmp
    `);
    const challengeLookup =
      Array.isArray(challengeLookupResult) && challengeLookupResult.length > 0
        ? challengeLookupResult[0]?.challenge_lookup || {}
        : {};

    const normalizeScoreMap = (value) => {
      if (!value || typeof value !== "object") return {};
      return Object.entries(value).reduce((acc, [key, mapValue]) => {
        const num = Number(mapValue ?? 0);
        if (!Number.isFinite(num)) return acc;
        acc[key] = num;
        return acc;
      }, {});
    };

    const normalized = leaderboard.map((row) => ({
      ...row,
      total_score: row.total_score != null ? Number(row.total_score) : row.total_score,
      attempts: row.attempts != null ? Number(row.attempts) : row.attempts,
      best_time_seconds:
        row.best_time_seconds != null ? Number(row.best_time_seconds) : row.best_time_seconds,
      category_scores: normalizeScoreMap(row.category_scores),
      challenge_scores: normalizeScoreMap(row.challenge_scores),
    }));

    const hasMore = leaderboard.length > limit;
    const entries = hasMore ? normalized.slice(0, limit) : normalized;
    const nextOffset = offset + entries.length;

    res.json({ entries, hasMore, nextOffset, challengeLookup });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
