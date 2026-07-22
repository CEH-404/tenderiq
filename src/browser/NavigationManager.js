import logger from "../logger/logger.js";

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
            waitUntil: options.waitUntil || "networkidle",
            timeout: options.timeout || 30000
        });

        logger.success(`Navigation Complete`);

        return response;

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