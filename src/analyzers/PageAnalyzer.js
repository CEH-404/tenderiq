import logger from "../logger/logger.js";

class PageAnalyzer {

    constructor(pageManager) {

        this.pageManager = pageManager;

    }

    async analyze(pageId) {

        logger.info("Analyzing page...");

        const page =
            this.pageManager.get(pageId);

        if (!page) {

            throw new Error(
                `Page not found: ${pageId}`
            );

        }

        const dom =
            await this.collectDOM(page);

        const structure =
            this.analyzeStructure(dom);

        const navigation =
            this.analyzeNavigation(dom);

        const content =
            this.analyzeContent(dom);

        const commerce =
            this.analyzeCommerce(dom);

        const classification =
            this.classify({

                structure,

                navigation,

                content,

                commerce

            });

        logger.success(
            `Detected page type: ${classification.type} (${classification.confidence})`
        );

        return {

            pageType:
                classification.type,

            confidence:
                classification.confidence,

            structure,

            navigation,

            content,

            commerce,

            classification

        };

    }

    async collectDOM(page) {

        return await page.evaluate(() => {

            const text = selector =>
                [...document.querySelectorAll(selector)]
                    .map(el => el.innerText.trim())
                    .filter(Boolean);

            const exists = selector =>
                !!document.querySelector(selector);

            const count = selector =>
                document.querySelectorAll(selector).length;

            return {

                //----------------------------------
                // Basic
                //----------------------------------

                title:
                    document.title,

                url:
                    location.href,

                language:
                    document.documentElement.lang || "",

                htmlSize:
                    document.documentElement.outerHTML.length,

                bodyTextLength:
                    document.body.innerText.length,

                //----------------------------------
                // Structure
                //----------------------------------

                tables:
                    count("table"),

                grids:
                    count(".grid,.card,.product,.listing,.item,.row .col,.product-card"),

                lists:
                    count("ul,ol"),

                forms:
                    document.forms.length,

                images:
                    document.images.length,

                links:
                    document.links.length,

                buttons:
                    count("button,input[type=button],input[type=submit]"),

                paragraphs:
                    count("p"),

                headings: {

                    h1:
                        count("h1"),

                    h2:
                        count("h2"),

                    h3:
                        count("h3")

                },

                //----------------------------------
                // Commerce
                //----------------------------------

                priceTexts:

                    [...document.querySelectorAll("*")]

                        .map(el => el.innerText)

                        .filter(Boolean)

                        .filter(text =>

                            /\$|€|£|₹|Rs|PKR|USD/i.test(text)

                        )

                        .slice(0,20),

                addToCart:

                    [...document.querySelectorAll("button,a,input")]

                        .some(el =>

                            /add to cart|buy now|purchase|order now/i

                                .test(el.innerText)

                        ),

                productImages:

                    [...document.images]

                        .filter(img =>

                            img.width >= 250 &&
                            img.height >= 250

                        )

                        .map(img => img.src),

                //----------------------------------
                // Company
                //----------------------------------

                emails:

                    document.body.innerText.match(

                        /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi

                    ) || [],

                phones:

                    document.body.innerText.match(

                        /\+?\d[\d\s\-()]{8,}/g

                    ) || [],

                socialLinks:

                    [...document.links]

                        .map(a => a.href)

                        .filter(link =>

                            /facebook|instagram|linkedin|twitter|youtube|tiktok/i

                                .test(link)

                        ),

                //----------------------------------
                // FAQ
                //----------------------------------

                faqQuestions:

                    [

                        ...document.querySelectorAll(

                            "details summary,.faq h3,.faq h4,.accordion-header"

                        )

                    ]

                    .map(el =>

                        el.innerText.trim()

                    )

                    .filter(Boolean),

                //----------------------------------
                // SEO
                //----------------------------------

                metaDescription:

                    document.querySelector(

                        "meta[name='description']"

                    )?.content || "",

                keywords:

                    document.querySelector(

                        "meta[name='keywords']"

                    )?.content || "",

                canonical:

                    document.querySelector(

                        "link[rel='canonical']"

                    )?.href || "",

                //----------------------------------
                // Navigation
                //----------------------------------

                search:

                    exists(

                        "input[type='search'],input[name*=search],input[placeholder*=Search]"

                    ),

                filters:

                    count(

                        "select,input[type=checkbox],input[type=radio]"

                    ),

                breadcrumbs:

                    count(

                        ".breadcrumb,nav[aria-label='breadcrumb']"

                    ),

                navigationMenus:

                    count("nav"),

                footer:

                    exists("footer"),

                header:

                    exists("header"),

                downloads:

                    count(

                        "a[href$='.pdf'],a[href$='.doc'],a[href$='.docx'],a[href$='.xls'],a[href$='.xlsx'],a[href$='.zip']"

                    ),

                //----------------------------------
                // Pagination
                //----------------------------------

                pagination:

                    exists(

                        ".pagination,.pager,.rgPager,.rgCurrentPage,.rgPageNext"

                    ),

                aspNet:

                    typeof window.__doPostBack === "function" ||

                    exists("input[name='__EVENTTARGET']"),

                telerik:

                    exists(".rgPager") ||

                    exists(".rgPageNext"),

                pageCount:

                    count(

                        ".rgNumPart a,.pagination a,.pager a"

                    ),

                loadMore:

                    [...document.querySelectorAll("button,a")]

                        .some(el =>

                            /load more/i.test(el.innerText)

                        ),

                infiniteScroll:

                    document.body.scrollHeight >

                    window.innerHeight * 2,

                //----------------------------------
                // Text
                //----------------------------------

                h1Text:
                    text("h1"),

                h2Text:
                    text("h2")

            };

        });

    }

