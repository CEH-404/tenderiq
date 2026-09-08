import "dotenv/config";

import Framework from "./core/Framework.js";
import ScraperEngine from "./core/ScraperEngine.js";
import DatabaseManager from "./database/DatabaseManager.js";
import ScraperJobRepository from "./database/DatabaseManager.js";
import * as AdvisoryLock from "./database/AdvisoryLock.js";

import logger from "./logger/Logger.js";

import dotenv from "dotenv";

/**
 * Run the cleaned tender data through the Gemini AI pipeline.
 * @param {Object} cleanJson - The cleaned tender data from the JSONCleaner pipeline
 * @returns {Object} The AI pipeline result
 */
async function runAIPipeline(cleanJson) {
    // Use the existing AIRunner
    const { AIRunner } = await import("./main/AIRunner.js");

    const runner = new AIRunner();

    const result = await runner.run(cleanJson);

    return result;
}

/**
 * Clean raw scraper output using the existing JSONCleaner pipeline.
 * @param {Object} scrapeResult - The raw scrape result from Playwright
 * @returns {Object} The cleaned tender data
 */
async function cleanTenderData(scrapeResult) {
    // Extract the pages array from the scrape result
    const pages = scrapeResult.pages || [];

    if (!pages.length) {
        return { tenders: [], metadata: {} };
    }

    // Use the existing CleanJSONExporter/ExtractionExportService pipeline
    // The scrapeResult has the shape expected by the extraction pipeline

    const ExtractionExportService = await import("./services/ExtractionExportService.js");

    const service = new ExtractionExportService();

    const exported = await service.export({

        pages: pages.map((page) => ({

            url: page.url || "",

            text: page.text || "",

            title: page.title || "",

            tables: page.tables || [],

            links: page.links || [],

        })),

    });

    // The exported data has success/data structure
    if (exported && exported.success && exported.data) {

        // Use the existing CleanJSONExporter to further clean
        const CleanJSONExporter = await import("./exporters/CleanJSONExporter.js");

        const cleaner = new CleanJSONExporter();

        const cleanResult = await cleaner.export(exported.data);

        return cleanResult.data || { tenders: [], metadata: {} };

    }

    return { tenders: [], metadata: {} };
}

export { runAIPipeline, cleanTenderData };