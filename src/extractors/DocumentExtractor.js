import logger from "../logger/logger.js";

class DocumentExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.documents === false) {
            return [];
        }

        logger.info("Extracting document links...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const documents = await page.evaluate(() => {

            const extensions = [

                ".pdf",
                ".doc",
                ".docx",
                ".xls",
                ".xlsx",
                ".ppt",
                ".pptx",
                ".csv",
                ".zip",
                ".rar"

            ];

            return [...document.querySelectorAll("a[href]")]

                .map(link => ({

                    text: link.innerText.trim(),

                    url: link.href

                }))

                .filter(item =>

                    extensions.some(ext =>

                        item.url.toLowerCase().includes(ext)

                    )

                );

        });

        logger.success(`${documents.length} document(s) extracted.`);

        return documents;

    }

}

export default DocumentExtractor;