    analyzeStructure(dom) {

        return {

            tables:
                dom.tables,

            grids:
                dom.grids,

            lists:
                dom.lists,

            forms:
                dom.forms,

            images:
                dom.images,

            links:
                dom.links,

            buttons:
                dom.buttons,

            headings:
                dom.headings,

            paragraphs:
                dom.paragraphs,

            htmlSize:
                dom.htmlSize,

            bodyTextLength:
                dom.bodyTextLength

        };

    }

    analyzeNavigation(dom) {

        return {

            breadcrumbs:
                dom.breadcrumbs,

            navigationMenus:
                dom.navigationMenus,

            header:
                dom.header,

            footer:
                dom.footer,

            pagination:
                dom.pagination,

            aspNet:
                dom.aspNet,

            telerik:
                dom.telerik,

            pageCount:
                dom.pageCount,

            loadMore:
                dom.loadMore,

            infiniteScroll:
                dom.infiniteScroll,

            search:
                dom.search,

            filters:
                dom.filters

        };

    }

    analyzeContent(dom) {

        return {

            title:
                dom.title,

            url:
                dom.url,

            language:
                dom.language,

            metaDescription:
                dom.metaDescription,

            keywords:
                dom.keywords,

            canonical:
                dom.canonical,

            h1:
                dom.h1Text,

            h2:
                dom.h2Text,

            downloads:
                dom.downloads

        };

    }

    classify(data) {

        const {

            structure,

            navigation,

            content,

            commerce

        } = data;

        const score = {

            product: 0,

            category: 0,

            company: 0,

            faq: 0,

            article: 0,

            tender: 0,

            generic: 0

        };

        // =====================================
        // Product Page
        // =====================================

        if (commerce.hasPrice)
            score.product += 25;

        if (commerce.hasAddToCart)
            score.product += 35;

        if (commerce.productImages >= 2)
            score.product += 20;

        if (structure.images >= 5)
            score.product += 10;

        if (structure.forms > 0)
            score.product += 5;

        if (/product|shop|buy/i.test(content.title))
            score.product += 10;

        // =====================================
        // Category Page
        // =====================================

        if (structure.grids >= 4)
            score.category += 25;

        if (structure.grids >= 10)
            score.category += 20;

        if (navigation.filters > 0)
            score.category += 20;

        if (structure.links >= 30)
            score.category += 10;

        if (navigation.pagination)
            score.category += 10;

        // =====================================
        // Company Website
        // =====================================

        if (commerce.emails > 0)
            score.company += 20;

        if (commerce.phones > 0)
            score.company += 20;

        if (commerce.socialLinks >= 2)
            score.company += 20;

        if (navigation.footer)
            score.company += 10;

        if (navigation.header)
            score.company += 10;

        // =====================================
        // FAQ Page
        // =====================================

        if (commerce.faqCount >= 3)
            score.faq += 60;

        if (/faq|frequently asked/i.test(content.title))
            score.faq += 30;

        // =====================================
        // Article / Blog
        // =====================================

        if (structure.paragraphs >= 15)
            score.article += 30;

        if (structure.headings.h2 >= 5)
            score.article += 20;

        if (structure.bodyTextLength >= 5000)
            score.article += 20;

        // =====================================
        // Tender Website
        // =====================================

        if (

            /tender|bid|procurement|eproc|rfq|rfp|quotation/i

                .test(content.title)

        )

            score.tender += 60;

        if (structure.tables > 0)
            score.tender += 20;

        if (navigation.aspNet)
            score.tender += 10;

        if (navigation.telerik)
            score.tender += 10;

        if (navigation.pagination)
            score.tender += 10;

        // =====================================
        // Generic
        // =====================================

        score.generic +=

            structure.links +

            structure.images +

            structure.tables +

            structure.grids;

        let winner = "generic";

        let confidence = 0;

        for (const key in score) {

            if (score[key] > confidence) {

                confidence = score[key];

                winner = key;

            }

        }

        return {

            type:
                winner,

            confidence,

            scores:
                score

        };

    }

