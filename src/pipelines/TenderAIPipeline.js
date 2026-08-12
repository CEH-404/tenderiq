import logger from "../logger/logger.js";

import geminiProvider, { geminiConfig } from "../config/gemini.config.js";
import TenderAIFormatter from "../intelligence/TenderAIFormatter.js";
import TenderBatchProcessor, { DEFAULT_BATCH_SIZE } from "../helpers/TenderBatchProcessor.js";
import FailedBatchExporter from "../exporters/FailedBatchExporter.js";

/**
 * ------------------------------------------------------------------
 * TenderAIPipeline
 * ------------------------------------------------------------------
 * Orchestrates the batched AI enrichment pipeline.
 *
 * Flow:
 *
 * Clean JSON
 *      ↓
 * TenderBatchProcessor        (100 tenders per batch)
 *      ↓
 * for each batch:  TenderAIFormatter → GeminiProvider
 *      ↓                              (retry x3, exponential backoff)
 * Validate JSON response
 *      ↓
 * Merge all AI results
 *      ↓
 * Final AI JSON
 *
 * Responsibilities:
 * - Validate input
 * - Split tenders into batches
 * - Execute the AI formatter per batch, sequentially
 * - Retry a failed batch with backoff, then quarantine it and continue
 * - Merge successful batches
 * - Log execution
 *
 * Does NOT:
 * - Read the clean JSON file
 * - Export the final AI JSON
 * - Call Gemini directly
 * ------------------------------------------------------------------
 */

// Requirement: attempt 1 waits 5s, attempt 2 waits 15s, attempt 3 waits 30s.
const RETRY_DELAYS_MS = [5000, 15000, 30000];

const PIPELINE_VERSION = "4.0.0";

// ============================================================
// TEMPORARY AI TEST CODE — PROCESS ONLY N TENDERS
// TODO: Remove this constant and the corresponding block in execute()
// below, and restore the original production line, after testing is
// complete.
// Set to a falsy value (0, null, undefined) to disable the limit
// without removing the code.
// ============================================================
const AI_TEST_LIMIT = 50;
// ============================================================
// END TEMPORARY AI TEST CODE
// ============================================================

class TenderAIPipeline {

    constructor(options = {}) {

        this.formatter =
            options.formatter ||
            new TenderAIFormatter(geminiProvider);

        this.batchSize =
            options.batchSize || geminiConfig.batchSize || DEFAULT_BATCH_SIZE;

        this.batchProcessor =
            options.batchProcessor ||
            new TenderBatchProcessor(this.batchSize);

        this.failedBatchExporter =
            options.failedBatchExporter ||
            new FailedBatchExporter(options.failedBatchDirectory);

        this.retryDelays =
            options.retryDelays || RETRY_DELAYS_MS;

        this.maxAttempts =
            options.maxAttempts || this.retryDelays.length;

    }

    /**
     * Execute AI Pipeline
     *
     * @param {object} cleanJson  { metadata, tenders: [...] }
     * @returns {Promise<object>} merged AI JSON
     */

