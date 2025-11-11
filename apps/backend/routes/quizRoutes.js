/**
 * @openapi
 * components:
 *   schemas:
 *     Quiz:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         slug:
 *           type: string
 *         title:
 *           type: string
 *     Question:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         question_text:
 *           type: string
 *         options:
 *           type: array
 *           items:
 *             type: string
 *         correct_option:
 *           type: string
 *         explanation:
 *           type: string
 *     LeaderboardEntry:
 *       type: object
 *       properties:
 *         username:
 *           type: string
 *         score:
 *           type: integer
 *         completion_time_seconds:
 *           type: integer
 *         created_at:
 *           type: string
 *           format: date-time
 */
const express = require("express");
const router = express.Router();
const { prisma } = require("../prismaClient");

const QUIZ_PAGE_SIZE_DEFAULT = 12;
const QUIZ_PAGE_SIZE_MAX = 50;

function parseFeaturedFlag(value) {
  if (value === undefined || value === null) return null;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return null;
}

/**
 * @openapi
 * /quizzes/categories:
 *   get:
 *     summary: Aggregate stats per quiz category
 *     tags:
 *       - Quizzes
 *     responses:
 *       200:
 *         description: Category metrics
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
 *                   featuredChallenges:
 *                     type: integer
 *                   totalQuestions:
 *                     type: integer
 *                   lastActivity:
 *                     type: string
 *                     format: date-time
 */
router.get("/categories", async (_req, res) => {
  try {
    const categories = await prisma.$queryRaw`
      SELECT
        q.category,
        COUNT(DISTINCT q.id) AS total_challenges,
        SUM(CASE WHEN q.featured THEN 1 ELSE 0 END) AS featured_challenges,
        COALESCE(SUM(question_counts.question_count), 0) AS total_questions,
        MAX(q.created_at) AS last_activity
      FROM quizzes q
      LEFT JOIN (
        SELECT quiz_id, COUNT(*) AS question_count
        FROM questions
        GROUP BY quiz_id
      ) question_counts ON question_counts.quiz_id = q.id
      WHERE q.category IS NOT NULL
      GROUP BY q.category
      ORDER BY total_challenges DESC, q.category ASC
    `;

    res.json(
      categories.map((row) => ({
        category: row.category,
        totalChallenges: Number(row.total_challenges),
        featuredChallenges: Number(row.featured_challenges),
        totalQuestions: Number(row.total_questions),
        lastActivity: row.last_activity ? new Date(row.last_activity).toISOString() : null,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /quizzes:
 *   get:
 *     summary: List all quizzes
 *     tags:
 *       - Quizzes
 *     responses:
 *       200:
 *         description: Paginated list of quizzes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/Quiz"
 *                 hasMore:
 *                   type: boolean
 *                 nextOffset:
 *                   type: integer
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Optional category name to filter quizzes.
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Optional flag to filter featured quizzes.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *           minimum: 1
 *           maximum: 50
 *         description: Number of quizzes per page.
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *           minimum: 0
 *         description: List offset for pagination.
 */
router.get("/", async (req, res) => {
  try {
    const { category, featured } = req.query;
    const where = {};

    if (category) {
      where.category = { equals: category, mode: "insensitive" };
    }

    const featuredFlag = parseFeaturedFlag(featured);
    if (featuredFlag !== null) {
      where.featured = featuredFlag;
    }

    const limitParam = parseInt(req.query.limit, 10);
    const offsetParam = parseInt(req.query.offset, 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), QUIZ_PAGE_SIZE_MAX)
      : QUIZ_PAGE_SIZE_DEFAULT;
    const offset = Number.isFinite(offsetParam) && offsetParam >= 0 ? offsetParam : 0;
    const fetchLimit = limit + 1;

    const quizzes = await prisma.quiz.findMany({
      where,
      orderBy: [
        { created_at: "desc" },
        { id: "desc" },
      ],
      take: fetchLimit,
      skip: offset,
    });

    const hasMore = quizzes.length > limit;
    const items = hasMore ? quizzes.slice(0, limit) : quizzes;
    const nextOffset = offset + items.length;

    res.json({ items, hasMore, nextOffset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /quizzes/{slug}/questions:
 *   get:
 *     summary: Get questions for a quiz
 *     tags:
 *       - Quizzes
 *     parameters:
 *       - name: slug
 *         in: path
 *         description: Unique slug of the quiz
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Array of quiz questions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Question"
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.get("/:slug/questions", async (req, res) => {
  const { slug } = req.params;
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { slug },
      select: { id: true, category: true, title: true },
    });

    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const questions = await prisma.question.findMany({
      where: { quiz_id: quiz.id },
      orderBy: { id: "asc" },
      select: {
        id: true,
        question_text: true,
        options: true,
        correct_option: true,
        explanation: true,
      },
    });

    const payload = questions.map((row) => ({
      ...row,
      category: quiz.category || null,
      quiz_title: quiz.title || null,
    }));

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /quizzes/{slug}/leaderboard:
 *   get:
 *     summary: Get leaderboard entries for a quiz
 *     tags:
 *       - Leaderboard
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Top leaderboard entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/LeaderboardEntry"
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.get("/:slug/leaderboard", async (req, res) => {
  const { slug } = req.params;
  try {
    const quiz = await prisma.quiz.findUnique({ where: { slug }, select: { id: true } });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    const leaderboard = await prisma.leaderboard.findMany({
      where: { quiz_id: quiz.id },
      orderBy: [
        { score: "desc" },
        { completion_time_seconds: "asc" },
      ],
      take: 10,
      select: {
        username: true,
        score: true,
        completion_time_seconds: true,
        created_at: true,
      },
    });

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /quizzes/{slug}/leaderboard:
 *   post:
 *     summary: Submit a leaderboard entry for a quiz
 *     tags:
 *       - Leaderboard
 *     parameters:
 *       - name: slug
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Leaderboard entry payload
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - score
 *               - completion_time_seconds
 *             properties:
 *               username:
 *                 type: string
 *               score:
 *                 type: integer
 *               completion_time_seconds:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Updated leaderboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 leaderboard:
 *                   type: array
 *                   items:
 *                     $ref: "#/components/schemas/LeaderboardEntry"
 *       400:
 *         description: Missing required fields
 *       404:
 *         description: Quiz not found
 *       500:
 *         description: Internal server error
 */
router.post("/:slug/leaderboard", async (req, res) => {
  const { slug } = req.params;
  const { username, score, completion_time_seconds } = req.body;
  if (!username || score == null || completion_time_seconds == null) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const quiz = await prisma.quiz.findUnique({ where: { slug }, select: { id: true } });
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });

    await prisma.leaderboard.create({
      data: {
        quiz_id: quiz.id,
        username,
        score,
        completion_time_seconds,
      },
    });

    const leaderboard = await prisma.leaderboard.findMany({
      where: { quiz_id: quiz.id },
      orderBy: [
        { score: "desc" },
        { completion_time_seconds: "asc" },
      ],
      take: 10,
      select: {
        username: true,
        score: true,
        completion_time_seconds: true,
        created_at: true,
      },
    });

    res.json({ success: true, leaderboard });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
