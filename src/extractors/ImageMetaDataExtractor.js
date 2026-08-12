import logger from "../logger/logger.js";

class ImageMetadataExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.imageMetadata === false) {
            return [];
        }

        logger.info("Extracting image metadata...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const images = await page.evaluate(() => {

            return [...document.images]
                .map(img => ({

                    src: img.currentSrc || img.src,

                    alt: img.alt || "",

                    title: img.title || "",

                    width: img.naturalWidth,

                    height: img.naturalHeight,

                    loading: img.loading || "auto",

                    decoding: img.decoding || "auto",

                    lazy:
                        img.loading === "lazy",

                    fileName:
                        (img.currentSrc || img.src)
                            .split("/")
                            .pop()
                            ?.split("?")[0] || ""

                }))
                .filter(img => img.src);

        });

        logger.success(`${images.length} image metadata extracted.`);

        return images;

    }

}

export default ImageMetadataExtractor;