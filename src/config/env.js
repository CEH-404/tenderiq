import dotenv from "dotenv";

dotenv.config();

const requiredVariables = [
  "NODE_ENV",
  "HEADLESS",
  "BROWSER"
];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Missing required environment variable: ${variable}`);
  }
}

const Environment = Object.freeze({
  nodeEnv: process.env.NODE_ENV,

  browser: process.env.BROWSER,

  headless: process.env.HEADLESS === "true",

  debug: process.env.DEBUG === "true",

  logLevel: process.env.LOG_LEVEL || "info",

  viewportWidth: Number(process.env.VIEWPORT_WIDTH || 1920),

  viewportHeight: Number(process.env.VIEWPORT_HEIGHT || 1080),

  timeout: Number(process.env.TIMEOUT || 30000)
});

export default Environment;