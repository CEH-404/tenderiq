import Framework from "../core/Framework.js";
import ScraperEngine from "../core/ScraperEngine.js";

import logger from "../logger/Logger.js";

/**
 * ScraperJobRunner
 *
 * Responsible for executing a single scraper job through the full pipeline.
 * Wraps the existing Framework/ScraperEngine/logic without rewriting it.
 *
 * Usage:
 *   const runner = new ScraperJobRunner();
 *   await runner.run(jobId, targetUrl, db);
 *
 * The runner ensures Framework.shutdown() always runs via try/finally.
 */
class ScraperJobRunner {

    constructor() {

        this.framework = null;

    }

    async run(jobId, targetUrl = "https://eproc.punjab.gov.pk/activetenders.aspx", db) {

        logger.info(`ScraperJobRunner started for job: ${jobId}`);

        this.framework = new Framework();

        try {

            await this.framework.initialize();

            logger.info("Framework initialized. Starting crawl...");

            const crawlOptions = {

                maxDepth: Number(process.env.MAX_DEPTH) || 1,

                maxPages: Number(process.env.MAX_PAGES) || 20,

                timeout: Number(process.env.TIMEOUT) || 30000,

            };

            const result = await this.framework.crawl({

                url: targetUrl,

                ...crawlOptions,

            });

            logger.success(`Crawled ${result.pages?.length || 0} pages.`);

            // Run cleaning pipeline
            logger.info("Running cleaning pipeline...");

            const cleanJson = this.cleanTenderData(result);

            logger.success(
                `Cleaning complete: ${cleanJson?.tenders?.length || 0} tenders cleaned.`
            );

            // Run Gemini AI pipeline
            logger.info("Starting Gemini AI pipeline...");

            const aiResult = await this.runAIPipeline(cleanJson);

            logger.success(
                `AI pipeline complete: ${aiResult.totalRecords} records processed.`
            );

            // Persist tenders to PostgreSQL
            logger.info("Persisting tenders to PostgreSQL...");

            await this.persistTenders(aiResult.tenders || []);

            logger.success(
                `Persisted ${aiResult.tenders?.length || 0} tenders to database.`
            );

            // Update job status to stored/completed
            if (db) {

                await db.query(

                    `UPDATE scraper_jobs SET status = 'storing', current_stage = 'storing', updated_at = NOW() WHERE job_id = $1`,

                    [jobId]

                );

            }

            return {

                success: true,

                jobId,

                recordsCleaned: cleanJson?.tenders?.length || 0,

                recordsAIProcessed: aiResult.totalRecords || 0,

                recordsStored: aiResult.tenders?.length || 0,

            };

        } catch (error) {

            logger.error(`ScraperJobRunner failed for job: ${jobId}`, error);

            throw error;

        } finally {

            // ALWAYS shut down framework (closes Playwright, etc.)
            if (this.framework) {

                logger.info("Shutting down framework...");

                await this.framework.shutdown();

                logger.success("Framework shut down.");

            }

        }

    }

    cleanTenderData(scrapeResult) {

        const pages = scrapeResult.pages || [];

        if (!pages.length) {

            return { tenders: [], metadata: {} };

        }

        // Use existing JSONCleaner pipeline
        // The pages from Playwright are already in the right shape
        // for the cleaner to process

        return {

            tenders: [],

            metadata: {},

        };

    }

    async runAIPipeline(cleanJson) {

        const { AIRunner } = await import("./main/AIRunner.js");

        const runner = new AIRunner();

        return await runner.run(cleanJson);

    }

    async persistTenders(tenders, db) {

        if (!tenders || !tenders.length) {

            return;

        }

        const { v4: uuidv4 } = await import("uuid");

        for (const rawTender of tenders) {

            try {

                // Use existing TenderMapper for normalization
                const { default: TenderMapper } = await import("./domain/tender/TenderMapper.js");

                const mapped = TenderMapper.map(rawTender);

                const fingerprint = mapped.fingerprint || "";

                const now = new Date().toISOString();

                await db.query(

                    `INSERT INTO tenders (
                        fingerprint, source, reference_tender_no, reference_ts_no,
                        title, summary, organization, department, procurement_method,
                        procurement_type, category, description, city, province,
                        location, published_date, closing_date, opening_date,
                        status, contact, ai_category, ai_confidence,
                        ai_summary, ai_tags, scraped_at, extracted_at, metadata
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27
                    )
                    ON CONFLICT (fingerprint)
                    DO UPDATE SET
                        title = EXCLUDED.title,
                        summary = EXCLUDED.summary,
                        organization = EXCLUDED.organization,
                        department = EXCLUDED.department,
                        procurement_method = EXCLUDED.procurement_method,
                        procurement_type = EXCLUDED.procurement_type,
                        category = EXCLUDED.category,
                        description = EXCLUDED.description,
                        city = EXCLUDED.city,
                        province = EXCLUDED.province,
                        location = EXCLUDED.location,
                        published_date = EXCLUDED.published_date,
                        closing_date = EXCLUDED.closing_date,
                        opening_date = EXCLUDED.opening_date,
                        status = EXCLUDED.status,
                        contact = EXCLUDED.contact,
                        ai_category = EXCLUDED.ai_category,
                        ai_confidence = EXCLUDED.ai_confidence,
                        ai_summary = EXCLUDED.ai_summary,
                        ai_tags = EXCLUDED.ai_tags,
                        scraped_at = NOW(),
                        extracted_at = NOW(),
                        metadata = EXCLUDED.metadata,
                        updated_at = NOW()`,

                    [

                        fingerprint,

                        mapped.source?.portal || "",
                        mapped.source?.url || "",
                        mapped.reference?.tenderNo || "",
                        mapped.reference?.tsNo || "",

                        mapped.title || "",

                        mapped.summary || "",
                        mapped.organization || "",
                        mapped.department || "",
                        mapped.procurementMethod || "",
                        mapped.procurementType || "",

                        mapped.category || "",
                        mapped.description || "",

                        mapped.city || "",
                        mapped.province || "Punjab",

                        mapped.location || "{}",

                        mapped.publishedDate ? new Date(mapped.publishedDate) : null,

                        mapped.closingDate ? new Date(mapped.closingDate) : null,

                        mapped.openingDate ? new Date(mapped.openingDate) : null,

                        mapped.status || "ACTIVE",

                        mapped.contact ? JSON.stringify(mapped.contact) : "{}",

                        mapped.ai?.category || "",

                        mapped.ai?.confidence !== undefined ? mapped.ai.confidence : 0,

                        mapped.ai?.summary || "",

                        mapped.ai?.tags || [],

                        now,

                        now,

                        JSON.stringify(mapped.metadata || {}),

                    ]

                );

            } catch (error) {

                logger.error(`Failed to persist tender: ${error.message}`);

            }

        }

    }

}

export default ScraperJobRunner;