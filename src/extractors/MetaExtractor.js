import logger from "../logger/Logger.js";

class MetaExtractor {

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

            const get = name =>
                document
                    .querySelector(`meta[name="${name}"]`)
                    ?.content || "";

            const getProperty = property =>
                document
                    .querySelector(`meta[property="${property}"]`)
                    ?.content || "";

            return {

                title: document.title,

                description: get("description"),

                keywords: get("keywords"),

                author: get("author"),

                robots: get("robots"),

                language:
                    document.documentElement.lang || "",

                canonical:
                    document
                        .querySelector("link[rel='canonical']")
                        ?.href || "",

                favicon:
                    document
                        .querySelector("link[rel*='icon']")
                        ?.href || "",

                openGraph: {

                    title: getProperty("og:title"),

                    description:
                        getProperty("og:description"),

                    image:
                        getProperty("og:image"),

                    url:
                        getProperty("og:url"),

                    type:
                        getProperty("og:type")

                },

                twitter: {

                    card: get("twitter:card"),

                    title: get("twitter:title"),

                    description:
                        get("twitter:description"),

                    image:
                        get("twitter:image")

                }

            };

        });

        logger.success("Metadata extracted.");

        return metadata;

    }

}

export default MetaExtractor;

class MetaExtractor {

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

            const get = name =>
                document
                    .querySelector(`meta[name="${name}"]`)
                    ?.content || "";

            const getProperty = property =>
                document
                    .querySelector(`meta[property="${property}"]`)
                    ?.content || "";

            return {

                title: document.title,

                description: get("description"),

                keywords: get("keywords"),

                author: get("author"),

                robots: get("robots"),

                language:
                    document.documentElement.lang || "",

                canonical:
                    document
                        .querySelector("link[rel='canonical']")
                        ?.href || "",

                favicon:
                    document
                        .querySelector("link[rel*='icon']")
                        ?.href || "",

                openGraph: {

                    title: getProperty("og:title"),

                    description:
                        getProperty("og:description"),

                    image:
                        getProperty("og:image"),

                    url:
                        getProperty("og:url"),

                    type:
                        getProperty("og:type")

                },

                twitter: {

                    card: get("twitter:card"),

                    title: get("twitter:title"),

                    description:
                        get("twitter:description"),

                    image:
                        get("twitter:image")

                }

            };

        });

        logger.success("Metadata extracted.");

        return metadata;

    }

}

export default MetaExtractor;