import logger from "../logger/logger.js";

class PaginationAnalyzer {

    constructor(pageManager) {

        this.pageManager = pageManager;

    }

    async analyze(pageId) {

        logger.info("Analyzing pagination...");

        const page = this.pageManager.get(pageId);

        if (!page) {

            throw new Error("Page not found.");

        }

        const result = await page.evaluate(() => {

            //--------------------------------------------------
            // Next Button
            //--------------------------------------------------

            const nextSelectors = [

                "a[rel='next']",

                ".next",

                "#next",

                ".pagination .next",

                ".pager .next",

                "button.next"

            ];

            let nextButton = null;

            for (const selector of nextSelectors) {

                const element =
                    document.querySelector(selector);

                if (element) {

                    nextButton = element;

                    break;

                }

            }

            //--------------------------------------------------
            // Previous Button
            //--------------------------------------------------

            const previousSelectors = [

                "a[rel='prev']",

                ".previous",

                ".prev",

                ".pagination .prev",

                "button.prev"

            ];

            let previousButton = null;

            for (const selector of previousSelectors) {

                const element =
                    document.querySelector(selector);

                if (element) {

                    previousButton = element;

                    break;

                }

            }

            //--------------------------------------------------
            // Numeric Pagination
            //--------------------------------------------------

            const pageNumbers =

                [...document.querySelectorAll("a")]

                .filter(a =>

                    /^\d+$/.test(a.textContent.trim())

                );

            //--------------------------------------------------
            // Load More
            //--------------------------------------------------

            const loadMore =

                [...document.querySelectorAll("button,a")]

                .find(el =>

                    /load more/i.test(

                        el.innerText

                    )

                );

            //--------------------------------------------------
            // Infinite Scroll
            //--------------------------------------------------

            const infiniteScroll =

                document.body.scrollHeight >

                window.innerHeight * 3;

            //--------------------------------------------------
            // ASP.NET
            //--------------------------------------------------

            const aspNet =

                !!document.querySelector(

                    "input[name='__EVENTTARGET']"

                ) ||

                typeof window.__doPostBack === "function";

            //--------------------------------------------------
            // DataTables
            //--------------------------------------------------

            const dataTables =

                !!document.querySelector(

                    ".dataTables_paginate"

                );

            //--------------------------------------------------
            // Bootstrap Pagination
            //--------------------------------------------------

            const bootstrap =

                !!document.querySelector(

                    ".pagination"

                );

            //--------------------------------------------------
            // Next URL
            //--------------------------------------------------

            let nextUrl = "";

            if (

                nextButton &&

                nextButton.href

            ) {

                nextUrl = nextButton.href;

            }

            //--------------------------------------------------

            return {

                hasPagination:

                    !!(

                        nextButton ||

                        pageNumbers.length ||

                        loadMore ||

                        infiniteScroll ||

                        dataTables ||

                        aspNet

                    ),

                nextButton:

                    !!nextButton,

                previousButton:

                    !!previousButton,

                nextUrl,

                pageNumbers:

                    pageNumbers.length,

                loadMore:

                    !!loadMore,

                infiniteScroll,

                aspNet,

                dataTables,

                bootstrap

            };

        });

        result.strategy =

            this.detectStrategy(result);

        logger.success("Pagination analysis completed.");

        return result;

    }

    detectStrategy(result) {

        if (result.aspNet)

            return "aspnet";

        if (result.dataTables)

            return "datatable";

        if (result.loadMore)

            return "load-more";

        if (result.infiniteScroll)

            return "infinite-scroll";

        if (result.pageNumbers)

            return "number";

        if (result.nextButton)

            return "next-button";

        return "none";

    }

}

export default PaginationAnalyzer;