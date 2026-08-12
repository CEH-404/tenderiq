import fs from "fs/promises";
import path from "path";

import AIRunner from "./src/main/AIRunner.js";
import geminiProvider, { geminiConfig } from "./src/config/gemini.config.js";

/**
 * Standalone entry point: run the Tender AI pipeline against a clean JSON
 * file without re-scraping. Defaults to the most recently generated file
 * in output/clean/.
 *
 * Usage:
 *   node run-ai-pipeline.js [path/to/clean-tenders-*.json]
 */

async function resolveCleanJsonPath(explicitPath) {

    if (explicitPath) return explicitPath;

    const cleanDir = path.resolve("output/clean");

    const files =
        (await fs.readdir(cleanDir))
            .filter(name => name.endsWith(".json"));

    if (files.length === 0) {

        throw new Error(
            `No clean JSON files found in ${cleanDir}`
        );

    }

    const withStats =
        await Promise.all(
            files.map(async name => {

                const filePath = path.join(cleanDir, name);

                const stat = await fs.stat(filePath);

                return { filePath, mtime: stat.mtimeMs };

            })
        );

    withStats.sort((a, b) => b.mtime - a.mtime);

    return withStats[0].filePath;

}

async function main() {

    const cleanJsonPath =
        await resolveCleanJsonPath(process.argv[2]);

    console.log(`Using clean JSON: ${cleanJsonPath}`);
    console.log(`Batch size: ${geminiConfig.batchSize || 100}`);

    const runner = new AIRunner();

    const result = await runner.run(cleanJsonPath);

    console.log("\n===== Gemini model usage =====");
    console.table(geminiProvider.getStats());

    console.log("\n===== Result =====");
    console.log(`Output file: ${result.outputFile}`);
    console.log(`Total records: ${result.totalRecords}`);

    if (result.data.failedBatches?.length) {

        console.log(`Failed batches: ${result.data.failedBatches.length}`);
        console.table(result.data.failedBatches);

    }

}

main().catch(error => {

    console.error("AI pipeline run failed:", error);
    process.exit(1);

});