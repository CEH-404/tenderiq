import logger from "../logger/logger.js";

class GridExtractor {

    constructor(pageManager) {

        this.pageManager = pageManager;

    }

async extract(pageId, strategy = null) {

    if (strategy && strategy.grids === false) {
        return [];
    }

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

            if (elements.length < 2)
                continue;

            elements.forEach(element => {

                const title =
                    element.querySelector("h1,h2,h3,h4,.title")
                        ?.innerText.trim() || "";

                const description =
                    element.querySelector("p,.description")
                        ?.innerText.trim() || "";

                const text =
                    element.innerText?.trim() || "";

                const price =
                    text.match(/[$€£₹]|PKR|Rs|USD/i)
                        ? text
                        : "";

                const link =
                    element.querySelector("a")?.href || "";

                const image =
                    element.querySelector("img")?.src || "";

                const key = `${title}-${link}`;

                if (!seen.has(key) && (text || link)) {

                    seen.add(key);

                    results.push({

                        title,

                        description,

                        text,

                        price,

                        image,

                        link

                    });

                }

            });

        }

        return results;

    });

    logger.success(`${grids.length} grid item(s) extracted.`);

    return grids;

}

}

export default GridExtractor;
