import logger from "../logger/logger.js";

/**
 * ------------------------------------------------------------------
 * TenderAIFormatter
 * ------------------------------------------------------------------
 * Responsible ONLY for transforming ONE cleaned JSON payload into an
 * AI-enhanced JSON payload. The pipeline calls this once per batch.
 *
 * Responsibilities:
 * - Accept cleaned JSON (a batch payload)
 * - Validate input
 * - Tag each input tender with a _sourceIndex for traceability
 * - Build AI prompt
 * - Call AI provider
 * - Validate AI output
 * - Re-align the output against the input, and report what is missing
 * - Return final AI JSON
 *
 * Does NOT:
 * - Read files
 * - Write files
 * - Split batches
 * - Parse AI responses
 * - Export JSON
 * - Handle retries
 * - Handle environment variables
 * ------------------------------------------------------------------
 */

// Internal-only correlation key. Injected into the prompt, echoed back by
// the model, then stripped before the tender reaches the final export —
// it never appears in the AI JSON output.
const SOURCE_INDEX_KEY = "_sourceIndex";

class TenderAIFormatter {

    constructor(aiProvider) {

        if (!aiProvider) {

            throw new Error(
                "AI Provider instance is required."
            );

        }

        this.aiProvider = aiProvider;

    }

    /**
     * Main Entry Point
     *
     * @param {object} cleanJson  { metadata?, tenders: [...] }
     * @param {object} [batchInfo]  { batchNumber, totalBatches } — prompt context only
     * @returns {Promise<{metadata:object, tenders:Array, alignment:object}>}
     */

    async format(cleanJson, batchInfo = null) {

        this.validateInput(cleanJson);

        const expected = cleanJson.tenders.length;

        logger.info(
            batchInfo
                ? `Formatting batch ${batchInfo.batchNumber}/${batchInfo.totalBatches} (${expected} tenders) using AI...`
                : `Formatting ${expected} tenders using AI...`
        );

        const indexedInput = {

            ...cleanJson,

            tenders: cleanJson.tenders.map((tender, index) => ({
                [SOURCE_INDEX_KEY]: index,
                ...tender
            }))

        };

        const prompt =
            this.buildPrompt(indexedInput, batchInfo);

        const aiJson =
            await this.aiProvider.generate(prompt);

        const normalized =
            this.normalizeOutput(aiJson, cleanJson);

        this.validateOutput(normalized);

        const alignment =
            this.alignOutput(normalized.tenders, expected);

        this.logAlignment(alignment, expected);

        return {

            ...normalized,

            tenders: alignment.tenders,

            alignment

        };

    }

    /**
     * Validate Clean JSON
     */

    validateInput(cleanJson) {

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

    }

    /**
     * Build Prompt
     */

    buildPrompt(cleanJson, batchInfo = null) {

        const count = cleanJson.tenders.length;

        const batchNote =
            batchInfo
                ? `You are processing batch ${batchInfo.batchNumber} of ${batchInfo.totalBatches}. ` +
                  `Transform ONLY the ${count} tenders provided below.`
                : `Transform ALL ${count} tenders provided below.`;

        return `
You are TenderIQ AI.

Convert the provided cleaned tender JSON into the TenderIQ AI schema.

${batchNote}

Rules:

1. Return ONLY valid JSON.
2. Do NOT use Markdown.
3. Do NOT wrap the response inside \`\`\`json.
4. Do NOT explain anything.
5. Do NOT write any text before or after the JSON.
6. Preserve the metadata object.
7. Transform every tender. The output "tenders" array MUST contain exactly ${count} items, in the same order as the input.
8. Every output tender MUST repeat the exact "${SOURCE_INDEX_KEY}" value of the input tender it came from. Never invent, skip, or reuse an index.
9. Generate:
   - summary
   - category
   - procurement
   - organization
   - dates
   - links
   - ai
10. Detect city from the department if possible.
11. Province should be "Punjab" if missing.
12. Preserve every URL.
13. If a value cannot be determined, use null.
14. Keep every summary under 40 words so the response is not truncated.
15. Return a single valid JSON object of the shape { "metadata": {...}, "tenders": [...] }.

Input JSON:

${JSON.stringify(cleanJson)}
`;

    }

    /**
     * Accept the shapes Gemini actually returns and normalize them to
     * { metadata, tenders }.
     *
     * Per batch the model often drops the metadata object or replies with
     * a bare array — neither is a reason to throw away a good batch, so
     * metadata is backfilled from the input.
     */

