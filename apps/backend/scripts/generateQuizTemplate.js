const path = require("path");
const fs = require("fs");
const ExcelJS = require("exceljs");

const OUTPUT_FILENAME = "quiz_template.xlsx";
const OUTPUT_PATH = path.join(__dirname, OUTPUT_FILENAME);

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

async function createTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Quiz CLI";
  workbook.created = new Date();

  const instructions = workbook.addWorksheet("Instructions");
  instructions.addRow(["Quiz Excel Template"]);
  instructions.addRow([""]);
  instructions.addRow([
    "1. Fill out the 'Quiz' sheet with a single quiz definition (all columns required unless noted).",
  ]);
  instructions.addRow([
    "2. Add one or more rows to the 'Questions' sheet. Each row must reference a quiz slug and have at least two options.",
  ]);
  instructions.addRow([
    "3. Save the file as a copy (do not overwrite this template) before running the importer.",
  ]);
  instructions.addRow([
    "4. Run `node scripts/importQuizFromExcel.js path/to/your.xlsx` from apps/backend to validate and upload.",
  ]);

  const quizSheet = workbook.addWorksheet("Quiz");
  quizSheet.addRow(QUIZ_HEADERS);
  quizSheet.addRow([
    "ops-masterclass",
    "Ops Masterclass",
    "Keep prod online while everything else burns.",
    "DevOps",
    "Chaotic",
    "TRUE",
    "1.2k online",
    "7 wins",
  ]);

  const questionSheet = workbook.addWorksheet("Questions");
  questionSheet.addRow(QUESTION_HEADERS);
  questionSheet.addRow([
    "ops-masterclass",
    "What is your first move when an alert storms in?",
    "Check dashboards",
    "Always observe before changing anything.",
    "Check dashboards",
    "Restart servers",
    "Blame DNS",
    "Update roadmap",
    "",
    "",
  ]);

  await workbook.xlsx.writeFile(OUTPUT_PATH);
  console.log(`✅ Template written to ${OUTPUT_PATH}`);
}

async function main() {
  if (fs.existsSync(OUTPUT_PATH)) {
    console.log(`ℹ️ Overwriting existing template at ${OUTPUT_PATH}`);
  }

  try {
    await createTemplate();
  } catch (error) {
    console.error("❌ Unable to create template", error);
    process.exitCode = 1;
  }
}

main();
