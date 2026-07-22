import logger from "../logger/logger.js";

class GridExtractor {

    constructor(pageManager) {

        this.pageManager = pageManager;

    }

    async extract(pageId) {

        logger.info("Extracting grid items...");

        const page = this.pageManager.get(pageId);

        if (!page) {

            throw new Error(`Page not found: ${pageId}`);

        }

        const grids = await page.evaluate(() => {

            const selectors = [

                ".product",
                ".products .product",
                ".product-card",
                ".product-item",

                ".card",
                ".listing",
                ".listing-item",

                ".grid-item",
                ".grid > *",

                ".tender",
                ".tender-item",

                "[class*='product']",
                "[class*='card']",
                "[class*='listing']",
                "[class*='grid']"

            ];

            const results = [];

            const seen = new Set();

            for (const selector of selectors) {

                const elements = document.querySelectorAll(selector);

                if (elements.length < 2) {

                    continue;

                }

                elements.forEach(element => {

                    const text = element.innerText?.trim() || "";

                    const link =
                        element.querySelector("a")?.href || null;

                    const image =
                        element.querySelector("img")?.src || null;

                    const key =
                        `${text}-${link}`;

                    if (

                        !seen.has(key) &&

                        (text || link)

                    ) {

                        seen.add(key);

                        results.push({

                            text,

                            link,

                            image

                        });

                    }

                });

            }

            return results;

        });

        logger.success(

            `${grids.length} grid item(s) extracted.`

        );

        return grids;

    }

}

export default GridExtractor;
