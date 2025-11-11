const express = require("express");
const cors = require("cors");
const { testConnection } = require("./db");
const quizRoutes = require("./routes/quizRoutes");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Health route
app.get("/health", (req, res) => res.send("OK"));

// Mount quiz routes under /api/quizzes
app.use("/api/quizzes", quizRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is listening on http://localhost:${PORT}`);
  testConnection();
});
