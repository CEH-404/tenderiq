import logger from "../logger/logger.js";

class SearchExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.search === false) {
            return null;
        }

        logger.info("Extracting search information...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const search = await page.evaluate(() => {

            const input = document.querySelector(
                "input[type='search'],input[name*=search],input[id*=search],input[placeholder*=search i]"
            );

            if (!input) {
                return null;
            }

            const form = input.closest("form");

            return {

                exists: true,

                action: form?.action || "",

                method: form?.method || "GET",

                placeholder: input.placeholder || "",

                name: input.name || "",

                id: input.id || ""

            };

        });

        logger.success("Search extraction completed.");

        return search;

    }

}

export default SearchExtractor;