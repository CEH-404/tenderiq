import { randomUUID } from "crypto";
import logger from "../logger/logger.js";

class ContextManager {
    constructor(browserManager) {
        if (!browserManager) {
            throw new Error("BrowserManager instance is required.");
        }

        this.browserManager = browserManager;

        this.contexts = new Map();
    }

    async create(options = {}) {
        try {
            const browser = this.browserManager.getBrowser();

            if (!browser) {
                throw new Error("Browser is not running.");
            }

            const context = await browser.newContext(options);

            const id = randomUUID();

            this.contexts.set(id, context);

            logger.success(`Context Created: ${id}`);

            return id;
        } catch (error) {

            logger.error(`Failed to create context: ${error.message}`);

            throw error;
        }
    }

    get(id) {
        return this.contexts.get(id);
    }

    getAll() {
        return [...this.contexts.entries()];
    }

    has(id) {
        return this.contexts.has(id);
    }

    total() {
        return this.contexts.size;
    }

    async close(id) {
        try {

            const context = this.contexts.get(id);

            if (!context) {
                throw new Error(`Context not found: ${id}`);
            }

            await context.close();

            this.contexts.delete(id);

            logger.success(`Context Closed: ${id}`);

        } catch (error) {

            logger.error(`Failed to close context: ${error.message}`);

            throw error;
        }
    }

    async closeAll() {

        for (const [id, context] of this.contexts.entries()) {

            try {

                await context.close();

                logger.success(`Context Closed: ${id}`);

            } catch (error) {

                logger.error(`Error Closing Context ${id}: ${error.message}`);

            }

        }

        this.contexts.clear();
    }

    isEmpty() {
        return this.contexts.size === 0;
    }

    clearRegistry() {
        this.contexts.clear();
    }
}

export default ContextManager;