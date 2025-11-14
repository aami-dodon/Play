/**
 * @openapi
 * components:
 *   schemas:
 *     ChaosLeaderboardEntry:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         score:
 *           type: integer
 *         completion_time_seconds:
 *           type: integer
 *           nullable: true
 *         rank:
 *           type: integer
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *     ChaosScoreSubmission:
 *       type: object
 *       required:
 *         - username
 *         - score
 *       properties:
 *         username:
 *           type: string
 *         score:
 *           type: integer
 *         completion_time_seconds:
 *           type: integer
 *   responses:
 *     ChaosScoreResponse:
 *       description: Chaos leaderboard submission result
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               entry:
 *                 $ref: "#/components/schemas/ChaosLeaderboardEntry"
 */
const express = require("express");
const { prisma } = require("../../prismaClient");
const { ensureChaosArcade } = require("./chaosService");

const router = express.Router();
const LEADERBOARD_LIMIT_DEFAULT = 10;
const LEADERBOARD_LIMIT_MAX = 25;

const clampLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return LEADERBOARD_LIMIT_DEFAULT;
  }
  return Math.min(Math.max(parsed, 1), LEADERBOARD_LIMIT_MAX);
};

const sanitizeUsername = (value = "") => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 100);
};

const sanitizeScore = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return null;
  return Math.round(numeric);
};

const sanitizeDuration = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }
  return Math.round(numeric);
};

/**
 * @openapi
 * /games/chaos/leaderboard:
 *   get:
 *     summary: Fetch the chaos drop leaderboard.
 *     tags:
 *       - Chaos Drop
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           minimum: 1
 *           maximum: 25
 *         description: Number of entries to return.
 *     responses:
 *       200:
 *         description: Paginated chaos leaderboard rows
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 entries:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/ChaosLeaderboardEntry"
 *       500:
 *         description: Internal server error
 */
router.get("/leaderboard", async (req, res) => {
  try {
    const limit = clampLimit(req.query.limit);
    const chaosArcade = await ensureChaosArcade();

    const rows = await prisma.leaderboard.findMany({
      where: {
        arcade_id: chaosArcade.id,
        username: { not: null, not: "" },
      },
      orderBy: [
        { score: "desc" },
        { completion_time_seconds: "asc" },
        { created_at: "desc" },
      ],
      take: limit,
    });

    const entries = rows.map((row, index) => ({
      username: row.username,
      score: row.score ?? 0,
      completion_time_seconds: row.completion_time_seconds ?? null,
      rank: index + 1,
      created_at: row.created_at ? row.created_at.toISOString() : null,
    }));

    res.json({ entries });
  } catch (error) {
    console.error("Failed to load chaos leaderboard:", error);
    res.status(500).json({ error: "Could not load chaos leaderboard." });
  }
});

/**
 * @openapi
 * /games/chaos/score:
 *   post:
 *     summary: Submit a chaos drop score.
 *     tags:
 *       - Chaos Drop
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/ChaosScoreSubmission"
 *     responses:
 *       201:
 *         $ref: "#/components/responses/ChaosScoreResponse"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Unexpected error
 */
router.post("/score", async (req, res) => {
  const username = sanitizeUsername(req.body?.username);
  if (!username) {
    return res.status(400).json({ error: "A username is required." });
  }

  const score = sanitizeScore(req.body?.score);
  if (score === null) {
    return res.status(400).json({ error: "Score must be a non-negative integer." });
  }

  const duration = sanitizeDuration(req.body?.completion_time_seconds);
  if (
    req.body?.completion_time_seconds !== undefined &&
    req.body?.completion_time_seconds !== null &&
    duration === null
  ) {
    return res
      .status(400)
      .json({ error: "Completion time must be a non-negative number if provided." });
  }

  try {
    const chaosArcade = await ensureChaosArcade();
    const entry = await prisma.leaderboard.create({
      data: {
        arcade_id: chaosArcade.id,
        username,
        score,
        completion_time_seconds: duration,
      },
    });

    res.status(201).json({
      message: "Chaos score recorded.",
      entry: {
        username: entry.username,
        score: entry.score ?? 0,
        completion_time_seconds: entry.completion_time_seconds ?? null,
        rank: null,
        created_at: entry.created_at ? entry.created_at.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("Chaos score submission failed:", error);
    res.status(500).json({ error: "Failed to record chaos score." });
  }
});

module.exports = router;
