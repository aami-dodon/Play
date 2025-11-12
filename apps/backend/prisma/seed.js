require("../loadRootEnv");

const rawSeedValue = process.env.SEED ?? process.env.seed;
const normalizedSeedValue =
  typeof rawSeedValue === "string" ? rawSeedValue.trim().toLowerCase() : "";
const shouldSeed = normalizedSeedValue === "true";

if (!shouldSeed) {
  console.log("⚠️ Demo seeds skipped (set `seed=true` or `SEED=true`).");
  process.exit(0);
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const quizSeeds = [
  {
    slug: "db",
    title: "Database Quiz",
    description: "Test your knowledge of different database types and when to use them.",
    category: "Tech",
    difficulty: "Chill",
    featured: true,
    players_label: "2.1k online",
    streak_label: "13 wins",
  },
  {
    slug: "api-chaos",
    title: "API Chaos Mode",
    description: "The backend incidents nobody writes postmortems for.",
    category: "Backend",
    difficulty: "Chaotic",
    featured: true,
    players_label: "1.1k online",
    streak_label: "9 wins",
  },
  {
    slug: "ops-meltdown",
    title: "Ops Meltdown Bingo",
    description: "Predict which service page goes down first.",
    category: "DevOps",
    difficulty: "Spicy",
    featured: false,
    players_label: "648 online",
    streak_label: "6 wins",
  },
  {
    slug: "latency-legends",
    title: "Latency Legends",
    description: "Keep p95 low while everything else is on fire.",
    category: "Performance",
    difficulty: "Chaotic",
    featured: true,
    players_label: "742 online",
    streak_label: "4 wins",
  },
];

const questionSeeds = {
  db: [
    {
      question_text: "Which database is best for storing and querying highly connected data (e.g. social networks)?",
      options: ["Graph DB", "Document DB", "Relational DB", "Key-Value Store"],
      correct_option: "Graph DB",
      explanation: "Graph databases (like Neo4j, TigerGraph) are designed for traversing relationships.",
    },
    {
      question_text: "Which database type excels at flexible JSON-like documents with varying fields?",
      options: ["Relational DB", "Document DB", "Vector DB", "Time-Series DB"],
      correct_option: "Document DB",
      explanation: "Document databases (like MongoDB, Couchbase) are schema-flexible and great for semi-structured data.",
    },
    {
      question_text: "Which type is optimized for storing embeddings and performing semantic similarity search?",
      options: ["Vector DB", "Relational DB", "Graph DB", "Search Engine"],
      correct_option: "Vector DB",
      explanation: "Vector databases (like Pinecone, Weaviate) are used for AI and semantic search.",
    },
    {
      question_text: "Which database type is best for structured, transactional data with ACID guarantees?",
      options: ["Relational DB", "Document DB", "Key-Value Store", "Graph DB"],
      correct_option: "Relational DB",
      explanation: "Relational databases (like PostgreSQL, MySQL) enforce schema and ensure strong transactional integrity.",
    },
  ],
  "api-chaos": [
    {
      question_text: "Your API is returning 200s but clients see failures. First suspect?",
      options: ["Caching layer", "DNS", "Frontend bundle", "Database"],
      correct_option: "Caching layer",
      explanation: "A stale or poisoned cache silently serves outdated error payloads.",
    },
    {
      question_text: "Which header do you inspect to confirm a request survived a gateway?",
      options: ["X-Request-ID", "Retry-After", "Authorization", "Accept-Encoding"],
      correct_option: "X-Request-ID",
      explanation: "Trace IDs verify the hop trail across gateways.",
    },
    {
      question_text: "You need to roll out a breaking change without downtime. What pattern saves you?",
      options: ["Blue/green deploy", "Single server deploy", "Manual hotfix", "Fail fast"],
      correct_option: "Blue/green deploy",
      explanation: "Blue/green keeps two production environments so you can flip traffic safely.",
    },
  ],
  "ops-meltdown": [
    {
      question_text: "Pods keep crash-looping after deploy. What do you check first?",
      options: ["Probe config", "CDN logs", "Feature flags", "Favicon"],
      correct_option: "Probe config",
      explanation: "Bad readiness probes are the fastest path to crash-loop limbo.",
    },
    {
      question_text: "Pager goes off at 3 AM. Which dashboard loads first?",
      options: ["Infrastructure latency", "Signup conversion", "Incident retro", "Daily active users"],
      correct_option: "Infrastructure latency",
      explanation: "You start where the smoke is thickest: infra health.",
    },
    {
      question_text: "How do you calm a noisy alert that keeps flapping?",
      options: ["Tune thresholds", "Restart cluster", "Ignore it", "Add more dashboards"],
      correct_option: "Tune thresholds",
      explanation: "Alerts should be actionable; recalibrating beats alert fatigue.",
    },
  ],
  "latency-legends": [
    {
      question_text: "Which metric screams user pain before anything else?",
      options: ["p95 latency", "Average CPU", "Disk usage", "Cron duration"],
      correct_option: "p95 latency",
      explanation: "High percentiles show the slow tail that users actually feel.",
    },
    {
      question_text: "What is the quickest band-aid for a slow query during peak traffic?",
      options: ["Add an index", "Rewrite schema", "Full vacuum", "New microservice"],
      correct_option: "Add an index",
      explanation: "Indexes are the pragmatic quick win before heroic rewrites.",
    },
    {
      question_text: "You suspect GC pauses are killing throughput. What do you inspect?",
      options: ["Heap profiles", "Load balancer", "Dark mode", "API version"],
      correct_option: "Heap profiles",
      explanation: "GC tuning starts with understanding memory pressure and heap churn.",
    },
  ],
};

const leaderboardSeeds = [
  { slug: "db", username: "PixelBandit", completion_time_seconds: 36, score: 4800 },
  { slug: "api-chaos", username: "PixelBandit", completion_time_seconds: 33, score: 5200 },
  { slug: "latency-legends", username: "LagWizard", completion_time_seconds: 39, score: 4650 },
  { slug: "api-chaos", username: "LagWizard", completion_time_seconds: 41, score: 4825 },
  { slug: "db", username: "TriviaGoblin", completion_time_seconds: 55, score: 4300 },
  { slug: "ops-meltdown", username: "TriviaGoblin", completion_time_seconds: 62, score: 4100 },
  { slug: "ops-meltdown", username: "GlitchQueen", completion_time_seconds: 44, score: 5050 },
  { slug: "latency-legends", username: "GlitchQueen", completion_time_seconds: 40, score: 4950 },
  { slug: "api-chaos", username: "ByteKnight", completion_time_seconds: 37, score: 4500 },
  { slug: "db", username: "ByteKnight", completion_time_seconds: 42, score: 4425 },
  { slug: "latency-legends", username: "StackSage", completion_time_seconds: 38, score: 4320 },
  { slug: "api-chaos", username: "StackSage", completion_time_seconds: 40, score: 4150 },
  { slug: "ops-meltdown", username: "QueryNinja", completion_time_seconds: 48, score: 4000 },
  { slug: "db", username: "QueryNinja", completion_time_seconds: 52, score: 4050 },
  { slug: "latency-legends", username: "LatencyLord", completion_time_seconds: 35, score: 4380 },
];

async function main() {
  const quizMap = {};

  for (const quiz of quizSeeds) {
    const record = await prisma.quiz.upsert({
      where: { slug: quiz.slug },
      update: quiz,
      create: quiz,
    });
    quizMap[quiz.slug] = record;
  }

  for (const [slug, questions] of Object.entries(questionSeeds)) {
    const quiz = quizMap[slug];
    if (!quiz) continue;

    for (const question of questions) {
      await prisma.question.upsert({
        where: {
          question_quiz_id_question_text_key: {
            quiz_id: quiz.id,
            question_text: question.question_text,
          },
        },
        update: {
          options: question.options,
          correct_option: question.correct_option,
          explanation: question.explanation,
        },
        create: {
          quiz_id: quiz.id,
          ...question,
        },
      });
    }
  }

  for (const entry of leaderboardSeeds) {
    const quiz = quizMap[entry.slug];
    if (!quiz) continue;

    const existing = await prisma.leaderboard.findFirst({
      where: {
        quiz_id: quiz.id,
        username: entry.username,
        completion_time_seconds: entry.completion_time_seconds,
        score: entry.score,
      },
    });

    if (!existing) {
      await prisma.leaderboard.create({
        data: {
          quiz_id: quiz.id,
          username: entry.username,
          completion_time_seconds: entry.completion_time_seconds,
          score: entry.score,
        },
      });
    }
  }

  console.log("✅ Seeds applied");
}

main()
  .catch((error) => {
    console.error("❌ Unable to seed database", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
