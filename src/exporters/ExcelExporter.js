import fs from "fs/promises";
import path from "path";

import logger from "../logger/Logger.js";
import JSONCleaner from "../services/JSONCleaner.js";

/**
 * CleanJSONExporter
 * ------------------------------------------------------
 * Cleans the raw scraper JSON and exports a NEW file
 * every run (never overwrites previous exports).
 * ------------------------------------------------------
 */

class CleanJSONExporter {

    constructor(
        outputDirectory = "./output/clean",
        cleanerConfig = {}
    ) {

        this.outputDirectory = outputDirectory;

        this.cleaner = new JSONCleaner({
            logger,
            ...cleanerConfig
        });

    }

    async export(extractionData = {}) {

        const cleanJSON =
            this.cleaner.clean(extractionData);

        await fs.mkdir(
            this.outputDirectory,
            {
                recursive: true
            }
        );

        const now = new Date();

        const filename =
            `clean-tenders-${
                now.getFullYear()
            }-${
                String(now.getMonth() + 1).padStart(2, "0")
            }-${
                String(now.getDate()).padStart(2, "0")
            }_${
                String(now.getHours()).padStart(2, "0")
            }-${
                String(now.getMinutes()).padStart(2, "0")
            }-${
                String(now.getSeconds()).padStart(2, "0")
            }.json`;

        const filePath = path.join(
            this.outputDirectory,
            filename
        );

        await fs.writeFile(
            filePath,
            JSON.stringify(cleanJSON, null, 2),
            "utf8"
        );

        logger.success(
            `Clean JSON exported successfully: ${filePath}`
        );

        return {

            success: true,

            filePath,

            filename,

            report: this.cleaner.getReport()

        };

    }

}

export default CleanJSONExporter;