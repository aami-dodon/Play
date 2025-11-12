#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env"), override: false });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const QUIZ_HEADERS = [
  "slug",
  "title",
  "description",
  "category",
  "difficulty",
  "featured",
  "players_label",
  "streak_label",
];

const QUESTION_HEADERS = [
  "quiz_slug",
  "question_text",
  "correct_option",
  "explanation",
  "option_1",
  "option_2",
  "option_3",
  "option_4",
  "option_5",
  "option_6",
];

const OPTION_HEADERS = QUESTION_HEADERS.slice(4);
const REQUIRED_QUIZ_FIELDS = ["slug", "title"];
const REQUIRED_QUESTION_FIELDS = ["question_text", "correct_option"];
const ALLOWED_DIFFICULTIES = new Set(["Chill", "Spicy", "Chaotic"]);

function normalizeCellValue(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === "object") {
    if (value.text) {
      return String(value.text).trim();
    }
    if (Array.isArray(value.richText)) {
      return value.richText.map((segment) => segment.text).join("").trim();
    }
    if (value.result !== undefined) {
      return normalizeCellValue(value.result);
    }
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : null;
  }

  return value;
}

function normalizeHeader(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function readSheetRecords(workbook, sheetName, expectedHeaders) {
  const worksheet = workbook.getWorksheet(sheetName);
  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" is missing from the Excel file.`);
  }

  const headerRow = worksheet.getRow(1);
  if (!headerRow || headerRow.cellCount === 0) {
    throw new Error(`Sheet "${sheetName}" is missing header cells.`);
  }

  const normalizedHeaders = headerRow.values.slice(1).map(normalizeHeader);
  if (
    normalizedHeaders.length !== expectedHeaders.length ||
    normalizedHeaders.some((header, idx) => header !== expectedHeaders[idx])
  ) {
    throw new Error(
      `Sheet "${sheetName}" headers do not match the template. Expected "${expectedHeaders.join(
        ", ",
      )}" but found "${normalizedHeaders.join(", ")}".`,
    );
  }

  const records = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;

    const record = {};
    let hasData = false;

    expectedHeaders.forEach((header, idx) => {
      const cellValue = normalizeCellValue(row.getCell(idx + 1).value);
      if (cellValue !== null && cellValue !== "") {
        hasData = true;
      }
      record[header] = cellValue;
    });

    if (hasData) {
      record.__rowNumber = rowNumber;
      records.push(record);
    }
  });

  if (!records.length) {
    throw new Error(`Sheet "${sheetName}" does not contain any data rows.`);
  }

  return records;
}

function requireField(record, field, sheetName) {
  const value = record[field];
  if (value === undefined || value === null || value === "") {
    throw new Error(
      `[${sheetName} row ${record.__rowNumber}] "${field}" is required but missing.`,
    );
  }
  return value;
}

function normalizeBoolean(value, { sheetName, rowNumber, field, defaultValue = false }) {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  const normalized = value.toString().trim().toLowerCase();
  if (["true", "yes", "y", "1"].includes(normalized)) return true;
  if (["false", "no", "n", "0"].includes(normalized)) return false;

  throw new Error(
    `[${sheetName} row ${rowNumber}] "${field}" must be a boolean value (true/false).`,
  );
}

function normalizeString(value) {
  if (value === null || value === undefined) return null;
  const str = value.toString().trim();
  return str.length ? str : null;
}

function validateSlug(slug, rowNumber) {
  const normalized = slug.toString().trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new Error(
      `[Quiz row ${rowNumber}] "slug" must be lowercase letters/numbers separated with hyphens.`,
    );
  }
  return normalized;
}

function normalizeDifficulty(value, rowNumber) {
  if (!value) {
    return "Spicy";
  }

  const raw =
    typeof value === "string"
      ? value.trim()
      : value.toString().trim();

  if (!raw) {
    return "Spicy";
  }

  const canonical = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();

  if (!ALLOWED_DIFFICULTIES.has(canonical)) {
    throw new Error(
      `[Quiz row ${rowNumber}] "difficulty" must be one of ${Array.from(ALLOWED_DIFFICULTIES).join(
        ", ",
      )}.`,
    );
  }

  return canonical;
}

function processQuizSheet(records) {
  const quizzes = [];
  const encountered = new Set();

  for (const record of records) {
    for (const field of REQUIRED_QUIZ_FIELDS) {
      requireField(record, field, "Quiz");
    }

    const slug = validateSlug(record.slug, record.__rowNumber);
    if (encountered.has(slug)) {
      throw new Error(`[Quiz row ${record.__rowNumber}] Duplicate slug "${slug}" detected.`);
    }
    encountered.add(slug);

    const featured = normalizeBoolean(record.featured, {
      sheetName: "Quiz",
      rowNumber: record.__rowNumber,
      field: "featured",
      defaultValue: false,
    });

    const quiz = {
      slug,
      title: record.title.toString().trim(),
      description: normalizeString(record.description),
      category: normalizeString(record.category),
      difficulty: normalizeDifficulty(record.difficulty, record.__rowNumber),
      featured,
      players_label: normalizeString(record.players_label),
      streak_label: normalizeString(record.streak_label),
      __rowNumber: record.__rowNumber,
    };

    quizzes.push(quiz);
  }

  return quizzes;
}

