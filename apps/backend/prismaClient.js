require("./loadRootEnv");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testConnection() {
  try {
    const [result] = await prisma.$queryRaw`SELECT NOW() AS now`;
    console.log("🗄️  Connected to Postgres at:", result?.now);
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
}

module.exports = { prisma, testConnection };
