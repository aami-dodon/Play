const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");

const { prisma } = require("../prismaClient");
const { createTemplateWorkbook, importQuizzesFromWorkbook } = require("../lib/quizExcel");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

function getProvidedPassword(req) {
  return req.header("x-admin-password") || (req.body && req.body.password);
}

function requireAdminPassword(req, res, next) {
  if (!ADMIN_PASSWORD) {
    return res.status(500).json({ error: "ADMIN_PASSWORD is not configured on the server." });
  }

  const provided = getProvidedPassword(req);
  if (!provided || provided !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid password." });
  }

  next();
}

router.post("/verify", requireAdminPassword, (_req, res) => {
  res.sendStatus(204);
});

router.get("/quiz-template", requireAdminPassword, async (_req, res) => {
  try {
    const workbook = createTemplateWorkbook();
    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="quiz-template.xlsx"; filename*=UTF-8\'\'quiz-template.xlsx',
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.send(buffer);
  } catch (error) {
    console.error("Failed to generate quiz template:", error);
    res.status(500).json({ error: "Could not create the quiz template." });
  }
});

router.post(
  "/quizzes/upload",
  requireAdminPassword,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Excel file is required." });
    }

    const force = req.body?.force;
    const truthyValues = new Set(["true", "1", "on"]);
    const forceOverwrite =
      typeof force === "string" ? truthyValues.has(force.toLowerCase()) : Boolean(force);

    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);

      const result = await importQuizzesFromWorkbook({
        workbook,
        prisma,
        forceOverwrite,
      });

      res.json({
        message: `Processed ${result.quizCount} quiz(es) with ${result.questionRows} question rows.`,
        result,
      });
    } catch (error) {
      console.error("Quiz import failed:", error);
      res.status(400).json({ error: error.message || "Quiz import failed." });
    }
  },
);

module.exports = router;
