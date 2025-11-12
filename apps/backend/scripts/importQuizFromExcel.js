#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");
require("../loadRootEnv");
const { PrismaClient } = require("@prisma/client");
const { importQuizzesFromWorkbook } = require("../lib/quizExcel");

const prisma = new PrismaClient();

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

  const importResult = await importQuizzesFromWorkbook({
    workbook,
    prisma,
    forceOverwrite: force,
    dryRun,
  });

  console.log(
    `✅ Validation passed for ${importResult.quizCount} quiz(es) and ${importResult.questionRows} question rows.`,
  );

  if (dryRun) {
    console.log("Dry run enabled; no database changes were made.");
    return;
  }

  for (const quizResult of importResult.results || []) {
    console.log(
      `${quizResult.replaced ? "🔁 Updated" : "➕ Created"} quiz "${quizResult.slug}" with ${quizResult.insertedQuestions} question(s).`,
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
