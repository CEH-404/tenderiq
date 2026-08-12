import { GoogleGenAI } from "@google/genai";

import logger from "../../logger/logger.js";
import GeminiJSONProcessor from "../../services/GeminiJSONProcessor.js";

/**
 * ------------------------------------------------------------------
 * GeminiProvider
 * ------------------------------------------------------------------
 * Thin transport around the Gemini SDK, bound to ONE model.
 *
 * Responsibilities:
 * - Send a single prompt to its model
 * - Surface the model's stop reason / HTTP status as a real error
 * - Delegate JSON extraction/repair to GeminiJSONProcessor
 *
 * Does NOT:
 * - Build prompts
 * - Batch
 * - Choose between models or rate-limit (GeminiModelRouter owns that)
 * - Read / write files
 * ------------------------------------------------------------------
 */

// finishReason values that mean the JSON body is unusable as-is.
const INCOMPLETE_FINISH_REASONS = new Set([
    "MAX_TOKENS",
    "SAFETY",
    "RECITATION",
    "OTHER"
]);

class GeminiProvider {

    constructor(apiKey, model, config = {}) {

        if (!apiKey) {

            throw new Error(
                "Gemini API Key is required."
            );

        }

        if (!model) {

            throw new Error(
                "Gemini model name is required."
            );

        }

        this.client =
            new GoogleGenAI({ apiKey });

        this.modelName = model;

        // config.timeout is in seconds (GEMINI_TIMEOUT); 0/undefined disables.
        this.timeoutMs =
            Number(config.timeout) > 0
                ? Number(config.timeout) * 1000
                : 0;

        this.generationConfig = {

            responseMimeType: "application/json",

            ...(config.temperature !== undefined
                ? { temperature: config.temperature }
                : {}),

            ...(config.maxOutputTokens !== undefined
                ? { maxOutputTokens: config.maxOutputTokens }
                : {})

        };

    }

    /**
     * Reject if the SDK call outlives GEMINI_TIMEOUT.
     *
     * The underlying HTTP request is not cancellable through this SDK
     * version, so it may still complete in the background — but the
     * caller is freed to back off / fall back instead of hanging the
     * entire run on one stalled request.
     */

    withTimeout(promise) {

        if (!this.timeoutMs) return promise;

        let timer;

        const timeout =
            new Promise((_, reject) => {

                timer = setTimeout(
                    () => reject(
                        new Error(
                            `Gemini request timed out after ${this.timeoutMs / 1000}s.`
                        )
                    ),
                    this.timeoutMs
                );

            });

        return Promise
            .race([promise, timeout])
            .finally(() => clearTimeout(timer));

    }

    /**
     * Send prompt to Gemini and return the parsed JSON plus usage info.
     *
     * @returns {Promise<{data:object|Array, usage:{promptTokens:number, outputTokens:number, totalTokens:number}}>}
     */

    async generate(prompt) {

        try {

            logger.info(
                `Sending request to Gemini (${this.modelName})...`
            );

            const response =
                await this.withTimeout(
                    this.client.models.generateContent({

                        model: this.modelName,

                        contents: prompt,

                        config: this.generationConfig

                    })
                );

            const finishReason =
                response?.candidates?.[0]?.finishReason;

            const usageMeta =
                response?.usageMetadata;

            const usage = {
                promptTokens: usageMeta?.promptTokenCount ?? 0,
                outputTokens: usageMeta?.candidatesTokenCount ?? 0,
                totalTokens: usageMeta?.totalTokenCount ?? 0
            };

            if (usageMeta) {

                logger.info(
                    `Gemini (${this.modelName}) tokens — prompt: ${usage.promptTokens}, ` +
                    `output: ${usage.outputTokens}, total: ${usage.totalTokens}`
                );

            }

            const text = response?.text;

            // MAX_TOKENS means the JSON body was cut mid-stream. Fail loudly
            // so the caller can retry / fall back — but only when the text
            // is genuinely unparseable, which the processor decides.
            if (INCOMPLETE_FINISH_REASONS.has(finishReason)) {

                logger.warning(
                    `Gemini (${this.modelName}) stopped early (finishReason: ${finishReason}).`
                );

                if (!text) {

                    throw new Error(
                        `Gemini returned no usable content (finishReason: ${finishReason}).`
                    );

                }

            }

            if (!text) {

                throw new Error(
                    "Gemini returned an empty response."
                );

            }

            logger.info(
                `Gemini (${this.modelName}) response received successfully.`
            );

            return {
                data: GeminiJSONProcessor.process(text),
                usage
            };

        }

        catch (error) {

            const status =
                error.status ??
                error.httpStatus ??
                error.code;

            logger.error(
                `Gemini Error (${this.modelName}${status ? `, status ${status}` : ""}): ${error.message}`
            );

            if (status !== undefined && error.status === undefined) {

                error.status = status;

            }

            throw error;

        }

    }

}

export default GeminiProvider;