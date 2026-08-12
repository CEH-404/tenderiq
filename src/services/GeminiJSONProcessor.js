import logger from "../logger/logger.js";

/**
 * ------------------------------------------------------------------
 * GeminiJSONProcessor
 * ------------------------------------------------------------------
 * Turns whatever Gemini actually returned into a usable JS object.
 *
 * Gemini frequently violates "return raw JSON only":
 *
 *   ```json
 *   { ... }
 *   ```
 *
 *   Here is the JSON you asked for:
 *   { ... }
 *
 *   { "tenders": [ {...}, {...},        <-- truncated on MAX_TOKENS
 *
 * Handling, in order:
 *   1. Strip Markdown code fences (anywhere in the text, not just at
 *      the very start — the old prefix-only .replace() missed fences
 *      that followed a leading sentence).
 *   2. Slice out the outermost JSON block, ignoring any prose around it.
 *   3. Parse.
 *   4. If parsing fails, repair: drop the incomplete tail, remove the
 *      dangling comma, and close every still-open bracket. A response
 *      cut off mid-array then yields all the COMPLETE records instead
 *      of throwing the whole batch away.
 *
 * Does NOT:
 * - Call Gemini
 * - Validate the tender schema
 * - Retry
 * - Read / write files
 * ------------------------------------------------------------------
 */

class GeminiJSONProcessor {

    /**
     * Main entry point: raw model text -> parsed object.
     *
     * @param {string} rawText
     * @returns {object|Array}
     */

    static process(rawText) {

        if (typeof rawText !== "string" || rawText.trim() === "") {

            throw new Error(
                "Gemini returned an empty response."
            );

        }

        const candidate =
            this.extractJsonBlock(
                this.stripFences(rawText)
            );

        if (!candidate) {

            throw new Error(
                "No JSON object or array found in the Gemini response."
            );

        }

        try {

            return JSON.parse(candidate);

        }

        catch (parseError) {

            logger.warning(
                `Gemini JSON was malformed (${parseError.message}). Attempting repair...`
            );

            const repaired =
                this.repairTruncated(candidate);

            if (!repaired) {

                throw new Error(
                    `Unable to parse Gemini JSON response: ${parseError.message}`
                );

            }

            try {

                const result = JSON.parse(repaired);

                logger.warning(
                    "Gemini JSON repaired — the response was truncated, " +
                    "only complete records were recovered."
                );

                return result;

            }

            catch (repairError) {

                throw new Error(
                    `Unable to parse Gemini JSON response: ${repairError.message}`
                );

            }

        }

    }

    /**
     * Remove ```json / ``` fences wherever they appear.
     */

    static stripFences(text) {

        return text
            .replace(/```[a-zA-Z]*\s*/g, "")
            .replace(/```/g, "")
            .trim();

    }

    /**
     * Slice from the first `{` or `[` to its matching close bracket,
     * discarding any prose before or after. String contents and escape
     * sequences are respected so braces inside values are not counted.
     *
     * If the block never closes (truncated output) the remainder of the
     * text is returned for the repair pass.
     */

    static extractJsonBlock(text) {

        const objectStart = text.indexOf("{");
        const arrayStart = text.indexOf("[");

        const start =
            objectStart === -1
                ? arrayStart
                : arrayStart === -1
                    ? objectStart
                    : Math.min(objectStart, arrayStart);

        if (start === -1) return null;

        const stack = [];

        let inString = false;
        let escaped = false;

        for (let i = start; i < text.length; i++) {

            const char = text[i];

            if (inString) {

                if (escaped) escaped = false;
                else if (char === "\\") escaped = true;
                else if (char === "\"") inString = false;

                continue;

            }

            if (char === "\"") {
                inString = true;
                continue;
            }

            if (char === "{" || char === "[") {
                stack.push(char);
                continue;
            }

            if (char === "}" || char === "]") {

                stack.pop();

                if (stack.length === 0) {

                    return text.slice(start, i + 1);

                }

            }

        }

        // Never closed — hand the tail to the repair pass.
        return text.slice(start);

    }

    /**
     * Rebuild valid JSON from a truncated fragment.
     *
     * Walks the text tracking bracket depth and records every position
     * at which a container closed cleanly ("safe points"). The cut is
     * then made at the last safe point SHALLOWER than the depth the text
     * ends at — that is the last container the truncated one is nested
     * in, so the half-written record is dropped whole rather than being
     * closed early and kept with missing fields.
     *
     * Example: truncation inside `tenders[42].ai` ends at depth 4, so the
     * cut lands on the close of `tenders[41]` (depth 2) — 42 complete
     * records, no partial one.
     *
     * @returns {string|null} repaired JSON, or null if nothing is salvageable
     */

    static repairTruncated(text) {

        const stack = [];

        let inString = false;
        let escaped = false;

        // Every clean container close: { end index (exclusive), the
        // bracket stack as it stood right after the close }.
        const safePoints = [];

        for (let i = 0; i < text.length; i++) {

            const char = text[i];

            if (inString) {

                if (escaped) escaped = false;
                else if (char === "\\") escaped = true;
                else if (char === "\"") inString = false;

                continue;

            }

            if (char === "\"") {
                inString = true;
                continue;
            }

            if (char === "{" || char === "[") {
                stack.push(char === "{" ? "}" : "]");
                continue;
            }

            if (char === "}" || char === "]") {

                stack.pop();

                safePoints.push({
                    end: i + 1,
                    stack: [...stack]
                });

                continue;

            }

        }

        if (safePoints.length === 0) {

            // Not a single complete container closed — nothing to salvage.
            return null;

        }

        const eofDepth = stack.length;

        const chosen =
            [...safePoints]
                .reverse()
                .find(point => point.stack.length < eofDepth)
            ?? safePoints[safePoints.length - 1];

        const safeEnd = chosen.end;
        const safeStack = chosen.stack;

        let body = text.slice(0, safeEnd);

        // Strip a dangling separator left by the cut (e.g. `...},`).
        body = body.replace(/[,\s]+$/, "");

        // Close whatever is still open, innermost first.
        const closers =
            [...safeStack]
                .reverse()
                .join("");

        return body + closers;

    }

}

export default GeminiJSONProcessor;
