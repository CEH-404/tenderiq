import { randomUUID } from "crypto";
import logger from "../logger/Logger.js";

class PageManager {

    constructor(contextManager) {

        if (!contextManager) {
            throw new Error("ContextManager instance is required.");
        }

        this.contextManager = contextManager;

        this.pages = new Map();

    }

    async create(contextId) {

        try {

            const context = this.contextManager.get(contextId);

            if (!context) {
                throw new Error(`Context not found: ${contextId}`);
            }

            const page = await context.newPage();

            const id = randomUUID();

            this.pages.set(id, page);

            logger.success(`Page Created: ${id}`);

            return id;

        } catch (error) {

            logger.error(error.message);

            throw error;

        }

    }

    get(id) {

        return this.pages.get(id);

    }

    has(id) {

        return this.pages.has(id);

    }

    total() {

        return this.pages.size;

    }

    getAll() {

        return [...this.pages.entries()];

    }

    async close(id) {

        const page = this.pages.get(id);

        if (!page) {

            throw new Error(`Page not found: ${id}`);

        }

        await page.close();

        this.pages.delete(id);

        logger.success(`Page Closed: ${id}`);

    }

    getPage(pageId) {

    return this.pages.get(pageId);

    }

    async closeAll() {

        for (const [id, page] of this.pages.entries()) {

            try {

                await page.close();

                logger.success(`Page Closed: ${id}`);

            }

            catch (error) {

                logger.error(error.message);

            }

        }

        this.pages.clear();

    }

}

export default PageManager;