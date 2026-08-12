import logger from "../logger/logger.js";

class StyleExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.styles === false) {
            return [];
        }

        logger.info("Extracting stylesheets...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const styles = await page.evaluate(() => {

            const external = [...document.querySelectorAll("link[rel='stylesheet']")]

                .map(link => ({

                    type: "external",

                    href: link.href,

                    media: link.media || "all"

                }));

            const inline = [...document.querySelectorAll("style")]

                .map(style => ({

                    type: "inline",

                    size: style.innerHTML.length

                }));

            return [...external, ...inline];

        });

        logger.success(`${styles.length} stylesheet(s) extracted.`);

        return styles;

    }

}

export default StyleExtractor;