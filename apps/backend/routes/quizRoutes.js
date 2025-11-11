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
const { pool } = require("../db");

/**
 * @openapi
 * /quizzes:
 *   get:
 *     summary: List all quizzes
 *     tags:
 *       - Quizzes
 *     responses:
 *       200:
 *         description: Array of quizzes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Quiz"
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
 */

// 🧠 GET all quizzes
router.get("/", async (req, res) => {
  try {
    const { category, featured } = req.query;
    const filters = [];
    const values = [];

    if (category) {
      values.push(category);
      filters.push(`LOWER(category) = LOWER($${values.length})`);
    }

    if (featured === "true" || featured === "false" || featured === "1" || featured === "0") {
      const flag = featured === "true" || featured === "1";
      values.push(flag);
      filters.push(`featured = $${values.length}`);
    }

    let query = "SELECT * FROM quizzes";
    if (filters.length) {
      query += ` WHERE ${filters.join(" AND ")}`;
    }
    query += " ORDER BY created_at DESC, id DESC";

    const result = await pool.query(query, values);
    res.json(result.rows);
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
// 🧩 GET questions for a given quiz slug
router.get("/:slug/questions", async (req, res) => {
  const { slug } = req.params;
  try {
    const quiz = await pool.query("SELECT id, title, category FROM quizzes WHERE slug=$1", [slug]);
    if (quiz.rows.length === 0)
      return res.status(404).json({ error: "Quiz not found" });

    const quizId = quiz.rows[0].id;
    const quizCategory = quiz.rows[0].category || null;
    const quizTitle = quiz.rows[0].title || null;
    const result = await pool.query(
      "SELECT id, question_text, options, correct_option, explanation FROM questions WHERE quiz_id=$1 ORDER BY id ASC",
      [quizId]
    );
    const payload = result.rows.map((row) => ({
      ...row,
      category: row.category || quizCategory,
      quiz_title: row.quiz_title || quizTitle,
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
// 🏁 GET leaderboard for a quiz
router.get("/:slug/leaderboard", async (req, res) => {
  const { slug } = req.params;
  try {
    const quiz = await pool.query("SELECT id FROM quizzes WHERE slug=$1", [slug]);
    if (quiz.rows.length === 0)
      return res.status(404).json({ error: "Quiz not found" });

    const quizId = quiz.rows[0].id;
    const result = await pool.query(
      `SELECT username, score, completion_time_seconds, created_at
       FROM leaderboard
       WHERE quiz_id=$1
       ORDER BY score DESC, completion_time_seconds ASC
       LIMIT 10`,
      [quizId]
    );
    res.json(result.rows);
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
// 🧾 POST new leaderboard entry
router.post("/:slug/leaderboard", async (req, res) => {
  const { slug } = req.params;
  const { username, score, completion_time_seconds } = req.body;
  if (!username || score == null || completion_time_seconds == null)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    const quiz = await pool.query("SELECT id FROM quizzes WHERE slug=$1", [slug]);
    if (quiz.rows.length === 0)
      return res.status(404).json({ error: "Quiz not found" });

    const quizId = quiz.rows[0].id;
    await pool.query(
      `INSERT INTO leaderboard (quiz_id, username, score, completion_time_seconds)
       VALUES ($1,$2,$3,$4)`,
      [quizId, username, score, completion_time_seconds]
    );

    // Return updated top 10 leaderboard
    const result = await pool.query(
      `SELECT username, score, completion_time_seconds, created_at
       FROM leaderboard
       WHERE quiz_id=$1
       ORDER BY score DESC, completion_time_seconds ASC
       LIMIT 10`,
      [quizId]
    );
    res.json({ success: true, leaderboard: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
