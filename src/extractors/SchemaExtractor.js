import logger from "../logger/logger.js";

class SchemaExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.schema === false) {
            return [];
        }

        logger.info("Extracting structured schema...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const schemas = await page.evaluate(() => {

            const results = [];

            document
                .querySelectorAll(
                    'script[type="application/ld+json"]'
                )
                .forEach(script => {

                    try {

                        const json = JSON.parse(script.innerText);

                        results.push(json);

                    }

                    catch (e) {}

                });

            return results;

        });

        logger.success(`${schemas.length} schema object(s) extracted.`);

        return schemas;

    }

}

export default SchemaExtractor;