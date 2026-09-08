import fs from "fs/promises";
import path from "path";

import logger from "../logger/Logger.js";

/**
 * ------------------------------------------------------------------
 * AITenderExportService
 * ------------------------------------------------------------------
 * Responsible ONLY for exporting the final AI JSON.
 *
 * Responsibilities:
 * - Create output directory if missing
 * - Generate filename
 * - Save JSON
 * - Return exported file path
 *
 * Does NOT:
 * - Format AI
 * - Read scraper data
 * - Validate tenders
 * - Call Gemini
 * ------------------------------------------------------------------
 */

class AITenderExportService {

    constructor(outputDirectory = "./output/ai") {

        this.outputDirectory =
            outputDirectory;

    }

    /**
     * Export AI JSON
     */

    async export(aiJson) {

        if (!aiJson) {

            throw new Error(
                "AI JSON is required."
            );

        }

        await this.ensureDirectory();

        const fileName =
            this.generateFileName();

        const filePath =
            path.join(
                this.outputDirectory,
                fileName
            );

        await fs.writeFile(

            filePath,

            JSON.stringify(
                aiJson,
                null,
                2
            ),

            "utf8"

        );

        logger.info(
            `AI JSON exported successfully.`
        );

        logger.info(
            `Location: ${filePath}`
        );

        logger.info(
            `Records: ${aiJson.tenders.length}`
        );

        return filePath;

    }

    /**
     * Create output directory
     */

    async ensureDirectory() {

        await fs.mkdir(

            this.outputDirectory,

            {

                recursive: true

            }

        );

    }

    /**
     * Generate filename
     */

    generateFileName() {

        const now =
            new Date();

        const timestamp =
            now
                .toISOString()
                .replace(/:/g, "-")
                .replace(/\./g, "-");

        return `ai-tenders-${timestamp}.json`;

    }

}

export default AITenderExportService;