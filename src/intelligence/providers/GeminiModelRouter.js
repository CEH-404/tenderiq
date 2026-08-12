import logger from "../../logger/logger.js";

/**
 * ------------------------------------------------------------------
 * GeminiModelRouter
 * ------------------------------------------------------------------
 * Sends a prompt through an ordered chain of Gemini models
 * (primary -> fallback(s) -> emergency), respecting each model's
 * RPM / TPM / RPD limits and falling back on 429 / 503.
 *
 * Presents the same `generate(prompt)` interface as a single
 * GeminiProvider, so it is a drop-in replacement for the pipeline.
 *
 * Policy:
 * - RPD exhausted for a model  -> that model is skipped for the rest
 *   of the day, no retry.
 * - RPM / TPM momentarily full -> wait briefly if the wait is short,
 *   otherwise move on to the next model.
 * - 429 (quota) response       -> do not retry the same model
 *   (retrying won't help within the same minute); move to the next
 *   model and put this one on a short cooldown.
 * - 503 (transient/unavailable) -> retry the SAME model with
 *   exponential backoff a couple of times before moving on.
 * - Any other error            -> not retryable, thrown immediately.
 *
 * Does NOT:
 * - Build prompts
 * - Batch
 * - Read / write files
 * ------------------------------------------------------------------
 */

const RETRYABLE_STATUSES = new Set([429, 503]);

// How long an RPM/TPM wait is tolerated before giving up on a model and
// trying the next one instead of blocking the whole pipeline on it.
const MAX_CAPACITY_WAIT_MS = 15000;

// Backoff schedule for a 503 retry on the SAME model.
const BACKOFF_503_MS = [2000, 5000];

// Cooldown applied to a model after a 429 so the next batch doesn't
// immediately retry a model that just told us it's out of quota.
const COOLDOWN_429_MS = 30000;

class GeminiModelRouter {

    constructor(chain, options = {}) {

        if (!Array.isArray(chain) || chain.length === 0) {

            throw new Error(
                "GeminiModelRouter requires at least one model in its chain."
            );

        }

        this.chain =
            chain.map(entry => ({

                name: entry.name,

                limits: entry.limits,

                provider: entry.provider,

                requestLog: [], // { time, tokens }[] within the trailing 60s window

                dayKey: null,
                dayCount: 0,

                cooldownUntil: 0,

                rpdWarned: false

            }));

        // Worst-case output allowance used to budget TPM before a call,
        // since actual usage is only known after the response arrives.
        this.maxOutputTokens =
            Number(options.maxOutputTokens) || 8192;

        // Name of the model that served the most recent successful call —
        // callers that need per-batch attribution (e.g. the pipeline,
        // for metadata.generatedBy) read this right after generate().
        this.lastUsedModel = null;

    }

    /**
     * Send a prompt through the model chain.
     *
     * @param {string} prompt
     * @returns {Promise<object|Array>} parsed JSON from whichever model succeeded
     */

    async generate(prompt) {

        const estimatedInputTokens =
            Math.ceil(prompt.length / 4);

        let lastError;

        for (const model of this.chain) {

            if (this.isRpdExhausted(model)) continue;

            const attemptsAllowed =
                1 + BACKOFF_503_MS.length;

            for (let attempt = 1; attempt <= attemptsAllowed; attempt++) {

                const wait =
                    await this.awaitCapacity(
                        model,
                        estimatedInputTokens + this.maxOutputTokens
                    );

                if (!wait.proceed) break; // move on to next model

                try {

                    const { data, usage } =
                        await model.provider.generate(prompt);

                    this.recordUsage(
                        model,
                        usage.totalTokens || estimatedInputTokens
                    );

                    this.lastUsedModel = model.name;

                    logger.success(
                        `Gemini model used: ${model.name} ` +
                        `(RPD ${model.dayCount}/${model.limits.rpd}, ` +
                        `RPM ${model.requestLog.length}/${model.limits.rpm})`
                    );

                    return data;

                }

                catch (error) {

                    lastError = error;

                    const status = error.status;

                    if (status === 503 && attempt <= BACKOFF_503_MS.length) {

                        const backoffMs =
                            BACKOFF_503_MS[attempt - 1];

                        logger.warning(
                            `${model.name} unavailable (503). ` +
                            `Retrying same model in ${backoffMs / 1000}s ` +
                            `(attempt ${attempt}/${attemptsAllowed})...`
                        );

                        await this.delay(backoffMs);

                        continue;

                    }

                    if (RETRYABLE_STATUSES.has(status)) {

                        if (status === 429) {

                            model.cooldownUntil =
                                Date.now() + COOLDOWN_429_MS;

                        }

                        logger.warning(
                            `${model.name} failed with status ${status}. ` +
                            "Falling back to the next model in the chain..."
                        );

                        break; // move to next model

                    }

                    // Not a rate/availability error — no other model will
                    // fix a bad prompt or schema violation.
                    throw error;

                }

            }

        }

        throw (
            lastError ||
            new Error("All configured Gemini models are exhausted for today.")
        );

    }

