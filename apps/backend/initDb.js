const fs = require("fs");
const path = require("path");
const { pool } = require("./db");

async function initDatabase() {
  try {
    const sqlPath = path.join(__dirname, "db", "init.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");
    console.log("🧩 Running DB initialization script...");
    await pool.query(sql);
    console.log("✅ Database initialized and seeded successfully!");
  } catch (err) {
    console.error("❌ Error initializing database:", err);
  } finally {
    pool.end();
  }
}

initDatabase();
