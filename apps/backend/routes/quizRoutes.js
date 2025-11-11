const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// 🧠 GET all quizzes
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM quizzes ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🧩 GET questions for a given quiz slug
router.get("/:slug/questions", async (req, res) => {
  const { slug } = req.params;
  try {
    const quiz = await pool.query("SELECT id FROM quizzes WHERE slug=$1", [slug]);
    if (quiz.rows.length === 0)
      return res.status(404).json({ error: "Quiz not found" });

    const quizId = quiz.rows[0].id;
    const result = await pool.query(
      "SELECT id, question_text, options, correct_option, explanation FROM questions WHERE quiz_id=$1 ORDER BY id ASC",
      [quizId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
