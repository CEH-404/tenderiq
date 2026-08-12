import logger from "../logger/logger.js";

import PaginationAnalyzer from "../analyzers/PaginationAnalyzer.js";
import PaginationNavigator from "../navigation/PaginationNavigator.js";

import URLNormalizer from "../scraper/URLNormalizer.js";


class SiteCrawler {

    constructor(
        pageManager,
        navigationManager,
        extractionManager
    ) {

        this.pageManager =
            pageManager;

        this.navigationManager =
            navigationManager;

        this.extractionManager =
            extractionManager;


        this.paginationAnalyzer =
            new PaginationAnalyzer(
                pageManager
            );


        this.paginationNavigator =
            new PaginationNavigator(
                pageManager,
                navigationManager
            );

    }


    async crawl(
        pageId,
        startUrl,
        options = {}
    ) {


        const visited =
            new Set();


        const queued =
            new Set();


        const queue =
            [];


        const pages =
            [];


        const maxPages =
            options.maxPages ?? Infinity;


        const maxDepth =
            options.maxDepth ?? Infinity;



        const normalizedStartUrl =
            URLNormalizer.normalize(
                startUrl
            );


        if (!normalizedStartUrl) {

            throw new Error(
                "Invalid start URL."
            );

        }



        queue.push({

            url:
                normalizedStartUrl,

            depth:
                0

        });



        queued.add(
            normalizedStartUrl
        );




        while (queue.length) {


            const current =
                queue.shift();



            const currentUrl =
                URLNormalizer.normalize(
                    current.url
                );



            if (!currentUrl) {

                continue;

            }



            if (
                visited.has(
                    currentUrl
                )
            ) {

                continue;

            }



            visited.add(
                currentUrl
            );


            queued.delete(
                currentUrl
            );



            if (
                pages.length >= maxPages
            ) {

                break;

            }




            try {


                await this.navigationManager.goto(

                    pageId,

                    currentUrl,

                    {
                        timeout:
                            options.timeout
                    }

                );


            }

            catch(error) {


                logger.warning(

                    `Skipping ${currentUrl} due to navigation failure: ${error.message}`

                );


                continue;

            }





            let hasNextPage =
                false;



            do {



                const data =
                    await this.extractionManager.extract(
                        pageId
                    );



                const activePage =
                    this.pageManager.get(
                        pageId
                    );



                const browserUrl =
                    activePage
                        ? URLNormalizer.normalize(
                            activePage.url()
                        )
                        : currentUrl;



                data.url =
                    browserUrl;



                pages.push(
                    data
                );



                if (
                    pages.length >= maxPages
                ) {

                    break;

                }




                // -----------------------------
                // Discover Links
                // -----------------------------

                for (
                    const link of data.links || []
                ) {


                    if (!link.href) {

                        continue;

                    }



                    const analysis =
                        URLNormalizer.analyze(

                            link.href,

                            startUrl

                        );



                    if (!analysis.valid) {

                        continue;

                    }



                    if (
                        current.depth + 1 >
                        maxDepth
                    ) {

                        continue;

                    }



                    if (
                        visited.has(
                            analysis.url
                        )
                    ) {

                        continue;

                    }



                    if (
                        queued.has(
                            analysis.url
                        )
                    ) {

                        continue;

                    }



                    queued.add(
                        analysis.url
                    );



                    queue.push({

                        url:
                            analysis.url,

                        depth:
                            current.depth + 1

                    });


                }





                // -----------------------------
                // Pagination Handling
                // -----------------------------

                const pagination =
                    await this.paginationAnalyzer.analyze(
                        pageId
                    );



                if (
                    !pagination.hasPagination
                ) {

                    break;

                }



                hasNextPage =
                    await this.paginationNavigator.next(

                        pageId,

                        pagination

                    );



                if (hasNextPage) {


                    const currentPage =
                        this.pageManager.get(
                            pageId
                        );


                    const pageUrl =
                        currentPage
                            ? URLNormalizer.normalize(
                                currentPage.url()
                            )
                            : null;



                    if (
                        pageUrl &&
                        !visited.has(
                            pageUrl
                        )
                    ) {

                        visited.add(
                            pageUrl
                        );

                    }

                }



            }

            while(hasNextPage);



        }



        logger.info(

            `Crawler completed. Visited ${visited.size} URLs. Extracted ${pages.length} pages.`

        );



        return pages;


    }


}


export default SiteCrawler;