    classify(data) {

        const score = {

            product: 0,

            category: 0,

            company: 0,

            faq: 0,

            article: 0,

            tender: 0,

            generic: 0

        };

        const {

            structure,

            navigation,

            content,

            commerce

        } = data;

        // -------------------------------------------------
        // Product Page
        // -------------------------------------------------

        if (commerce.hasPrice)
            score.product += 25;

        if (commerce.hasAddToCart)
            score.product += 35;

        if (commerce.productImages >= 2)
            score.product += 20;

        if (structure.images >= 5)
            score.product += 10;

        // -------------------------------------------------
        // Category Page
        // -------------------------------------------------

        if (structure.grids >= 4)
            score.category += 25;

        if (navigation.filters)
            score.category += 20;

        if (structure.links >= 30)
            score.category += 10;

        if (structure.grids >= 10)
            score.category += 20;

        // -------------------------------------------------
        // Company
        // -------------------------------------------------

        if (commerce.emails > 0)
            score.company += 20;

        if (commerce.phones > 0)
            score.company += 20;

        if (commerce.socialLinks >= 2)
            score.company += 20;

        if (navigation.footer)
            score.company += 10;

        // -------------------------------------------------
        // FAQ
        // -------------------------------------------------

        if (commerce.faqCount >= 3)
            score.faq += 60;

        // -------------------------------------------------
        // Blog / Article
        // -------------------------------------------------

        if (structure.paragraphs >= 15)
            score.article += 30;

        if (structure.headings.h2 >= 5)
            score.article += 20;

        // -------------------------------------------------
        // Tender Detection
        // -------------------------------------------------

        if (/tender|bid|procurement/i.test(content.title))
            score.tender += 60;

        if (structure.tables >= 1)
            score.tender += 15;

        if (navigation.pagination)
            score.tender += 10;

        if (navigation.aspNet)
            score.tender += 10;

        if (navigation.telerik)
            score.tender += 10;

        if (navigation.pageCount > 2)
            score.tender += 5;

        // -------------------------------------------------
        // Generic
        // -------------------------------------------------

        score.generic +=

            structure.links +

            structure.images +

            structure.tables +

            structure.grids;

        let winner = "generic";

        let confidence = 0;

        for (const key in score) {

            if (score[key] > confidence) {

                confidence = score[key];

                winner = key;

            }

        }

        return {

            type: winner,

            confidence,

            scores: score

        };

    }

    analyzeCommerce(dom) {

        return {

            hasPrice:
                dom.priceTexts.length > 0,

            priceCount:
                dom.priceTexts.length,

            prices:
                dom.priceTexts,

            hasAddToCart:
                dom.addToCart,

            productImages:
                dom.productImages.length,

            imageUrls:
                dom.productImages,

            faqCount:
                dom.faqQuestions.length,

            faqQuestions:
                dom.faqQuestions,

            emails:
                dom.emails.length,

            emailList:
                dom.emails,

            phones:
                dom.phones.length,

            phoneList:
                dom.phones,

            socialLinks:
                dom.socialLinks.length,

            socialUrls:
                dom.socialLinks,

            ecommerceScore: [

                dom.priceTexts.length > 0,

                dom.addToCart,

                dom.productImages.length > 2,

                dom.images > 5

            ].filter(Boolean).length

        };

    }

}

export default PageAnalyzer;

// import logger from "../logger/logger.js";

// class PageAnalyzer {

//     constructor(pageManager) {

//         this.pageManager = pageManager;

//     }

//     async analyze(pageId) {

//         logger.info("Analyzing page...");

//         const page = this.pageManager.get(pageId);

//         if (!page) {

//             throw new Error("Page not found.");

//         }

//         const dom = await this.collectDOM(page);

//         const structure = this.analyzeStructure(dom);

//         const navigation = this.analyzeNavigation(dom);

//         const content = this.analyzeContent(dom);

//         const commerce = this.analyzeCommerce(dom);

//         const classification = this.classify({

//             structure,

//             navigation,

//             content,

//             commerce
//         });


//         logger.success("Page analysis completed.");

//         return {
//             pageType: classification.type,

//             confidence: classification.confidence,

