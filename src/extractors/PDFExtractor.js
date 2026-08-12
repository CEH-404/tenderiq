import logger from "../logger/logger.js";

class PDFExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.pdfs === false) {
            return [];
        }

        logger.info("Extracting PDF links...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const pdfs = await page.evaluate(() => {

            return [...document.querySelectorAll("a[href$='.pdf'],a[href*='.pdf?']")]

                .map(link => ({

                    text: link.innerText.trim(),

                    url: link.href

                }))

                .filter(pdf => pdf.url);

        });

        logger.success(`${pdfs.length} PDF(s) extracted.`);

        return pdfs;

    }

}

export default PDFExtractor;