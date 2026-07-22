import logger from "../logger/logger.js";
import URLNormalizer from "./URLNormalizer.js";
import KnowledgeMerger from "../intelligence/KnowledgeMerger.js";

class Crawler {

    constructor(framework, options = {}) {

        this.framework = framework;

        this.queue = [];

        this.visited = new Set();

        // Store page knowledge directly
        this.pageKnowledge = [];

        this.maxPages =
            options.maxPages || 100;

        this.maxDepth =
            options.maxDepth || 3;

        this.stats = {

            pagesVisited: 0,

            htmlPages: 0,

            errors: 0,

            resources: 0,

            startTime: null,

            endTime: null

        };

        this.knowledgeMerger =
            new KnowledgeMerger();

    }

    async crawl(startUrl) {

        logger.info("Crawler Started.");

        this.stats.startTime = Date.now();

        const normalized =
            URLNormalizer.normalize(startUrl);

        if (!normalized) {

            throw new Error(
                "Invalid start URL"
            );

        }

        this.queue.push({

            url: normalized,

            depth: 0

        });

        while (this.queue.length > 0) {

            const current =
                this.queue.shift();

            const currentUrl =
                current.url;

            const depth =
                current.depth;

            if (this.visited.has(currentUrl)) {

                continue;

            }

            if (this.visited.size >= this.maxPages) {

                logger.info(
                    "Maximum pages reached."
                );

                break;

            }

            if (depth > this.maxDepth) {

                continue;

            }

            logger.info(
                `Visiting ${currentUrl} | Depth ${depth}`
            );

            this.visited.add(currentUrl);

            try {

                const knowledge =
                    await this.framework.scrape(
                        currentUrl
                    );

                if (knowledge) {

                    // Add crawl metadata
                    knowledge.page = {

                        ...(knowledge.page || {}),

                        url: currentUrl,

                        depth

                    };

                    this.pageKnowledge.push(
                        knowledge
                    );

                }

                this.stats.pagesVisited++;

                if (knowledge?.type === "html") {

                    this.stats.htmlPages++;

                }

                this.discoverLinks(
                    knowledge,
                    depth
                );

            }

            catch (error) {

                this.stats.errors++;

                console.error(error);

                logger.error(error.stack);

            }

        }

        this.stats.endTime = Date.now();

        logger.success(

            `Crawler Finished (${this.pageKnowledge.length} pages).`

        );

        logger.info(

            JSON.stringify(
                this.getStats(),
                null,
                2
            )

        );

        //--------------------------------------
        // Merge all page knowledge
        //--------------------------------------

        const mergedKnowledge =
            KnowledgeMerger.build(
                this.pageKnowledge
            );

        return {

            pages: this.pageKnowledge,

            knowledge: mergedKnowledge,

            stats: this.getStats()

        };
        return this.pageKnowledge;

    }

    discoverLinks(page, depth) {

        if (!page?.links?.length) {

            return;

        }

        for (const link of page.links) {

            if (!link.href) {

                continue;

            }

            const analyzed =
                URLNormalizer.analyze(

                    link.href,

                    page.page?.url ||
                    page.url

                );

            if (!analyzed.valid) {

                continue;

            }

            if (this.visited.has(analyzed.url)) {

                continue;

            }

            if (

                this.queue.some(

                    item =>
                        item.url === analyzed.url

                )

            ) {

                continue;

            }

            this.queue.push({

                url: analyzed.url,

                depth: depth + 1

            });

        }

    }

    getStats() {

        return {

            ...this.stats,

            duration:

                this.stats.endTime

                    ? `${(

                        (

                            this.stats.endTime -

                            this.stats.startTime

                        ) / 1000

                    ).toFixed(2)}s`

                    : null

        };

    }

    clear() {

        this.queue = [];

        this.visited.clear();

        this.pageKnowledge = [];

        this.stats = {

            pagesVisited: 0,

            htmlPages: 0,

            errors: 0,

            resources: 0,

            startTime: null,

            endTime: null

        };

        this.knowledgeMerger = null ;
    }

    getQueue() {

        return [...this.queue];

    }

    getVisited() {

        return [...this.visited];

    }

}

export default Crawler;