import logger from "../logger/Logger.js";

class ImageExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.images === false) {
            return [];
        }

        logger.info("Extracting images...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const images = await page.evaluate(() => {

            return [...document.images].map(img => ({

                src: img.currentSrc || img.src,

                alt: img.alt || "",

                title: img.title || "",

                width: img.naturalWidth,

                height: img.naturalHeight,

                loading: img.loading || "auto"

            }))
            .filter(img => img.src);

        });

        logger.success(`${images.length} image(s) extracted.`);

        return images;

    }

}

export default ImageExtractor;