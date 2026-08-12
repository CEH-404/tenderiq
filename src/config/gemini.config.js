import dotenv from "dotenv";

import GeminiProvider from "../intelligence/providers/GeminiProvider.js";
import GeminiModelRouter from "../intelligence/providers/GeminiModelRouter.js";
import logger from "../logger/logger.js";

dotenv.config();

const {

    GEMINI_API_KEY,

    // Chain, in priority order. Comma-separate multiple fallback models.
    GEMINI_MODEL_PRIMARY = "gemini-3-flash-preview",

    GEMINI_MODEL_FALLBACK = "gemini-2.5-flash,gemini-3.5-flash",

    GEMINI_MODEL_EMERGENCY = "gemini-3.5-flash-lite",

    GEMINI_TEMPERATURE = "0.2",

    GEMINI_MAX_OUTPUT_TOKENS = "65536",

    GEMINI_TIMEOUT = "300",

    GEMINI_MAX_RETRIES = "3",

    GEMINI_BATCH_SIZE

} = process.env;

if (!GEMINI_API_KEY) {

    throw new Error(
        "GEMINI_API_KEY is missing in the environment variables."
    );

}

// RPM / TPM / RPD budget per model, as issued for this API key.
const MODEL_LIMITS = {

    "gemini-3-flash-preview": { rpm: 5, tpm: 250000, rpd: 20 },

    "gemini-3.5-flash": { rpm: 5, tpm: 250000, rpd: 20 },

    "gemini-2.5-flash": { rpm: 5, tpm: 250000, rpd: 20 },

    "gemini-3.6-flash": { rpm: 5, tpm: 250000, rpd: 20 },

    "gemini-3.5-flash-lite": { rpm: 15, tpm: 250000, rpd: 500 },

    "gemini-3.1-flash-lite": { rpm: 15, tpm: 250000, rpd: 500 }

};

// This key's quota on gemini-3.6-flash is already exhausted — never route
// to it, even if it's left in the .env configuration.
const BLOCKED_MODELS = new Set([
    "gemini-3.6-flash"
]);

const geminiConfig = {

    apiKey: GEMINI_API_KEY,

    temperature: Number(GEMINI_TEMPERATURE),

    maxOutputTokens: Number(GEMINI_MAX_OUTPUT_TOKENS),

    timeout: Number(GEMINI_TIMEOUT),

    maxRetries: Number(GEMINI_MAX_RETRIES),

    batchSize:
        GEMINI_BATCH_SIZE
            ? Number(GEMINI_BATCH_SIZE)
            : undefined

};

function parseList(value) {

    return String(value || "")
        .split(",")
        .map(entry => entry.trim())
        .filter(Boolean);

}

const requestedChain = [

    GEMINI_MODEL_PRIMARY,

    ...parseList(GEMINI_MODEL_FALLBACK),

    GEMINI_MODEL_EMERGENCY

].filter(Boolean);

const chain = [];
const seen = new Set();

for (const modelName of requestedChain) {

    if (seen.has(modelName)) continue;
    seen.add(modelName);

    if (BLOCKED_MODELS.has(modelName)) {

        logger.warning(
            `Gemini model "${modelName}" is blocked (quota exhausted) — ` +
            "removed from the routing chain."
        );

        continue;

    }

    chain.push({

        name: modelName,

        limits:
            MODEL_LIMITS[modelName] ||
            { rpm: 5, tpm: 250000, rpd: 20 }, // conservative default for an unlisted model

        provider: new GeminiProvider(
            geminiConfig.apiKey,
            modelName,
            geminiConfig
        )

    });

}

if (chain.length === 0) {

    throw new Error(
        "No usable Gemini models configured — every entry in the routing " +
        "chain was blocked or empty."
    );

}

logger.info(
    `Gemini routing chain: ${chain.map(m => m.name).join(" -> ")}`
);

const geminiProvider =
    new GeminiModelRouter(
        chain,
        { maxOutputTokens: geminiConfig.maxOutputTokens }
    );

export {

    geminiConfig,

    MODEL_LIMITS,

    BLOCKED_MODELS

};

export default geminiProvider;