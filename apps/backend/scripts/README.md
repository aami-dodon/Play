# Quiz Excel Tools

This folder now contains everything needed for admins to define a quiz in Excel and push it into the database.

## Files
- `quiz_template.xlsx` – ready-to-use template that mirrors the `Quiz` and `Question` Prisma models.
- `generateQuizTemplate.js` – regenerates the template in case headers or instructions change (`node scripts/generateQuizTemplate.js`).
- `importQuizFromExcel.js` – validates a filled template and uploads the quiz/questions into the database.

## Typical workflow
1. **Copy the template**: Duplicate `quiz_template.xlsx` and keep the original untouched for future quizzes.
2. **Fill the sheets**:
   - `Quiz` sheet expects a single row per quiz with `slug`, `title`, descriptions, labels, etc.
   - `Questions` sheet must list every question for the quiz, include at least two options (`option_1` … `option_6`), and set `correct_option` to match one of them.
3. **Validate before writing**:
   ```bash
   cd apps/backend
   node scripts/importQuizFromExcel.js ./scripts/my_new_quiz.xlsx --dry-run
   ```
   Fix any reported issues before proceeding.
4. **Upload to the DB**:
   ```bash
   cd apps/backend
   node scripts/importQuizFromExcel.js ./scripts/my_new_quiz.xlsx
   ```
   Add `--force` if you need to overwrite an existing quiz with the same slug (the script will replace every question for that slug).

> The importer loads `apps/backend/.env`, so ensure `DATABASE_URL` points at the database you want to modify before running it.
