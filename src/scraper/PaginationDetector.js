import logger from "../logger/logger.js";

class PaginationDetector {

    constructor(pageManager) {

        this.pageManager = pageManager;

    }

    async detect(pageId) {

        logger.info("Detecting pagination...");

        const page = this.pageManager.get(pageId);

        if (!page) {

            throw new Error(`Page not found: ${pageId}`);

        }

        const result = await page.evaluate(() => {

            const selectors = [

                "a[rel='next']",

                ".next",

                ".pagination-next",

                ".page-numbers.next",

                ".next-page",

                ".pager-next",

                ".pagination .next",

                ".pagination-next a",

                "a.next",

                "button.load-more",

                ".load-more",

                ".btn-load-more"

            ];

            for (const selector of selectors) {

                const element = document.querySelector(selector);

                if (!element) continue;

                const text =

                    element.innerText?.trim().toLowerCase() ||

                    "";

                const href =

                    element.href ||

                    "";

                if (

                    text.includes("load")

                ) {

                    return {

                        hasPagination: true,

                        type: "load-more",

                        selector,

                        href

                    };

                }

                return {

                    hasPagination: true,

                    type: "next",

                    selector,

                    href

                };

            }

            const pageNumbers =

                [...document.querySelectorAll("a")]

                .filter(a => /^\d+$/.test(a.innerText.trim()))

                .map(a => ({

                    page: Number(a.innerText),

                    href: a.href

                }));

            if (pageNumbers.length > 1) {

                return {

                    hasPagination: true,

                    type: "numbers",

                    pages: pageNumbers

                };

            }

            return {

                hasPagination: false

            };

        });

        logger.success("Pagination detection completed.");

        return result;

    }

}

export default PaginationDetector;