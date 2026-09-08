import { chromium, firefox, webkit } from "playwright";
import env from "../config/env.js";
import logger from "../logger/Logger.js";

class BrowserManager {
    constructor() {
        this.browser = null;
        this.isRunning = false;
    }

    async launch() {
        try {
            if (this.browser) {
                logger.warning("Browser is already running.");
                return this.browser;
            }

            logger.info(`Launching ${env.browser} browser...`);

            switch (env.browser.toLowerCase())  {
                case "chromium":
                    this.browser = await chromium.launch({
                        headless: env.headless
                    });
                    break;

                case "firefox":
                    this.browser = await firefox.launch({
                        headless: env.headless
                    });
                    break;

                case "webkit":
                    this.browser = await webkit.launch({
                        headless: env.headless
                    }); 
                    break;

                default:
                    throw new Error(`Unsupported browser: ${env.browser}`);
            }

            this.isRunning = true;

            logger.success(`${env.browser} launched successfully.`);

            return this.browser;

        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }

    getBrowser() {
        if (!this.browser) {
            throw new Error("Browser has not been launched.");
        }

        return this.browser;
    }

    isBrowserRunning() {
        return this.isRunning;
    }

    async restart() {
        logger.warning("Restarting browser...");

        await this.close();

        return await this.launch();
    }

    async close() {
        try {
            if (!this.browser) {
                logger.warning("No browser is currently running.");
                return;
            }

            await this.browser.close();

            this.browser = null;
            this.isRunning = false;

            logger.success("Browser closed successfully.");

        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }
}

export default BrowserManager;