    /**
     * Wait for capacity on `model` if the wait is short, skip it if the
     * wait would be long, or refuse if its daily quota is already spent.
     *
     * @returns {Promise<{proceed:boolean}>}
     */

    async awaitCapacity(model, estimatedTokens) {

        const now = Date.now();

        if (model.cooldownUntil > now) {

            const remaining = model.cooldownUntil - now;

            if (remaining > MAX_CAPACITY_WAIT_MS) return { proceed: false };

            await this.delay(remaining);

        }

        this.pruneWindow(model);

        const rpmUsed = model.requestLog.length;
        const tpmUsed =
            model.requestLog.reduce((sum, e) => sum + e.tokens, 0);

        const rpmOk = rpmUsed < model.limits.rpm;
        const tpmOk = tpmUsed + estimatedTokens <= model.limits.tpm;

        if (rpmOk && tpmOk) return { proceed: true };

        // Wait until the oldest entry in the 60s window falls out of it.
        const oldest = model.requestLog[0];

        const waitMs =
            oldest
                ? Math.max(0, 60000 - (Date.now() - oldest.time)) + 50
                : MAX_CAPACITY_WAIT_MS + 1;

        if (waitMs > MAX_CAPACITY_WAIT_MS) return { proceed: false };

        logger.info(
            `${model.name}: waiting ${Math.ceil(waitMs / 1000)}s for ` +
            `${rpmOk ? "TPM" : "RPM"} capacity...`
        );

        await this.delay(waitMs);

        this.pruneWindow(model);

        return { proceed: true };

    }

    /**
     * Drop request-log entries older than the 60s rolling window.
     */

    pruneWindow(model) {

        const cutoff = Date.now() - 60000;

        while (model.requestLog.length && model.requestLog[0].time < cutoff) {

            model.requestLog.shift();

        }

    }

    /**
     * True once the model has spent its requests-per-day budget.
     */

    isRpdExhausted(model) {

        const todayKey =
            new Date().toISOString().slice(0, 10);

        if (model.dayKey !== todayKey) {

            model.dayKey = todayKey;
            model.dayCount = 0;
            model.rpdWarned = false;

        }

        const exhausted =
            model.dayCount >= model.limits.rpd;

        if (exhausted && !model.rpdWarned) {

            logger.warning(
                `${model.name}: daily quota (${model.limits.rpd} RPD) reached. ` +
                "Skipping for the rest of today."
            );

            model.rpdWarned = true;

        }

        return exhausted;

    }

    recordUsage(model, tokens) {

        this.isRpdExhausted(model); // ensures dayKey/dayCount are current

        model.requestLog.push({
            time: Date.now(),
            tokens
        });

        model.dayCount += 1;

    }

    /**
     * Per-model usage snapshot, for end-of-run reporting.
     */

    getStats() {

        return this.chain.map(model => ({
            model: model.name,
            requestsToday: model.dayCount,
            rpd: model.limits.rpd,
            requestsLastMinute: model.requestLog.length,
            rpm: model.limits.rpm
        }));

    }

    delay(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));

    }

}

export default GeminiModelRouter;