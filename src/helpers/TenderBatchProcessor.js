import logger from "../logger/logger.js";

/**
 * ------------------------------------------------------------------
 * TenderBatchProcessor
 * ------------------------------------------------------------------
 * Splits a complete tender array into sequential, size-bounded
 * batches so the AI stage never sends an oversized payload to Gemini.
 *
 * Responsibilities:
 * - Accept the complete tender array
 * - Split it into batches (default size 100)
 * - Attach batch metadata to every batch
 * - Return the batches in order
 *
 * Does NOT:
 * - Call Gemini
 * - Build prompts
 * - Retry
 * - Read / write files
 * ------------------------------------------------------------------
 */

const DEFAULT_BATCH_SIZE = 100;

class TenderBatchProcessor {

    constructor(batchSize = DEFAULT_BATCH_SIZE) {

        const size = Number(batchSize);

        if (!Number.isInteger(size) || size < 1) {

            throw new Error(
                `Invalid batch size: ${batchSize}. Must be a positive integer.`
            );

        }

        this.batchSize = size;

    }

    /**
     * Split the tender array into batches carrying metadata.
     *
     * @param {Array<object>} tenders
     * @returns {Array<{batchNumber:number,totalBatches:number,batchSize:number,tenders:Array<object>}>}
     */

    createBatches(tenders) {

        const chunks = this.split(tenders);

        const totalBatches = chunks.length;

        return chunks.map((chunk, index) => ({

            batchNumber: index + 1,

            totalBatches,

            batchSize: chunk.length,

            tenders: chunk

        }));

    }

    /**
     * Sequential iterator over the batches — lets a caller consume one
     * batch at a time without materialising the metadata list first.
     */

    * batches(tenders) {

        for (const batch of this.createBatches(tenders)) {

            yield batch;

        }

    }

    /**
     * Raw split into arrays of tenders (no metadata).
     */

    split(tenders) {

        if (!Array.isArray(tenders)) {

            throw new Error(
                "Tenders must be an array"
            );

        }

        const batches = [];

        for (
            let i = 0;
            i < tenders.length;
            i += this.batchSize
        ) {

            batches.push(
                tenders.slice(
                    i,
                    i + this.batchSize
                )
            );

        }

        logger.info(
            `Created ${batches.length} batches from ${tenders.length} tenders`
        );

        return batches;

    }

    /**
     * How many batches a given tender count produces.
     */

    countBatches(total) {

        return Math.ceil(
            Number(total || 0) / this.batchSize
        );

    }

}

export default TenderBatchProcessor;
export { DEFAULT_BATCH_SIZE };