    normalizeOutput(result, cleanJson) {

        if (Array.isArray(result)) {

            return {
                metadata: cleanJson.metadata || {},
                tenders: result
            };

        }

        if (!result || typeof result !== "object") {

            return result;

        }

        return {
            ...result,
            metadata: result.metadata || cleanJson.metadata || {},
            tenders: result.tenders
        };

    }

    /**
     * Correlate the AI output back to the input using _sourceIndex.
     *
     * Returns the tenders sorted by their source position with the
     * internal key stripped, plus exactly which input positions the model
     * failed to return — that list is what lets the pipeline re-request
     * the gaps instead of silently exporting a short batch.
     *
     * A tender whose index is missing, out of range, or already claimed
     * falls back to the next free slot so a model that ignores rule 8
     * degrades to the old positional behaviour rather than failing.
     */

    alignOutput(tenders, expected) {

        const claimed = new Set();

        const entries = [];

        const duplicateIndexes = [];

        let inferredCount = 0;

        let cursor = 0;

        for (const tender of tenders) {

            if (!tender || typeof tender !== "object") continue;

            const { [SOURCE_INDEX_KEY]: rawIndex, ...rest } = tender;

            let index = Number.parseInt(rawIndex, 10);

            const usable =
                Number.isInteger(index) &&
                index >= 0 &&
                index < expected &&
                !claimed.has(index);

            if (!usable) {

                if (Number.isInteger(index) && claimed.has(index)) {

                    duplicateIndexes.push(index);

                }

                // Next unclaimed slot, in arrival order.
                while (cursor < expected && claimed.has(cursor)) cursor++;

                if (cursor >= expected) continue; // more output than input — drop the extra

                index = cursor;

                inferredCount++;

            }

            claimed.add(index);

            entries.push({ index, tender: rest });

        }

        entries.sort((a, b) => a.index - b.index);

        const missingIndexes = [];

        for (let i = 0; i < expected; i++) {

            if (!claimed.has(i)) missingIndexes.push(i);

        }

        return {

            tenders: entries.map(entry => entry.tender),

            indexes: entries.map(entry => entry.index),

            missingIndexes,

            duplicateIndexes,

            inferredCount,

            expected,

            received: entries.length

        };

    }

    logAlignment(alignment, expected) {

        if (alignment.received !== expected) {

            logger.warning(
                `AI returned ${alignment.received} tenders for ${expected} input tenders.`
            );

        }

        if (alignment.missingIndexes.length > 0) {

            logger.warning(
                `Missing source positions: ${this.summarizeIndexes(alignment.missingIndexes)}`
            );

        }

        if (alignment.duplicateIndexes.length > 0) {

            logger.warning(
                `AI repeated ${alignment.duplicateIndexes.length} source index(es); ` +
                "the repeats were re-slotted positionally."
            );

        }

        if (alignment.inferredCount > 0) {

            logger.warning(
                `${alignment.inferredCount} tender(s) came back without a usable ` +
                `${SOURCE_INDEX_KEY}; matched by position instead.`
            );

        }

        if (alignment.received === expected && alignment.missingIndexes.length === 0) {

            logger.info(
                "AI formatting completed successfully."
            );

        }

    }

    /**
     * "0, 1, 2, 7" -> "0-2, 7" so a large gap list stays readable in logs.
     */

    summarizeIndexes(indexes, limit = 12) {

        const ranges = [];

        let start = indexes[0];
        let previous = indexes[0];

        for (let i = 1; i <= indexes.length; i++) {

            const current = indexes[i];

            if (current === previous + 1) {
                previous = current;
                continue;
            }

            ranges.push(
                start === previous ? `${start}` : `${start}-${previous}`
            );

            start = current;
            previous = current;

        }

        if (ranges.length <= limit) return ranges.join(", ");

        return `${ranges.slice(0, limit).join(", ")} (+${ranges.length - limit} more)`;

    }

    /**
     * Validate AI Output
     */

    validateOutput(result) {

        if (!result) {

            throw new Error(
                "AI output is empty."
            );

        }

        if (typeof result !== "object") {

            throw new Error(
                "AI output must be a JSON object."
            );

        }

        if (!result.metadata) {

            throw new Error(
                "AI output is missing metadata."
            );

        }

        if (!Array.isArray(result.tenders)) {

            throw new Error(
                "AI output is missing the tenders array."
            );

        }

        if (result.tenders.length === 0) {

            throw new Error(
                "AI output contains no tenders."
            );

        }

    }

}

export default TenderAIFormatter;
export { SOURCE_INDEX_KEY };
