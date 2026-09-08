import logger from "../logger/Logger.js";

class TextExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.text === false) {
            return {};
        }

        logger.info("Extracting text...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const text = await page.evaluate(() => {

            const normalize = str =>
                (str || "")
                    .replace(/\s+/g, " ")
                    .trim();

            const body = normalize(document.body.innerText);

            return {

                title: document.title,

                text: body,

                wordCount:
                    body.length
                        ? body.split(/\s+/).length
                        : 0,

                paragraphs:
                    [...document.querySelectorAll("p")]
                        .map(p => normalize(p.innerText))
                        .filter(Boolean),

                headings:
                    [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")]
                        .map(h => normalize(h.innerText))
                        .filter(Boolean)

            };

        });

        logger.success("Text extracted.");

        return text;

    }

}

export default TextExtractor;