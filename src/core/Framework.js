import ScraperEngine from "./ScraperEngine.js";

class Framework {

    constructor() {

        this.engine =
            new ScraperEngine();

        this.initialized =
            false;

    }

    async initialize() {

        if (this.initialized) {

            return;

        }

        await this.engine.initialize();

        this.initialized = true;

    }

    async crawl(url, options = {}) {

        await this.initialize();

        return await this.engine.scrape(

            url,

            options

        );

    }

    async scrape(url, options = {}) {

        await this.initialize();

        return await this.engine.scrape(

            url,

            options

        );

    }

    async extract(url, options = {}) {

        await this.initialize();

        const result =

            await this.engine.scrape(

                url,

                options

            );

        return result.raw;

    }

    async knowledge(url, options = {}) {

        await this.initialize();

        const result =

            await this.engine.scrape(

                url,

                options

            );

        return result.knowledge;

    }

    async shutdown() {

        if (!this.initialized) {

            return;

        }

        await this.engine.shutdown();

        this.initialized = false;

    }

}

export default Framework;