    async execute(cleanJson) {

        logger.info(
            "======================================="
        );

        logger.info(
            "Starting Tender AI Pipeline..."
        );

        logger.info(
            "======================================="
        );

        try {

            if (!cleanJson) {

                throw new Error(
                    "Clean JSON is required."
                );

            }

            if (!Array.isArray(cleanJson.tenders)) {

                throw new Error(
                    "Invalid clean JSON. 'tenders' array not found."
                );

            }

            if (cleanJson.tenders.length === 0) {

                throw new Error(
                    "Clean JSON contains no tender records."
                );

            }

            logger.info(
                `Total tenders: ${cleanJson.tenders.length}`
            );

            // ============================================================
            // TEMPORARY AI TEST CODE — PROCESS ONLY AI_TEST_LIMIT TENDERS
            // TODO: Remove this temporary block and restore the original
            // production line immediately below (currently commented out)
            // after testing is complete.
            // ============================================================

            if (AI_TEST_LIMIT && cleanJson.tenders.length > AI_TEST_LIMIT) {

                logger.warning(
                    `AI TEST MODE: Processing ${AI_TEST_LIMIT} of ${cleanJson.tenders.length} tenders`
                );

                cleanJson = {

                    ...cleanJson,

                    tenders: cleanJson.tenders.slice(0, AI_TEST_LIMIT)

                };

            }

            // ============================================================
            // END TEMPORARY AI TEST CODE
            // ============================================================

            // Original production line — temporarily disabled while the
            // AI_TEST_LIMIT block above is active. Restore this line (and
            // delete the temporary block above) once testing is complete:
            // const batches = this.batchProcessor.createBatches(cleanJson.tenders);

            const batches =
                this.batchProcessor.createBatches(
                    cleanJson.tenders
                );

            logger.info(
                `Creating ${batches.length} AI batches (batch size: ${this.batchSize})`
            );

            const results = [];
            const failures = [];

            // Sequential on purpose: parallel batches multiply the token
            // burn rate and trip Gemini's rate limits.
            for (const batch of batches) {

                logger.info(
                    `Processing batch ${batch.batchNumber}/${batch.totalBatches} (${batch.batchSize} tenders)`
                );

                const outcome =
                    await this.processBatch(
                        batch,
                        cleanJson.metadata
                    );

                if (outcome.success) {

                    results.push({
                        batchNumber: batch.batchNumber,
                        result: outcome.result,
                        model: outcome.model
                    });

                    if (outcome.dropped > 0) {

                        logger.warning(
                            `Batch ${batch.batchNumber} completed with ${outcome.dropped} ` +
                            "unrecoverable tender(s)."
                        );

                    }

                }

                else {

                    const savedPath =
                        await this.failedBatchExporter.export(
                            batch,
                            outcome.error
                        );

                    failures.push({
                        batchNumber: batch.batchNumber,
                        batchSize: batch.batchSize,
                        error: outcome.error?.message || String(outcome.error),
                        savedTo: savedPath
                    });

                }

            }

            if (results.length === 0) {

                throw new Error(
                    `All ${batches.length} AI batches failed. No AI output produced.`
                );

            }

            const finalJson =
                this.mergeResults(
                    cleanJson,
                    results,
                    failures,
                    batches.length
                );

            logger.success(
                "AI Pipeline completed."
            );

            logger.info(
                `Batches succeeded: ${results.length}/${batches.length}`
            );

            if (failures.length > 0) {

                logger.warning(
                    `Batches failed: ${failures.length} ` +
                    `(${failures.map(f => f.batchNumber).join(", ")}) — saved for re-run.`
                );

            }

            logger.info(
                `Generated ${finalJson.tenders.length} AI enriched tenders.`
            );

            logger.info(
                "======================================="
            );

            return finalJson;

        }

        catch (error) {

            logger.error(
                `Tender AI Pipeline Failed: ${error.message}`
            );

            throw error;

        }

    }

    /**
     * Process ONE batch: send it, retry on failure, then re-request any
     * records the model dropped.
     *
     * Never throws — a batch that exhausts its attempts is reported back
     * so the remaining batches still run.
     *
     * @returns {Promise<{success:boolean, result?:object, error?:Error}>}
     */

    async processBatch(batch, metadata) {

        const primary =
            await this.sendWithRetries(batch, metadata);

        if (!primary.success) return primary;

        // Place each returned tender in its source slot, so a gap-filled
        // record lands in its original position rather than at the end.
        const slots =
            new Array(batch.tenders.length).fill(undefined);

        const alignment = primary.result.alignment;

        const indexes =
            alignment?.indexes ??
            primary.result.tenders.map((_, i) => i);

        primary.result.tenders.forEach((tender, i) => {
            const slot = indexes[i];
            if (slot >= 0 && slot < slots.length) slots[slot] = tender;
        });

        const missing = alignment?.missingIndexes ?? [];

        if (missing.length > 0) {

            await this.fillGaps(
                batch,
                metadata,
                missing,
                slots
            );

        }

        const tenders = slots.filter(tender => tender !== undefined);

        return {

            success: true,

            result: {
                metadata: primary.result.metadata,
                tenders
            },

            recovered: tenders.length,

            dropped: batch.tenders.length - tenders.length,

            model: primary.model

        };

    }

    /**
     * Re-send only the records the model failed to return.
     *
     * This is the practical answer to a MAX_TOKENS truncation: the batch
     * itself was fine, the response just ran out of room, so the tail is
     * re-requested on its own instead of being written off. Runs at most
     * once per batch — a second gap after a dedicated retry means the
     * records themselves are the problem, not the payload size.
     *
     * Mutates `slots` in place.
     */