function processQuestionSheet(records, quizzes) {
  const quizSlugs = new Set(quizzes.map((quiz) => quiz.slug));
  const singleSlug = quizzes.length === 1 ? quizzes[0].slug : null;
  const questionMap = new Map();
  const duplicateCheck = new Set();

  for (const record of records) {
    for (const field of REQUIRED_QUESTION_FIELDS) {
      requireField(record, field, "Questions");
    }

    const slugCandidate = normalizeString(record.quiz_slug) || singleSlug;
    if (!slugCandidate) {
      throw new Error(
        `[Questions row ${record.__rowNumber}] "quiz_slug" is required when uploading multiple quizzes.`,
      );
    }

    if (!quizSlugs.has(slugCandidate)) {
      throw new Error(
        `[Questions row ${record.__rowNumber}] Unknown quiz_slug "${slugCandidate}". It must match a slug from the Quiz sheet.`,
      );
    }

    const questionText = record.question_text.toString().trim();
    const explanation = normalizeString(record.explanation);
    const options = OPTION_HEADERS.map((header) => normalizeString(record[header])).filter(
      (value) => value !== null,
    );

    if (options.length < 2) {
      throw new Error(
        `[Questions row ${record.__rowNumber}] Each question must provide at least two options.`,
      );
    }

    const correctOption = record.correct_option.toString().trim();
    if (!options.includes(correctOption)) {
      throw new Error(
        `[Questions row ${record.__rowNumber}] "correct_option" must exactly match one of the option_* values.`,
      );
    }

    const duplicateKey = `${slugCandidate}::${questionText.toLowerCase()}`;
    if (duplicateCheck.has(duplicateKey)) {
      throw new Error(
        `[Questions row ${record.__rowNumber}] Duplicate question_text "${questionText}" for quiz "${slugCandidate}".`,
      );
    }
    duplicateCheck.add(duplicateKey);

    const questionEntry = {
      quiz_slug: slugCandidate,
      question_text: questionText,
      options,
      correct_option: correctOption,
      explanation,
      __rowNumber: record.__rowNumber,
    };

    if (!questionMap.has(slugCandidate)) {
      questionMap.set(slugCandidate, []);
    }
    questionMap.get(slugCandidate).push(questionEntry);
  }

  for (const quiz of quizzes) {
    if (!questionMap.has(quiz.slug)) {
      throw new Error(`Quiz "${quiz.slug}" does not have any questions assigned in the Questions sheet.`);
    }
  }

  return questionMap;
}

async function upsertQuizWithQuestions({ quiz, questions, forceOverwrite }) {
  const existing = await prisma.quiz.findUnique({
    where: { slug: quiz.slug },
    include: { questions: true },
  });

  if (existing && !forceOverwrite) {
    throw new Error(`Quiz "${quiz.slug}" already exists. Re-run with --force to overwrite.`);
  }

  return prisma.$transaction(async (tx) => {
    let quizRecord;
    if (existing) {
      quizRecord = await tx.quiz.update({
        where: { slug: quiz.slug },
        data: {
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty,
          featured: quiz.featured,
          players_label: quiz.players_label,
          streak_label: quiz.streak_label,
        },
      });
      await tx.question.deleteMany({ where: { quiz_id: quizRecord.id } });
    } else {
      quizRecord = await tx.quiz.create({
        data: {
          slug: quiz.slug,
          title: quiz.title,
          description: quiz.description,
          category: quiz.category,
          difficulty: quiz.difficulty,
          featured: quiz.featured,
          players_label: quiz.players_label,
          streak_label: quiz.streak_label,
        },
      });
    }

    for (const question of questions) {
      await tx.question.create({
        data: {
          quiz_id: quizRecord.id,
          question_text: question.question_text,
          options: question.options,
          correct_option: question.correct_option,
          explanation: question.explanation,
        },
      });
    }

    return { quiz: quizRecord, insertedQuestions: questions.length, replaced: Boolean(existing) };
  });
}

function parseArgs() {
  const rawArgs = process.argv.slice(2);
  if (!rawArgs.length) {
    console.error("Usage: node scripts/importQuizFromExcel.js <path-to-excel> [--force] [--dry-run]");
    process.exit(1);
  }

  let filePath = null;
  const flags = new Set();

  for (const arg of rawArgs) {
    if (arg.startsWith("--")) {
      flags.add(arg);
    } else if (!filePath) {
      filePath = arg;
    }
  }

  if (!filePath) {
    console.error("You must provide a path to the Excel file.");
    process.exit(1);
  }

  return {
    filePath: path.resolve(process.cwd(), filePath),
    force: flags.has("--force"),
    dryRun: flags.has("--dry-run"),
  };
}

async function main() {
  const { filePath, force, dryRun } = parseArgs();
  if (!fs.existsSync(filePath)) {
    console.error(`File "${filePath}" does not exist.`);
    process.exit(1);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const rawQuizzes = readSheetRecords(workbook, "Quiz", QUIZ_HEADERS);
  const rawQuestions = readSheetRecords(workbook, "Questions", QUESTION_HEADERS);

  const quizzes = processQuizSheet(rawQuizzes);
  const questionMap = processQuestionSheet(rawQuestions, quizzes);

  console.log(`✅ Validation passed for ${quizzes.length} quiz(es) and ${rawQuestions.length} question rows.`);

  if (dryRun) {
    console.log("Dry run enabled; no database changes were made.");
    await prisma.$disconnect();
    return;
  }

  for (const quiz of quizzes) {
    const result = await upsertQuizWithQuestions({
      quiz,
      questions: questionMap.get(quiz.slug),
      forceOverwrite: force,
    });

    console.log(
      `${result.replaced ? "🔁 Updated" : "➕ Created"} quiz "${quiz.slug}" with ${result.insertedQuestions} question(s).`,
    );
  }
}

main()
  .catch((error) => {
    console.error("❌ Import failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
