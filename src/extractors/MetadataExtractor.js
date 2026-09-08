import logger from "../logger/Logger.js";

class MetadataExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.metadata === false) {
            return {};
        }

        logger.info("Extracting metadata...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const metadata = await page.evaluate(() => {

            const getMeta = name =>
                document.querySelector(`meta[name="${name}"]`)?.content ||
                document.querySelector(`meta[property="${name}"]`)?.content ||
                "";

            return {

                title: document.title,

                url: location.href,

                description: getMeta("description"),

                keywords: getMeta("keywords"),

                author: getMeta("author"),

                language: document.documentElement.lang || "",

                canonical:
                    document.querySelector("link[rel='canonical']")?.href || "",

                robots: getMeta("robots"),

                generator: getMeta("generator"),

                favicon:
                    document.querySelector("link[rel*='icon']")?.href || "",

                openGraph: {

                    title: getMeta("og:title"),

                    description: getMeta("og:description"),

                    image: getMeta("og:image"),

                    url: getMeta("og:url"),

                    type: getMeta("og:type")

                },

                twitter: {

                    card: getMeta("twitter:card"),

                    title: getMeta("twitter:title"),

                    description: getMeta("twitter:description"),

                    image: getMeta("twitter:image")

                }

            };

        });

        logger.success("Metadata extracted.");

        return metadata;

    }

}

export default MetadataExtractor;