    async fillGaps(batch, metadata, missingIndexes, slots) {

        logger.warning(
            `Batch ${batch.batchNumber}: re-requesting ${missingIndexes.length} ` +
            "missing tender(s)..."
        );

        const gapBatch = {

            batchNumber: batch.batchNumber,

            totalBatches: batch.totalBatches,

            batchSize: missingIndexes.length,

            tenders: missingIndexes.map(index => batch.tenders[index])

        };

        const outcome =
            await this.sendWithRetries(
                gapBatch,
                metadata,
                "gap-fill"
            );

        if (!outcome.success) {

            logger.error(
                `Batch ${batch.batchNumber}: gap-fill failed — ` +
                `${missingIndexes.length} tender(s) will be absent from the export.`
            );

            return;

        }

        const gapIndexes =
            outcome.result.alignment?.indexes ??
            outcome.result.tenders.map((_, i) => i);

        let filled = 0;

        outcome.result.tenders.forEach((tender, i) => {

            // gap-local position -> original position within the batch
            const originalIndex = missingIndexes[gapIndexes[i]];

            if (originalIndex !== undefined && slots[originalIndex] === undefined) {
                slots[originalIndex] = tender;
                filled++;
            }

        });

        logger.success(
            `Batch ${batch.batchNumber}: recovered ${filled}/${missingIndexes.length} ` +
            "missing tender(s) via gap-fill"
        );

    }

    /**
     * Send a batch to Gemini, retrying with exponential backoff.
     *
     * @returns {Promise<{success:boolean, result?:object, error?:Error}>}
     */

    async sendWithRetries(batch, metadata, label = null) {

        const name =
            label
                ? `batch ${batch.batchNumber} (${label})`
                : `batch ${batch.batchNumber}`;

        let lastError;

        for (
            let attempt = 1;
            attempt <= this.maxAttempts;
            attempt++
        ) {

            try {

                logger.info(
                    `Sending ${name} to Gemini` +
                    (attempt > 1 ? ` (attempt ${attempt}/${this.maxAttempts})` : "")
                );

                const result =
                    await this.formatter.format(
                        {
                            metadata: metadata || {},
                            tenders: batch.tenders
                        },
                        {
                            batchNumber: batch.batchNumber,
                            totalBatches: batch.totalBatches
                        }
                    );

                logger.success(
                    `${name.charAt(0).toUpperCase()}${name.slice(1)} completed`
                );

                return {
                    success: true,
                    result,
                    model: this.formatter.aiProvider.lastUsedModel
                };

            }

            catch (error) {

                lastError = error;

                logger.error(
                    `${name} failed on attempt ` +
                    `${attempt}/${this.maxAttempts}: ${error.message}`
                );

                if (attempt < this.maxAttempts) {

                    const waitMs =
                        this.retryDelays[attempt - 1] ??
                        this.retryDelays[this.retryDelays.length - 1];

                    logger.warning(
                        `Retrying ${name} in ${waitMs / 1000}s...`
                    );

                    await this.delay(waitMs);

                }

            }

        }

        logger.error(
            `${name} failed after ${this.maxAttempts} attempts. ` +
            "Skipping and continuing with remaining batches."
        );

        return {
            success: false,
            error: lastError
        };

    }

    /**
     * Merge every successful batch into a single AI JSON document,
     * in original batch order.
     */

    mergeResults(cleanJson, results, failures, totalBatches) {

        const ordered =
            [...results].sort(
                (a, b) => a.batchNumber - b.batchNumber
            );

        const tenders = [];

        for (const entry of ordered) {

            tenders.push(
                ...(entry.result.tenders || [])
            );

        }

        // Prefer the AI's metadata (rule 6 says preserve it) but keep the
        // cleaner's metadata as the base so nothing is lost when a batch
        // omits it.
        const aiMetadata =
            ordered[0]?.result?.metadata || {};

        const quarantined =
            failures.reduce(
                (total, failure) => total + (failure.batchSize || 0),
                0
            );

        const modelsUsed =
            [...new Set(
                ordered
                    .map(entry => entry.model)
                    .filter(Boolean)
            )];

        return {

            metadata: {

                ...(cleanJson.metadata || {}),

                ...aiMetadata,

                pipelineVersion: PIPELINE_VERSION,

                generatedBy: modelsUsed.join(", ") || "unknown",

                generatedAt: new Date().toISOString(),

                ai: {

                    batchSize: this.batchSize,

                    totalBatches,

                    successfulBatches: ordered.length,

                    failedBatches: failures.length,

                    inputTenders: cleanJson.tenders.length,

                    outputTenders: tenders.length,

                    // Tenders inside batches that failed outright — recoverable
                    // by re-running the saved failed-batch files.
                    quarantinedTenders: quarantined,

                    // Tenders the model never returned even after gap-fill,
                    // inside batches that otherwise succeeded.
                    droppedTenders:
                        cleanJson.tenders.length - tenders.length - quarantined,

                    processedAt: new Date().toISOString()

                }

            },

            failedBatches: failures,

            tenders

        };

    }

    delay(ms) {

        return new Promise(
            resolve => setTimeout(resolve, ms)
        );

    }

}

export default TenderAIPipeline;
export { RETRY_DELAYS_MS };

