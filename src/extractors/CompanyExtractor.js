import logger from "../logger/logger.js";

class CompanyExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.company === false) {
            return {};
        }

        logger.info("Extracting company information...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const company = await page.evaluate(() => {

            const body = document.body.innerText;

            return {

                title: document.title,

                companyName:
                    document.querySelector("h1")?.innerText.trim() || "",

                description:
                    document.querySelector(
                        "meta[name='description']"
                    )?.content || "",

                emails:
                    body.match(
                        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
                    ) || [],

                phones:
                    body.match(
                        /\+?\d[\d\s\-()]{8,}/g
                    ) || [],

                address:
                    [...document.querySelectorAll("address")]
                        .map(el => el.innerText.trim()),

                socialLinks:
                    [...document.links]
                        .map(a => a.href)
                        .filter(link =>
                            /facebook|instagram|linkedin|twitter|youtube|tiktok/i
                                .test(link)
                        ),

                logo:
                    document.querySelector(
                        "header img,img[alt*=logo i]"
                    )?.src || ""

            };

        });

        logger.success("Company information extracted.");

        return company;

    }

}

export default CompanyExtractor;