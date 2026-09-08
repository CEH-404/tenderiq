import fs from "fs/promises";
import logger from "../logger/Logger.js";

class HTMLExtractor {

    constructor(pageManager) {

        if (!pageManager) {
            throw new Error("PageManager instance is required.");
        }

        this.pageManager = pageManager;

    }

    getPage(pageId) {

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        return page;

    }

    async extract(pageId) {

        try {

            const page = this.getPage(pageId);

            logger.info("Extracting complete HTML...");

            const html = await page.content();

            logger.success("HTML extracted successfully.");

            return html;

        }

        catch (error) {

            logger.error(error.message);

            throw error;

        }

    }

    async extractBody(pageId) {

        try {

            const page = this.getPage(pageId);

            logger.info("Extracting BODY HTML...");

            return await page.locator("body").innerHTML();

        }

        catch (error) {

            logger.error(error.message);

            throw error;

        }

    }

    async extractElement(pageId, selector) {

        try {

            const page = this.getPage(pageId);

            logger.info(`Extracting element: ${selector}`);

            return await page.locator(selector).first().innerHTML();

        }

        catch (error) {

            logger.error(error.message);

            throw error;

        }

    }

    async exists(pageId, selector) {

        const page = this.getPage(pageId);

        const count = await page.locator(selector).count();

        return count > 0;

    }

    async count(pageId, selector) {

        const page = this.getPage(pageId);

        return await page.locator(selector).count();

    }

    async title(pageId) {

        const page = this.getPage(pageId);

        return await page.title();

    }

    async url(pageId) {

        const page = this.getPage(pageId);

        return page.url();

    }

    async save(pageId, filepath) {

        try {

            const html = await this.extract(pageId);

            await fs.writeFile(filepath, html, "utf8");

            logger.success(`HTML saved to ${filepath}`);

        }

        catch (error) {

            logger.error(error.message);

            throw error;

        }

    }

}

export default HTMLExtractor;