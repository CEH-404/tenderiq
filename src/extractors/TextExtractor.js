import fs from "fs/promises";
import logger from "../logger/logger.js";

class TextExtractor {

    constructor(pageManager) {

        this.pageManager = pageManager;

    }

    async extract(pageId) {

        logger.info("Extracting page text...");

        const page = this.pageManager.get(pageId);

        if (!page) {

            throw new Error(`Page not found: ${pageId}`);

        }

        const data = await page.evaluate(() => {

            const clean = (value) =>
                value ? value.trim().replace(/\s+/g, " ") : "";

            const getArray = (selector) =>
                [...document.querySelectorAll(selector)]
                    .map(el => clean(el.innerText))
                    .filter(Boolean);

            return {

                title:
                    clean(document.title),

                h1:
                    getArray("h1"),

                h2:
                    getArray("h2"),

                h3:
                    getArray("h3"),

                paragraphs:
                    getArray("p"),

                lists:
                    getArray("li"),

                blockquotes:
                    getArray("blockquote"),

                code:
                    getArray("pre"),

                article:

                    clean(

                        document.querySelector("article")?.innerText ||

                        ""

                    ),

                body:

                    clean(document.body.innerText)

            };

        });

        logger.success("Text extracted successfully.");

        return data;

    }

    async save(pageId, filePath) {

        const text = await this.extract(pageId);

        await fs.writeFile(

            filePath,

            JSON.stringify(text, null, 4),

            "utf8"

        );

        logger.success(`Text saved to ${filePath}`);

    }

}

export default TextExtractor;