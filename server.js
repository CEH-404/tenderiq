import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import Framework from "./src/core/Framework.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const OUTPUT_DIR = path.join(__dirname, "output");
const OUTPUTS_DIR = path.join(__dirname, "outputs");
const EXCEL_PATH = path.join(OUTPUTS_DIR, "procurement.xlsx");

let scrapeInProgress = false;

function validateScrapeInput(body) {

    const errors = {};

    const url = typeof body.url === "string" ? body.url.trim() : "";

    if (!url) {
        errors.url = "Website URL is required.";
    } else if (!/^https?:\/\/.+/i.test(url)) {
        errors.url = "Enter a valid URL starting with http:// or https://";
    }

    const timeout = Number(
        body.timeout === "" || body.timeout === undefined || body.timeout === null
            ? 30000
            : body.timeout
    );

    if (!Number.isFinite(timeout) || timeout <= 0) {
        errors.timeout = "Timeout must be greater than 0.";
    }

    const maxPages = Number(body.maxPages);

    if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 500) {
        errors.maxPages = "Maximum pages must be a whole number between 1 and 500.";
    }

    const maxDepth = Number(body.maxDepth);

    if (!Number.isInteger(maxDepth) || maxDepth < 0 || maxDepth > 10) {
        errors.maxDepth = "Crawl depth must be a whole number between 0 and 10.";
    }

    return {
        valid: Object.keys(errors).length === 0,
        errors,
        values: { url, timeout, maxPages, maxDepth }
    };

}

app.post("/api/scrape", async (req, res) => {

    const { valid, errors, values } = validateScrapeInput(req.body || {});

    if (!valid) {
        return res.status(400).json({ success: false, errors });
    }

    if (scrapeInProgress) {
        return res.status(409).json({
            success: false,
            errors: { form: "A scrape is already running. Please wait for it to finish." }
        });
    }

    scrapeInProgress = true;

    const framework = new Framework();

    try {

        await framework.initialize();

        const result = await framework.crawl(values);

        res.json({
            success: true,
            stats: result.stats,
            pagesScraped: result.pages?.length || 0,
            jsonFilename: result.export?.jsonFilename || null,
            excelAvailable: fs.existsSync(EXCEL_PATH)
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            errors: { form: error.message || "Scrape failed." }
        });

    } finally {

        await framework.shutdown().catch(() => {});

        scrapeInProgress = false;

    }

});

app.get("/api/download/excel", (req, res) => {

    if (!fs.existsSync(EXCEL_PATH)) {
        return res.status(404).json({ success: false, error: "No Excel export available yet." });
    }

    res.download(EXCEL_PATH, "procurement.xlsx");

});

app.get("/api/download/json/:filename", (req, res) => {

    const filename = path.basename(req.params.filename);

    if (!/^scrape-[\d]{4}-[\d]{2}-[\d]{2}_[\d]{2}-[\d]{2}-[\d]{2}\.json$/.test(filename)) {
        return res.status(400).json({ success: false, error: "Invalid filename." });
    }

    const filePath = path.join(OUTPUT_DIR, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, error: "File not found." });
    }

    res.download(filePath, filename);

});

app.listen(PORT, () => {
    console.log(`Scraper UI running at http://localhost:${PORT}`);
});
