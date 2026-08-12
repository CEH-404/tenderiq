import express from "express";
import Framework from "../src/core/Framework.js";

const router = express.Router();

router.get("/start", async (req, res) => {

    let framework = null;

    try {

        framework = new Framework();

        await framework.initialize();

        const result = await framework.crawl({

            // Hardcoded URL
            url: "https://eproc.punjab.gov.pk/activetenders.aspx",

            // Hardcoded Settings
            maxDepth: 1,
            maxPages: 20,
            timeout: 30000

        });

        const stats = {

            pages: result.pages?.length || 0,
            duration: result.duration || 0

        };

        const aiFile = result.export?.aiJson;
        const aiTenders = result.ai?.tenders;

        // ScraperEngine swallows AI failures internally (scrape() still
        // resolves with success:true) so the AI step's own success has to
        // be checked here, from whether it actually produced a file.
        if (!aiFile || !Array.isArray(aiTenders)) {

            return res.status(502).json({

                success: false,

                message:
                    "Scraper completed successfully, but AI processing " +
                    "did not produce an output file.",

                stats

            });

        }

        return res.status(200).json({

            success: true,

            message: "Scraper and AI processing completed successfully.",

            stats,

            output: {

                file: aiFile,
                tenderCount: aiTenders.length,

                // Full contents of the AI JSON file written to `file` above
                // ({ metadata, tenders, failedBatches }) — not the raw
                // scraper/knowledge object.
                data: result.ai

            }

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Scraper execution failed.",

            error: error.message

        });

    }

    finally {

        if (framework) {

            await framework.shutdown();

        }

    }

});

export default router;