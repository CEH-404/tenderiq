import logger from "../logger/Logger.js";
import URLNormalizer from "../scraper/URLNormalizer.js";

class LinkExtractor {

    constructor(pageManager) {

        if (!pageManager) {

            throw new Error(
                "PageManager instance is required."
            );

        }

        this.pageManager = pageManager;

    }

    getPage(pageId) {

        const page =
            this.pageManager.get(pageId);

        if (!page) {

            throw new Error(
                `Page not found: ${pageId}`
            );

        }

        return page;

    }

    async extract(pageId, strategy = null) {

        if (
            strategy &&
            strategy.links === false
        ) {

            return [];

        }

        try {

            const page =
                this.getPage(pageId);

            logger.info(
                "Extracting links..."
            );

            const baseUrl =
                page.url();

            const rawLinks =
                await page.$$eval(

                    "a",

                    anchors =>

                        anchors.map(anchor => ({

                            text:

                                anchor.textContent
                                    ?.trim() || "",

                            href:

                                anchor.getAttribute("href") || "",

                            title:

                                anchor.title || "",

                            target:

                                anchor.target || "_self",

                            rel:

                                anchor.rel || ""

                        }))

                );

            const links = [];

            const visited =
                new Set();

            for (const link of rawLinks) {

                if (!link.href)
                    continue;

                const analysis =
                    URLNormalizer.analyze(
                        link.href,
                        baseUrl
                    );

                if (!analysis.valid)
                    continue;

                if (
                    visited.has(
                        analysis.url
                    )
                ) {

                    continue;

                }

                visited.add(
                    analysis.url
                );

                const parsed =
                    new URL(
                        analysis.url
                    );

                links.push({

                    text:
                        link.text,

                    href:
                        analysis.url,

                    title:
                        link.title,

                    target:
                        link.target,

                    rel:
                        link.rel,

                    hostname:
                        parsed.hostname,

                    pathname:
                        parsed.pathname,

                    internal:
                        URLNormalizer.isInternal(
                            analysis.url,
                            baseUrl
                        ),

                    external:
                        !URLNormalizer.isInternal(
                            analysis.url,
                            baseUrl
                        ),

                    type:
                        analysis.type,

                    priority:
                        analysis.priority

                });

            }
            // ----------------------------------
            // Sort Links by Priority
            // ----------------------------------

            links.sort((a, b) =>

                b.priority - a.priority

            );

            // ----------------------------------
            // Statistics
            // ----------------------------------

            const stats = {

                total:
                    links.length,

                internal:
                    links.filter(link =>
                        link.internal
                    ).length,

                external:
                    links.filter(link =>
                        link.external
                    ).length,

                pages:
                    links.filter(link =>
                        link.type === "page"
                    ).length,

                products:
                    links.filter(link =>
                        link.type === "product"
                    ).length,

                categories:
                    links.filter(link =>
                        link.type === "category"
                    ).length,

                pagination:
                    links.filter(link =>
                        link.type === "pagination"
                    ).length

            };

            logger.success(

                `${stats.total} crawlable links extracted.`

            );

            logger.info(

                `Internal: ${stats.internal} | External: ${stats.external}`

            );

            logger.info(

                `Pages: ${stats.pages} | Categories: ${stats.categories} | Products: ${stats.products} | Pagination: ${stats.pagination}`

            );

            return links;

        }

        catch (error) {

            logger.error(

                `Link extraction failed: ${error.message}`

            );

            throw error;

        }

    }

    async internal(pageId) {

        const links =
            await this.extract(pageId);

        return links.filter(link =>
            link.internal
        );

    }

    async external(pageId) {

        const links =
            await this.extract(pageId);

        return links.filter(link =>
            link.external
        );

    }

    async pagination(pageId) {

        const links =
            await this.extract(pageId);

        return links.filter(link =>

            link.type === "pagination"

        );

    }

    async products(pageId) {

        const links =
            await this.extract(pageId);

        return links.filter(link =>

            link.type === "product"

        );

    }

    async categories(pageId) {

        const links =
            await this.extract(pageId);

        return links.filter(link =>

            link.type === "category"

        );

    }

    async count(pageId) {

        const links =
            await this.extract(pageId);

        return links.length;

    }

        async exists(pageId, href) {

        const normalized =
            URLNormalizer.normalize(href);

        if (!normalized)
            return false;

        const links =
            await this.extract(pageId);

        return links.some(link =>

            link.href === normalized

        );

    }

}

export default LinkExtractor;