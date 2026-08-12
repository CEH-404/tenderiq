import Framework from "../core/Framework.js";
import logger from "../logger/logger.js";

class Crawler {

    constructor(options = {}) {

        this.framework =
            new Framework();

        this.options = options;

        this.initialized = false;

    }

    async initialize() {

        if (this.initialized) {

            return;

        }

        logger.info(

            "Initializing Crawler..."

        );

        await this.framework.initialize();

        this.initialized = true;

        logger.success(

            "Crawler Ready."

        );

    }

    async crawl(url, options = {}) {

        if (!this.initialized) {

            await this.initialize();

        }

        logger.info(

            `Crawling: ${url}`

        );

        const result =

            await this.framework.scrape(

                url,

                {

                    ...this.options,

                    ...options

                }

            );

        logger.success(

            "Crawl completed."

        );

        return result;

    }

    async extract(url, options = {}) {

        if (!this.initialized) {

            await this.initialize();

        }

        return await this.framework.extract(

            url,

            {

                ...this.options,

                ...options

            }

        );

    }

    async knowledge(url, options = {}) {

        if (!this.initialized) {

            await this.initialize();

        }

        return await this.framework.knowledge(

            url,

            {

                ...this.options,

                ...options

            }

        );

    }

    async shutdown() {

        if (!this.initialized) {

            return;

        }

        await this.framework.shutdown();

        this.initialized = false;

        logger.success(

            "Crawler Shutdown."

        );

    }

}

export default Crawler;