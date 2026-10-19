import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Root endpoint — required for Railway health check
app.get("/", (req, res) => {

    res.status(200).json({ status: "ok" });

});

// Health check endpoint ONLY — absolutely no scraper, Chromium, AI, or database
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

// Start HTTP server only when run directly (not when imported)
const PORT = Number(process.env.PORT) || 3000;

if (process.argv[1] && process.argv[1].includes('server-health.mjs')) {

    app.listen(PORT, "0.0.0.0", () => {

        // Minimal startup log — no browser, no AI, no scraper activity
        console.log(`Server running on port ${PORT}`);

    });

}

export default app;