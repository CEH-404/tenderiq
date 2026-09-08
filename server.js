import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import logger from "./src/logger/Logger.js";

import scraperRoutes from "./routes/scraper.routes.js";

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Serve static public assets
app.use(express.static("public"));

// API routes
app.use("/api/scraper", scraperRoutes);

// Health check endpoint
// MUST NOT start a scraper, launch Playwright, or call Gemini
app.get("/health", (req, res) => {

    res.json({

        status: "ok",

        service: "tenderiq-scraper",

        timestamp: new Date().toISOString(),

        version: "1.0.0"

    });

});

// Catch-all 404
app.use((req, res) => {

    res.status(404).json({

        success: false,

        message: "Endpoint not found."

    });

});

// Start HTTP server only when run directly (not when imported by Vercel)
const PORT = Number(process.env.PORT) || 3000;

// ESM-compatible local start check.
// When run with `node server.js`, process.argv[1] is set to 'server.js'.
// When the module is imported (e.g., by Vercel), process.argv[1] is not 'server.js'.
if (process.argv[1] && process.argv[1].includes('server.js')) {

    app.listen(PORT, "0.0.0.0", () => {

        logger?.info(`Server running on port ${PORT}`);

        // Do NOT start the worker here in production.
        // The worker process should be started separately: node src/worker.js

    });

}

export default app;