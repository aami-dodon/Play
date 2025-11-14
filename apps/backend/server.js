require("./loadRootEnv");
const path = require("path");
const express = require("express");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { testConnection } = require("./prismaClient");
const quizRoutes = require("./routes/quizRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");
const adminRoutes = require("./routes/adminRoutes");
const arcadeRoutes = require("./routes/arcadeRoutes");
const snakeRoutes = require("./features/snake/snakeRoutes");
const chaosRoutes = require("./features/chaos/chaosRoutes");

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 3000;
const API_PREFIX = "/api";

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

const swaggerOptions = {
  definition: {
    openapi: "3.0.1",
    info: {
      title: "Play Dodon API",
      version: "1.0.0",
      description: "Backend for the Play Dodon quiz experience",
    },
    servers: [{ url: API_PREFIX }],
  },
  apis: [
    path.join(__dirname, "server.js"),
    path.join(__dirname, "routes/*.js"),
    path.join(__dirname, "features/snake/*.js"),
    path.join(__dirname, "features/chaos/*.js"),
  ],
};

const swaggerSpec = swaggerJsDoc(swaggerOptions);

app.use(
  `${API_PREFIX}/docs`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { explorer: true })
);

const apiRouter = express.Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: OK
 */
apiRouter.get("/health", (req, res) => res.send("OK"));

// Mount quiz routes under /api/quizzes
apiRouter.use("/quizzes", quizRoutes);
apiRouter.use("/leaderboard", leaderboardRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/arcades", arcadeRoutes);
apiRouter.use("/games/snake", snakeRoutes);
apiRouter.use("/games/chaos", chaosRoutes);

app.use(API_PREFIX, apiRouter);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is listening on http://localhost:${PORT}${API_PREFIX}`);
  testConnection();
});
