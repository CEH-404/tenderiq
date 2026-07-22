import logger from "../logger/logger.js";

class LinkExtractor {

    constructor(pageManager) {

        if (!pageManager) {
            throw new Error("PageManager instance is required.");
        }

        this.pageManager = pageManager;

    }

    getPage(pageId) {

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        return page;

    }

    async extract(pageId) {

        try {

            const page = this.getPage(pageId);

            logger.info("Extracting links...");

            const links = await page.$$eval("a", (anchors) =>

                anchors.map(anchor => ({

                    text: anchor.textContent.trim(),

                    href: anchor.href,

                    title: anchor.title || "",

                    target: anchor.target || "_self",

                    rel: anchor.rel || ""

                }))

            );

            const origin = new URL(page.url()).origin;

            const cleaned = [];

            const visited = new Set();

            for (const link of links) {

                if (!link.href) continue;

                const href = link.href.trim();

                if (
                    href.startsWith("javascript:") ||
                    href.startsWith("mailto:") ||
                    href.startsWith("tel:") ||
                    href === "#"
                ) {
                    continue;
                }

                if (visited.has(href)) {
                    continue;
                }

                visited.add(href);

                cleaned.push({

                    ...link,

                    internal: href.startsWith(origin),

                    external: !href.startsWith(origin)

                });

            }

            logger.success(`${cleaned.length} links extracted.`);

            return cleaned;

        }

        catch (error) {

            logger.error(error.message);

            throw error;

        }

    }

    async internal(pageId) {

        const links = await this.extract(pageId);

        return links.filter(link => link.internal);

    }

    async external(pageId) {

        const links = await this.extract(pageId);

        return links.filter(link => link.external);

    }

    async count(pageId) {

        const links = await this.extract(pageId);

        return links.length;

    }

    async exists(pageId, href) {

        const links = await this.extract(pageId);

        return links.some(link => link.href === href);

    }

}

export default LinkExtractor;