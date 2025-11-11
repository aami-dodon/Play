require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { testConnection } = require("./db");
const quizRoutes = require("./routes/quizRoutes");

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3000;
const defaultAllowedHosts = ["localhost", "127.0.0.1"];
const envAllowedHosts = (process.env.CLIENT_ALLOWED_HOSTS || "")
  .split(",")
  .map((host) => host.trim())
  .filter(Boolean);
const allowedHosts = envAllowedHosts.length ? envAllowedHosts : defaultAllowedHosts;

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const matches = allowedHosts.some((host) => origin.includes(host));
    callback(matches ? null : new Error("Not allowed by CORS"), matches);
  },
};

app.use(cors(corsOptions));
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
