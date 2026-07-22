import TableClassifier from "./TableClassifier.js";
import TableNormalizer from "./TableNormalizer.js";
import TableScorer from "./TableScorer.js";

class TableDatasetBuilder {

    static build(tables = []) {

        const datasets = [];

        for (const table of tables) {

            // -----------------------------
            // Normalize
            // -----------------------------

            const normalized =
                TableNormalizer.normalize(table);

            if (!normalized) {
                continue;
            }

            // -----------------------------
            // Skip Empty Tables
            // -----------------------------

            if (
                normalized.headers.length === 0 &&
                normalized.rows.length === 0
            ) {
                continue;
            }

            // -----------------------------
            // Classification
            // -----------------------------

            const classification =
                TableClassifier.classify(normalized);

            // -----------------------------
            // Importance Score
            // -----------------------------

            const score =
                TableScorer.score(normalized);

            if (score < 30) {
                continue;
            }

            // -----------------------------
            // Dataset
            // -----------------------------

            datasets.push({

                id: datasets.length + 1,

                name:
                    classification.type + "_" +
                    (datasets.length + 1),

                classification,

                score,

                headers:
                    normalized.headers,

                rows:
                    normalized.rows,

                totalColumns:
                    normalized.headers.length,

                totalRows:
                    normalized.rows.length,

                hasHeader:
                    normalized.headers.length > 0,

                hasData:
                    normalized.rows.length > 0,

                extractedAt:
                    new Date().toISOString()

            });

        }

        // -----------------------------
        // Summary
        // -----------------------------

        return {

            totalTables:
                tables.length,

            usefulTables:
                datasets.length,

            ignoredTables:
                tables.length - datasets.length,

            datasets

        };

    }

}

export default TableDatasetBuilder;