//             structure,

//             navigation,

//             content,

//             commerce,

//             classification

//         };

//     }

//     async collectDOM(page) {

//         return await page.evaluate(() => {

//             const text = selector =>
//                 [...document.querySelectorAll(selector)]
//                     .map(el => el.innerText.trim())
//                     .filter(Boolean);

//             return {

//                 title: document.title,

//                 url: location.href,

//                 tables:
//                     document.querySelectorAll("table").length,

//                 grids:
//                     document.querySelectorAll(
//                         ".grid,.card,.product,.listing,.item"
//                     ).length,

//                 lists:
//                     document.querySelectorAll(
//                         "ul,ol"
//                     ).length,

//                 forms:
//                     document.forms.length,

//                 images:
//                     document.images.length,

//                 links:
//                     document.links.length,

//                 buttons:
//                     document.querySelectorAll(
//                         "button,input[type=button],input[type=submit]"
//                     ).length,

//                 priceTexts:[
//                     ...document.querySelectorAll("*")

//                 ]
//                     .map(el => el.innerText)
//                     .filter(Boolean)
//                     .filter(text =>
//                         /\$|€|£|₹|Rs|PKR|USD/i.test(text)
//                     )

//                     .slice(0,20),

//                 addToCart:[
//                     ...document.querySelectorAll(
//                         "button,a,input"
//                     )
//                 ]

//                     .some(el=>
//                        /add to cart|buy now|purchase/i
//                        .test(el.innerText)
//                     ),

//                 productImages:[
//                     ...document.images
//                 ]

//                     .filter(img=>
//                         img.width>250 &&
//                         img.height>250
//                     )
//                     .map(img=>img.src),

//                 faqQuestions:[
//                     ...document.querySelectorAll(
//                         "details summary,.faq h3,.faq h4"
//                     )
//                 ]

//                     .map(el=>el.innerText.trim()),

//                 emails:
//                   document.body.innerText.match(
//                     /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [],
    
//                 phones:
//                   document.body.innerText.match(/\+?\d[\d\s\-()]{8,}/g) || [],

//                 socialLinks:[
//                   ...document.links
//                 ]
//                     .map(a=>a.href)
//                     .filter(link=>
//                      /facebook|instagram|linkedin|twitter|youtube/i
//                      .test(link)
//                     ),

//                 headings: {

//                     h1:
//                         document.querySelectorAll("h1").length,

//                     h2:
//                         document.querySelectorAll("h2").length,

//                     h3:
//                         document.querySelectorAll("h3").length

//                 },

//                 search:

//                     !!document.querySelector(

//                         "input[type='search'],input[name*=search],input[placeholder*=Search]"

//                     ),

//                 filters:

//                     document.querySelectorAll(

//                         "select,input[type=checkbox],input[type=radio]"

//                     ).length,

//                 downloads:

//                     document.querySelectorAll(

//                         "a[href$='.pdf'],a[href$='.doc'],a[href$='.docx'],a[href$='.xls'],a[href$='.xlsx'],a[href$='.zip']"

//                     ).length,

//                     pagination:
//                         !!document.querySelector(
//                             ".pagination, ul.pagination, .pager, .next, #next, .rgPager, .rgPageNext, .rgCurrentPage, input[title='Next Page']"
//                         ),

//                     aspNet:
//                         typeof window.__doPostBack === "function" ||
//                         !!document.querySelector("input[name='__EVENTTARGET']"),

//                     telerik:
//                         !!document.querySelector(".rgPager") ||
//                         !!document.querySelector(".rgPageNext"),

//                     pageCount:
//                         document.querySelectorAll(".rgNumPart a, .pagination a, .pager a").length,

//                 loadMore:

//                     [...document.querySelectorAll("button,a")]

//                         .some(el =>

//                             /load more/i.test(el.innerText)

//                         ),

//                 infiniteScroll:

//                     document.body.scrollHeight >

//                     window.innerHeight * 2,

//                 breadcrumbs:

//                     document.querySelectorAll(

//                         ".breadcrumb,nav[aria-label='breadcrumb']"

//                     ).length,

//                 navigationMenus:

//                     document.querySelectorAll(

//                         "nav"

//                     ).length,

//                 footer:

//                     !!document.querySelector("footer"),

//                 header:

//                     !!document.querySelector("header"),

//                 paragraphs:

//                     document.querySelectorAll("p").length,

//                 metaDescription:

//                     document.querySelector(

//                         "meta[name='description']"

//                     )?.content || "",

//                 keywords:

//                     document.querySelector(

//                         "meta[name='keywords']"

//                     )?.content || "",

//                 h1Text:

//                     text("h1"),

//                 h2Text:

//                     text("h2")

//             };

//         });

//     }

//     analyzeStructure(dom) {

//         return {

//             tables: dom.tables,

//             grids: dom.grids,

//             lists: dom.lists,

//             forms: dom.forms,

//             images: dom.images,

//             links: dom.links,

//             buttons: dom.buttons,

//             headings: dom.headings,

//             paragraphs: dom.paragraphs

//         };

//     }

//     analyzeNavigation(dom) {

//         return {

//             breadcrumbs: dom.breadcrumbs,

//             navigationMenus: dom.navigationMenus,

//             header: dom.header,

//             footer: dom.footer,

//             pagination: dom.pagination,

//             aspNet: dom.aspNet,

//             telerik: dom.telerik,

//             pageCount: dom.pageCount,

//             loadMore: dom.loadMore,

//             infiniteScroll: dom.infiniteScroll,

//             search: dom.search,

//             filters: dom.filters

//         };

//     }

//     analyzeContent(dom) {

//         return {

//             title: dom.title,

//             url: dom.url,

//             metaDescription: dom.metaDescription,

//             keywords: dom.keywords,

//             h1: dom.h1Text,

//             h2: dom.h2Text,

//             downloads: dom.downloads

//         };

//     }


//     classify(data) {

//         const score = {
//             product: 0,
//             category: 0,
//             company: 0,
//             faq: 0,
//             article: 0,
//             tender: 0,
//             generic: 0
//         };

//         const {
//             structure,
//             navigation,
//             content,
//             commerce
//         } = data;

//         // -------------------------
//         // Product Detail Page
//         // -------------------------

//         if (commerce.hasPrice)
//             score.product += 25;

//         if (commerce.hasAddToCart)
//             score.product += 35;

//         if (commerce.productImages >= 2)
//             score.product += 20;

//         if (structure.images >= 5)
//             score.product += 10;

//         // -------------------------
//         // Product Category
//         // -------------------------

//         if (structure.grids >= 4)
//             score.category += 25;

//         if (navigation.filters)
//             score.category += 20;

//         if (structure.links >= 30)
//             score.category += 10;

//         if (structure.grids >= 10)
//             score.category += 20;

//         // -------------------------
//         // Company Website
//         // -------------------------

//         if (commerce.emails > 0)
//             score.company += 20;

//         if (commerce.phones > 0)
//             score.company += 20;

//         if (commerce.socialLinks >= 2)
//             score.company += 20;

//         if (navigation.footer)
//             score.company += 10;

//         // -------------------------
//         // FAQ
//         // -------------------------

//         if (commerce.faqCount >= 3)
//             score.faq += 60;

//         // -------------------------
//         // Article / Blog
//         // -------------------------

//         if (structure.paragraphs >= 15)
//             score.article += 30;

//         if (structure.headings.h2 >= 5)
//             score.article += 20;

//         // -------------------------
//         // Tender
//         // -------------------------

//         if (/tender|bid|procurement/i.test(content.title))
//             score.tender += 60;

//         if (structure.tables >= 1)
//             score.tender += 15;

//         // -------------------------
//         // Generic Website
//         // -------------------------

//         score.generic +=
//             structure.links +
//             structure.images +
//             structure.tables +
//             structure.grids;

//         let winner = "generic";
//         let confidence = 0;

//         for (const key in score) {

//             if (score[key] > confidence) {

//                 confidence = score[key];
//                 winner = key;

//             }

//         }

//         return {
//             type: winner,
//             confidence,
//             scores: score
//         };

//     }

//     analyzeCommerce(dom) {

//         return {

//             hasPrice:
//                 dom.priceTexts.length > 0,

//             priceCount:
//                 dom.priceTexts.length,

//             prices:
//                 dom.priceTexts,

//             hasAddToCart:
//                 dom.addToCart,

//             productImages:
//                 dom.productImages.length,

//             imageUrls:
//                 dom.productImages,

//             faqCount:
//                 dom.faqQuestions.length,

//             faqQuestions:
//                 dom.faqQuestions,

//             emails:
//                 dom.emails.length,

//             emailList:
//                 dom.emails,

//             phones:
//                 dom.phones.length,

//             phoneList:
//                 dom.phones,

//             socialLinks:
//                 dom.socialLinks.length,

//             socialUrls:
//                 dom.socialLinks,

//             ecommerceScore: [

//                 dom.priceTexts.length > 0,

//                 dom.addToCart,

//                 dom.productImages.length > 2,

//                 dom.images > 5

//             ].filter(Boolean).length

//         };

//     }

// }

// export default PageAnalyzer;