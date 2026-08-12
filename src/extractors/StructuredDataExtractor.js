import logger from "../logger/logger.js";

class StructuredDataExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.structuredData === false) {
            return [];
        }

        logger.info("Extracting structured data...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const data = await page.evaluate(() => {

            const results = [];

            document
                .querySelectorAll(
                    "script[type='application/ld+json']"
                )
                .forEach(script => {

                    try {

                        results.push(
                            JSON.parse(script.textContent)
                        );

                    }

                    catch {

                    }

                });

            return results;

        });

        logger.success(`${data.length} structured data block(s) extracted.`);

        return data;

    }

}

export default StructuredDataExtractor;