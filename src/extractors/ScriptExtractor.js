import logger from "../logger/Logger.js";

class ScriptExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.scripts === false) {
            return [];
        }

        logger.info("Extracting scripts...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const scripts = await page.evaluate(() => {

            return [...document.querySelectorAll("script")]

                .map(script => ({

                    src: script.src || "",

                    type: script.type || "text/javascript",

                    async: script.async,

                    defer: script.defer,

                    inline: !script.src,

                    size: script.innerHTML.length

                }));

        });

        logger.success(`${scripts.length} script(s) extracted.`);

        return scripts;

    }

}

export default ScriptExtractor;