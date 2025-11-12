const path = require("path");
const { config } = require("dotenv");

// Ensure every backend entrypoint loads the monorepo root .env file.
config({ path: path.resolve(__dirname, "..", "..", ".env"), override: false });
