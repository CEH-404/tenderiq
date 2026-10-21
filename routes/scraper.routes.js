import express from "express";
import Framework from "../src/core/Framework.js";
import logger from "../src/logger/Logger.js";

const router = express.Router();

router.get("/start", async (req, res) => {

    logger.info("SCRAPER_ROUTE_ENTERED");

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

            logger.info("SCRAPER_ROUTE_RETURNED");

            return res.status(502).json({

                success: false,

                message:
                    "Scraper completed successfully, but AI processing " +
                    "did not produce an output file.",

                stats

});

        }

        logger.info("SCRAPER_ROUTE_RETURNED");

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

        logger.info("SCRAPER_ROUTE_RETURNED");

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

router.get("/network-test", async (req, res) => {

    logger.info("NETWORK_TEST_STARTED");

    let browser = null;

    let context = null;

    let page = null;

    try {

const browserManager =
        new (await import("../src/browser/BrowserManager.js").then((mod) => mod.default));

        browser = await browserManager.launch();

        context = await browser.newContext();

        page = await context.newPage();

        logger.info("NETWORK_TEST_GOTO_STARTED");

        const response = await page.goto("https://example.com", {

            waitUntil: "domcontentloaded",

            timeout: 30000

        });

        const pageTitle = await page.title();

        const finalUrl = page.url();

        logger.info("NETWORK_TEST_GOTO_RETURNED");

        logger.info(`HTTP_STATUS=${response ? response.status() : "null"}`);

        logger.info(`FINAL_URL=${finalUrl}`);

        logger.info(`PAGE_TITLE=${pageTitle}`);

        logger.info("NETWORK_TEST_COMPLETED");

        return res.json({

            success: true,

            status: response ? response.status() : null,

            finalUrl: finalUrl || null,

            title: pageTitle || null

        });

    }

    catch (error) {

        logger.info("NETWORK_TEST_FAILED");

        logger.info(`ERROR_NAME=${error.name || "unknown"}`);

        logger.info(`ERROR_MESSAGE=${error.message || "unknown"}`);

        return res.json({

            success: false,

            error: error.message || "unknown"

        });

    }

    finally {

        if (page) {

            await page.close();

        }

        if (context) {

            await context.close();

        }

        if (browser) {

            await browser.close();

        }

    }
});

router.get("/diagnostic", async (req, res) => {

    const targetUrls = [

        "https://example.com",

        "https://www.google.com",

        "https://eproc.punjab.gov.pk/activetenders.aspx"

    ];

    const results = [];

    for (const targetUrl of targetUrls) {

        const controller = new AbortController();

        const timeoutId = setTimeout(() => controller.abort(), 30000);

        let startMs = Date.now();

        let result = {

            success: false,

            status: null,

            statusText: null,

            responseUrl: null,

            contentType: null,

            contentLength: null,

            bytesReceived: null,

            elapsedMs: null,

            errorName: null,

            errorCode: null,

            errorMessage: null,

            causeName: null,

            causeCode: null,

            causeMessage: null,

            causeErrno: null,

            causeSyscall: null,

            causeHostname: null

        };

        try {

            const response = await fetch(targetUrl, {

                signal: controller.signal,

                method: "GET",

                headers: {

                    "User-Agent": "TenderIQ-Diagnostic/1.0"

                }

            });

            clearTimeout(timeoutId);

            const elapsedMs = Date.now() - startMs;

            result.success = true;

            result.status = response.status;

            result.statusText = response.statusText;

            result.responseUrl = response.url;

            result.contentType = response.headers.get("content-type");

            result.contentLength = response.headers.get("content-length");

            // Read body to verify we can receive data, but don't expose it

            const readable = response.body;

            if (readable) {

                let received = 0;

                const reader = readable.getReader();

                while (true) {

                    const { done, value } = await reader.read();

                    if (done) break;

                    received += value?.length || 0;

                }

                result.bytesReceived = received;

            }

            result.elapsedMs = elapsedMs;

        } catch (error) {

            // Extract detailed error information

            result.errorName = error.name || "unknown";

            // @ts-ignore

            result.errorCode = error.code || error.cause?.code || null;

            // @ts-ignore

            result.errorMessage = error.message || error.cause?.message || null;

            // @ts-ignore

            result.errorName = error.cause?.name || error.name || "unknown";

            // @ts-ignore

            result.errorCode = error.cause?.code || error.code || null;

            // @ts-ignore

            result.errorMessage = error.cause?.message || error.message || "unknown";

            // Attempt to extract additional system-level error details

            // @ts-ignore

            if (error.cause) {

                // @ts-ignore

                result.errorCode = error.cause.code || result.errorCode;

                // @ts-ignore

                result.errorMessage = error.cause.message || result.errorMessage;

                // @ts-ignore

                result.errorName = error.cause.name || result.errorName;

                // @ts-ignore

                // Check for system error properties

                // @ts-ignore

                if (error.cause.errno !== undefined) {

                    result.errorCode = error.cause.errno;

                }

                // @ts-ignore

                if (error.cause.syscall !== undefined) {

                    // Can store syscall separately or include in message

                }

                // @ts-ignore

                if (error.cause.hostname !== undefined) {

                    // Can store hostname separately or include in message

                }

            }

            result.elapsedMs = Date.now() - startMs;

        }

        results.push(result);

    }

    return res.json({

        diagnosticUrls: targetUrls,

        results: results

    });

});

export default router