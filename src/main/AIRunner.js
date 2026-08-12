import fs from "fs/promises";

import logger from "../logger/logger.js";

import TenderAIPipeline from "../pipelines/TenderAIPipeline.js";
import AITenderExportService from "../exporters/AITenderExportService.js";

/**
 * ------------------------------------------------------------------
 * AIRunner
 * ------------------------------------------------------------------
 * Entry point for the AI Tender Intelligence pipeline.
 *
 * Flow
 *
 * Clean JSON File
 *        ↓
 * Read JSON
 *        ↓
 * TenderAIPipeline
 *        ↓
 * AITenderExportService
 *        ↓
 * AI JSON File
 *
 * ------------------------------------------------------------------
 */

class AIRunner {

    constructor() {

        this.pipeline =
            new TenderAIPipeline();

        this.exportService =
            new AITenderExportService();

    }

    /**
     * Execute complete AI pipeline.
     */

    async run(cleanJsonPath) {

        logger.info(
            "========================================"
        );

        logger.info(
            "Tender Intelligence AI Runner Started"
        );

        logger.info(
            "========================================"
        );

        try {

            if (!cleanJsonPath) {

                throw new Error(
                    "Clean JSON file path is required."
                );

            }

            logger.info(
                `Reading file: ${cleanJsonPath}`
            );

            const fileContent =
                await fs.readFile(
                    cleanJsonPath,
                    "utf8"
                );

            const cleanJson =
                JSON.parse(
                    fileContent
                );

            logger.info(
                `Loaded ${cleanJson.tenders.length} tender records.`
            );

            const finalAIJson =
                await this.pipeline.execute(
                    cleanJson
                );

            const exportedFile =
                await this.exportService.export(
                    finalAIJson
                );

            logger.info(
                "========================================"
            );

            logger.info(
                "Tender Intelligence AI Runner Completed"
            );

            logger.info(
                `Output File: ${exportedFile}`
            );

            logger.info(
                "========================================"
            );

            return {

                success: true,

                outputFile: exportedFile,

                totalRecords: finalAIJson.tenders.length,

                data: finalAIJson

            };

        }

        catch (error) {

            logger.error(
                `AIRunner Failed: ${error.message}`
            );

            throw error;

        }

    }

}

export default AIRunner;