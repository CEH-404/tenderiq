import TenderMapper from "../domain/tender/TenderMapper.js";
import TenderValidator from "../domain/tender/TenderValidator.js";

class TenderPipeline {

    /**
     * Convert extracted tables into raw tender objects.
     *
     * @param {Object} tableData
     * @returns {Array}
     */
    static extractFromTables(tableData = {}) {

        const tenders = [];

        if (
            !tableData.tables ||
            !Array.isArray(tableData.tables)
        ) {
            return tenders;
        }

        for (const table of tableData.tables) {

            if (
                !table.rows ||
                !Array.isArray(table.rows)
            ) {
                continue;
            }

            for (const row of table.rows) {

                tenders.push({

                    ...row,

                    _tableIndex:
                        table.tableIndex,

                    _sourceHeaders:
                        table.headers || []

                });

            }

        }

        return tenders;

    }



    /**
     * Process a complete extraction result.
     *
     * Expected input:
     * {
     *   analysis,
     *   resources,
     *   strategy,
     *   html,
     *   text,
     *   metadata,
     *   links,
     *   tables
     * }
     *
     * @param {Object} extraction
     * @returns {Object}
     */
    static processExtraction(extraction = {}) {

        const rawTenders =
            this.extractFromTables({

                tables:
                    extraction.tables || []

            });

        const extractedAt =
            new Date().toISOString();

        const enrichedTenders =
            rawTenders.map(rawTender => ({

                ...rawTender,

                _context: {

                    portal:
                        extraction.metadata?.portal ??
                        extraction.analysis?.portal ??
                        "",

                    sourceUrl:
                        extraction.metadata?.url ??
                        extraction.resources?.url ??
                        "",

                    page:
                        extraction.analysis?.page ??
                        1,

                    extractedAt,

                    metadata:
                        extraction.metadata ?? {},

                    analysis:
                        extraction.analysis ?? {},

                    resources:
                        extraction.resources ?? {},

                    strategy:
                        extraction.strategy ?? {},

                    links:
                        extraction.links ?? [],

                    html:
                        extraction.html ?? null,

                    text:
                        extraction.text ?? null

                }

            }));

        return this.processMany(
            enrichedTenders
        );

    }



    /**
     * Backward-compatible wrapper.
     *
     * @param {Object} extractionResult
     * @returns {Object}
     */
    static processTables(extractionResult = {}) {

        return this.processExtraction({

            tables:
                extractionResult.tables ?? [],

            metadata:
                extractionResult.metadata ?? {},

            analysis:
                extractionResult.analysis ?? {},

            resources:
                extractionResult.resources ?? {},

            strategy:
                extractionResult.strategy ?? {},

            html:
                extractionResult.html ?? null,

            text:
                extractionResult.text ?? null,

            links:
                extractionResult.links ?? []

        });

    }



    /**
     * Process a single tender.
     *
     * @param {Object} rawTender
     * @returns {Object}
     */
    static process(rawTender = {}) {

        const tender =
            TenderMapper.map(
                rawTender
            );

        const validation =
            TenderValidator.validate(
                tender
            );

        return {

            success:
                validation.valid,

            tender,

            errors:
                validation.errors

        };

    }



    /**
     * Process multiple tenders.
     *
     * @param {Array} rawTenders
     * @returns {Object}
     */
    static processMany(rawTenders = []) {

        const tenders = [];

        const errors = [];

        for (const rawTender of rawTenders) {

            const result =
                this.process(
                    rawTender
                );

            if (result.success) {

                tenders.push(
                    result.tender
                );

            }
            else {

                errors.push({

                    tender:
                        rawTender,

                    errors:
                        result.errors

                });

            }

        }

        return {

            success:
                errors.length === 0,

            total:
                rawTenders.length,

            valid:
                tenders.length,

            invalid:
                errors.length,

            tenders,

            errors

        };

    }



    /**
     * Remove duplicate tenders.
     *
     * @param {Array} tenders
     * @returns {Array}
     */
    static removeDuplicates(tenders = []) {

        const seen =
            new Set();

        return tenders.filter(tender => {

            const key =

                `${tender.title || ""}|`
                +
                `${tender.organization || ""}|`
                +
                `${tender.closingDate || ""}`;

            if (
                seen.has(key)
            ) {
                return false;
            }

            seen.add(key);

            return true;

        });

    }

}

export default TenderPipeline;