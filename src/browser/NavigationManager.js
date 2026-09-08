import logger from "../logger/Logger.js";
import PageReady from "./PageReady.js";

class NavigationManager {

    constructor(pageManager) {

        this.pageManager = pageManager;

    }

    async goto(pageId, url, options = {}) {

        const page = this.pageManager.getPage(pageId);

        if (!page) {

            throw new Error(`Page not found: ${pageId}`);

        }

        logger.info(`Navigating to ${url}`);

                const response = await page.goto(url, {
                    waitUntil: options.waitUntil || "domcontentloaded",
                    timeout: options.timeout || 30000
                });

                const pageReady = new PageReady(page);

                await pageReady.wait(
                    options.timeout || 60000
                );


                try {
                    await page.waitForLoadState("load", {
                        timeout: 10000
                    });
                } catch (e) {
                    // Ignore if page never fully reaches "load"
                }

                await page.waitForTimeout(2000);

        logger.success(`Navigation Complete`);

        return response;

    }

    

    async waitUntilReady(page) {
        const maxWait = 30000;
        const start = Date.now();
        while (Date.now() - start < maxWait) {
            try {
                // Wait until DOM is fully loaded
                await page.waitForLoadState("domcontentloaded");
                const pageInfo = await page.evaluate(() => {
                    return {
                        title: document.title,

                        body: document.body
                            ? document.body.innerText
                            : "",

                        readyState: document.readyState

                    };

                });

                const text = (
                    pageInfo.title +
                    " " +
                    pageInfo.body
                ).toLowerCase();

                // Cloudflare / Bot challenge detection
                const challengeDetected =

                    text.includes("checking your browser") ||

                    text.includes("just a moment") ||

                    text.includes("verify you are human") ||

                    text.includes("attention required") ||

                    text.includes("cf-browser-verification") ||

                    text.includes("challenge");

                // If no challenge and page is fully loaded
                if (

                    !challengeDetected &&

                    pageInfo.readyState === "complete"

                ) {

                    return;

                }

                // Wait a little and check again
                await page.waitForTimeout(1000);

            }

            catch {

                await page.waitForTimeout(1000);

            }

        }

        console.warn(
            "waitUntilReady(): timed out, continuing anyway..."
        );

    }

    async reload(pageId) {

        const page = this.pageManager.getPage(pageId);

        if (!page) {

            throw new Error(`Page not found`);

        }

        logger.info("Reloading Page");

        await page.reload({
            waitUntil: "networkidle"
        });

        logger.success("Page Reloaded");

    }

    async back(pageId) {

        const page = this.pageManager.getPage(pageId);

        if (!page) {

            throw new Error("Page not found");

        }

        await page.goBack();

        logger.success("Back Navigation Complete");

    }

    async forward(pageId) {

        const page = this.pageManager.getPage(pageId);

        if (!page) {

            throw new Error("Page not found");

        }

        await page.goForward();

        logger.success("Forward Navigation Complete");

    }

    url(pageId) {

        const page = this.pageManager.getPage(pageId);

        if (!page) {

            throw new Error("Page not found");

        }

        return page.url();

    }

    async wait(pageId, milliseconds) {

        const page = this.pageManager.getPage(pageId);

        if (!page) {

            throw new Error("Page not found");

        }

        await page.waitForTimeout(milliseconds);

    }

}

export default NavigationManager;