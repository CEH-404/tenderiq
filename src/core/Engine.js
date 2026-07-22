import BrowserManager from "../browser/BrowserManager.js";
import ContextManager from "../browser/ContextManager.js";
import PageManager from "../browser/PageManager.js";
import NavigationManager from "../browser/NavigationManager.js";

import HTMLExtractor from "../extractors/HTMLExtractor.js";
import TextExtractor from "../extractors/TextExtractor.js";
import LinkExtractor from "../extractors/LinkExtractor.js";
import MetadataExtractor from "../extractors/MetadataExtractor.js";
import TableExtractor from "../extractors/TableExtractor.js";
import GridExtractor from "../extractors/GridExtractor.js";

import logger from "../logger/logger.js";


class Engine {

    constructor() {

        this.browserManager = new BrowserManager();

        this.contextManager = null;

        this.pageManager = null;

        this.navigationManager = null;

    }

    async initialize() {

        logger.info("Initializing Engine...");

        await this.browserManager.launch();

        this.contextManager =
            new ContextManager(this.browserManager);

        this.pageManager =
            new PageManager(this.contextManager);

        this.navigationManager =
            new NavigationManager(this.pageManager);

        logger.success("Engine Ready.");

    }

    async scrape(url) {

        const contextId =
            await this.contextManager.create();

        const pageId =
            await this.pageManager.create(contextId);

        await this.navigationManager.goto(
            pageId,
            url
        );

        const htmlExtractor =
            new HTMLExtractor(this.pageManager);

        const textExtractor =
            new TextExtractor(this.pageManager);

        const linkExtractor =
            new LinkExtractor(this.pageManager);

        const metadataExtractor =
            new MetadataExtractor(this.pageManager);

        const tableExtractor =
            new TableExtractor(this.pageManager);

        const gridExtractor =
            new GridExtractor(this.pageManager);

        const result = {

            url,

            html:
                await htmlExtractor.extract(pageId),

            text:
                await textExtractor.extract(pageId),

            links:
                await linkExtractor.extract(pageId),

            metadata:
                await metadataExtractor.extract(pageId),

            tables:
                await tableExtractor.extract(pageId),

            grid:
                await gridExtractor.extract(pageId)

        };

        // await this.pageManager.close(pageId);

        // await this.contextManager.close(contextId);

        return result;

    }

    async shutdown() {

        await this.browserManager.close();

        logger.success("Engine Shutdown.");

    }

}

export default Engine;