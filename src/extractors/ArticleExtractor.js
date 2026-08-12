import logger from "../logger/logger.js";

class ArticleExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.article === false) {
            return {};
        }

        logger.info("Extracting article...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const article = await page.evaluate(() => {

            const root =
                document.querySelector("article,main") ||
                document.body;

            const headings =
                [...root.querySelectorAll("h1,h2,h3")]

                    .map(el => el.innerText.trim());

            const paragraphs =
                [...root.querySelectorAll("p")]

                    .map(el => el.innerText.trim())

                    .filter(Boolean);

            const images =
                [...root.querySelectorAll("img")]

                    .map(img => img.src);

            return {

                title:
                    document.querySelector("h1")
                        ?.innerText.trim() ||

                    document.title,

                description:

                    document.querySelector(
                        "meta[name='description']"
                    )?.content || "",

                headings,

                paragraphs,

                images,

                wordCount:

                    paragraphs
                        .join(" ")
                        .split(/\s+/)
                        .length

            };

        });

        logger.success("Article extracted.");

        return article;

    }

}

export default ArticleExtractor;