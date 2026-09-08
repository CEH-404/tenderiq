import logger from "../logger/Logger.js";

class ResourceAnalyzer {

    constructor(pageManager) {

        this.pageManager = pageManager;

    }

    async analyze(pageId) {

        logger.info("Analyzing page resources...");

        const page =
            this.pageManager.get(pageId);

        if (!page) {

            throw new Error(
                `Page not found: ${pageId}`
            );

        }

        const resources =
            await page.evaluate(() => {

                const unique = array =>

                    [...new Set(array.filter(Boolean))];

                // ----------------------------------
                // Scripts
                // ----------------------------------

                const scripts = unique(

                    [...document.querySelectorAll("script[src]")]

                        .map(script => script.src)

                );

                // ----------------------------------
                // Stylesheets
                // ----------------------------------

                const styles = unique(

                    [...document.querySelectorAll("link[rel='stylesheet']")]

                        .map(style => style.href)

                );

                // ----------------------------------
                // Images
                // ----------------------------------

                const images = unique(

                    [...document.images]

                        .map(image => image.src)

                );

                // ----------------------------------
                // Videos
                // ----------------------------------

                const videos = unique(

                    [

                        ...document.querySelectorAll(

                            "video, video source"

                        )

                    ]

                        .map(video =>

                            video.src ||

                            video.currentSrc ||

                            null

                        )

                );

                // ----------------------------------
                // Audio
                // ----------------------------------

                const audios = unique(

                    [

                        ...document.querySelectorAll(

                            "audio, audio source"

                        )

                    ]

                        .map(audio =>

                            audio.src ||

                            audio.currentSrc ||

                            null

                        )

                );

                // ----------------------------------
                // PDF Files
                // ----------------------------------

                const pdfs = unique(

                    [

                        ...document.querySelectorAll(

                            "a[href$='.pdf']"

                        )

                    ]

                        .map(a => a.href)

                );

                // ----------------------------------
                // Office Documents
                // ----------------------------------

                const documents = unique(

                    [

                        ...document.querySelectorAll(

                            "a[href$='.doc'],\
                             a[href$='.docx'],\
                             a[href$='.xls'],\
                             a[href$='.xlsx'],\
                             a[href$='.csv'],\
                             a[href$='.zip']"

                        )

                    ]

                        .map(a => a.href)

                );

                // ----------------------------------
                // JSON APIs
                // ----------------------------------

                const apiEndpoints = unique(

                    [

                        ...document.querySelectorAll(

                            "script[src],link[href],a[href]"

                        )

                    ]

                        .map(element =>

                            element.src ||

                            element.href ||

                            ""

                        )

                        .filter(url =>

                            /\.json($|\?)/i.test(url) ||

                            /\/api\//i.test(url) ||

                            /graphql/i.test(url)

                        )

                );

                // ----------------------------------
                // JSON-LD
                // ----------------------------------

                const jsonLD =

                    [

                        ...document.querySelectorAll(

                            "script[type='application/ld+json']"

                        )

                    ]

                        .map(script => script.textContent)

                        .filter(Boolean);

                // ----------------------------------
                // RSS / XML
                // ----------------------------------

                const feeds = unique(

                    [

                        ...document.querySelectorAll(

                            "link[type='application/rss+xml'],\
                             link[type='application/atom+xml'],\
                             link[type='application/xml']"

                        )

                    ]

                        .map(feed => feed.href)

                );

                // ----------------------------------
                // Meta Information
                // ----------------------------------

                const meta = {

                    generator:

                        document.querySelector(

                            "meta[name='generator']"

                        )?.content ||

                        "",

                    framework:

                        document.querySelector(

                            "meta[name='framework']"

                        )?.content ||

                        "",

                    viewport:

                        document.querySelector(

                            "meta[name='viewport']"

                        )?.content ||

                        ""

                };

                return {

                    scripts,

                    styles,

                    images,

                    videos,

                    audios,

                    pdfs,

                    documents,

                    apiEndpoints,

                    jsonLD,

                    feeds,

                    meta

                };

            });

        // ----------------------------------
        // Detect Frameworks
        // ----------------------------------

        resources.frameworks = {

            aspNet:

                resources.scripts.some(script =>
                    /WebResource|ScriptResource|__doPostBack/i.test(script)
                ),

            telerik:

                resources.scripts.some(script =>
                    /telerik|rad/i.test(script)
                ),

            jquery:

                resources.scripts.some(script =>
                    /jquery/i.test(script)
                ),

            bootstrap:

                resources.styles.some(style =>
                    /bootstrap/i.test(style)
                )

        };

        // ----------------------------------
        // Detect Sitemap
        // ----------------------------------

        try {

            const url = new URL(page.url());

            resources.sitemap =
                `${url.origin}/sitemap.xml`;

            resources.robots =
                `${url.origin}/robots.txt`;

        }

        catch {

            resources.sitemap = null;

            resources.robots = null;

        }

        // ----------------------------------
        // Download Summary
        // ----------------------------------

        resources.downloads = [

            ...resources.pdfs,

            ...resources.documents

        ];

        // ----------------------------------
        // Statistics
        // ----------------------------------

        resources.counts = {

            scripts:
                resources.scripts.length,

            styles:
                resources.styles.length,

            images:
                resources.images.length,

            videos:
                resources.videos.length,

            audios:
                resources.audios.length,

            pdfs:
                resources.pdfs.length,

            documents:
                resources.documents.length,

            downloads:
                resources.downloads.length,

            apiEndpoints:
                resources.apiEndpoints.length,

            jsonLD:
                resources.jsonLD.length,

            feeds:
                resources.feeds.length

        };

        // ----------------------------------
        // Resource Score
        // ----------------------------------

        resources.score =

            resources.counts.scripts +

            resources.counts.styles +

            resources.counts.images +

            resources.counts.downloads +

            resources.counts.apiEndpoints +

            resources.counts.jsonLD;

        logger.success(

            `Resource analysis completed. (${resources.score} resources found)`

        );

        return resources;

    }

}

export default ResourceAnalyzer;     