import fs from "fs/promises";
import path from "path";

import logger from "../logger/Logger.js";

/**
 * ------------------------------------------------------------------
 * FailedBatchExporter
 * ------------------------------------------------------------------
 * Responsible ONLY for persisting AI batches that Gemini could not
 * process, so they can be inspected or re-run later without blocking
 * the rest of the export.
 *
 * Responsibilities:
 * - Create output directory if missing
 * - Write one JSON file per failed batch
 * - Return the file path
 *
 * Does NOT:
 * - Call Gemini
 * - Retry
 * - Validate tenders
 * ------------------------------------------------------------------
 */

class FailedBatchExporter {

    constructor(outputDirectory = "./output/ai/failed") {

        this.outputDirectory = outputDirectory;

    }

    /**
     * @param {object} batch  { batchNumber, totalBatches, batchSize, tenders }
     * @param {Error|string} error
     * @returns {Promise<string|null>} file path, or null if saving failed
     */

    async export(batch, error) {

        try {

            await fs.mkdir(
                this.outputDirectory,
                { recursive: true }
            );

            const timestamp =
                new Date()
                    .toISOString()
                    .replace(/[:.]/g, "-");

            const filePath =
                path.join(
                    this.outputDirectory,
                    `failed-batch-${batch.batchNumber}-${timestamp}.json`
                );

            const payload = {

                batchNumber: batch.batchNumber,

                totalBatches: batch.totalBatches,

                batchSize: batch.batchSize,

                failedAt: new Date().toISOString(),

                error:
                    typeof error === "string"
                        ? error
                        : error?.message || "Unknown error",

                tenders: batch.tenders

            };

            await fs.writeFile(
                filePath,
                JSON.stringify(payload, null, 2),
                "utf8"
            );

            logger.warning(
                `Failed batch ${batch.batchNumber} saved to: ${filePath}`
            );

            return filePath;

        }

        catch (writeError) {

            // Never let bookkeeping sink the run — the remaining batches
            // still need to be processed.
            logger.error(
                `Could not save failed batch ${batch.batchNumber}: ${writeError.message}`
            );

            return null;

        }

    }

}

export default FailedBatchExporter;
