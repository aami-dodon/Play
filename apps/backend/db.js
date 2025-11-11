const { Pool } = require("pg");
require("dotenv").config({ quiet: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("🗄️  Connected to Postgres at:", result.rows[0].now);
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
}

module.exports = { pool, testConnection };
