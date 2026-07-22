import logger from "../logger/logger.js";

class PageAnalyzer {

    constructor(pageManager) {

        this.pageManager = pageManager;

    }

    async analyze(pageId) {

        logger.info("Analyzing page...");

        const page = this.pageManager.get(pageId);

        if (!page) {

            throw new Error("Page not found.");

        }

        const dom = await this.collectDOM(page);

        const structure = this.analyzeStructure(dom);

        const navigation = this.analyzeNavigation(dom);

        const content = this.analyzeContent(dom);

        const commerce = this.analyzeCommerce(dom);

        const classification = this.classify({

            structure,

            navigation,

            content,

            commerce
        });


        logger.success("Page analysis completed.");

        return {
            pageType: classification.type,

            confidence: classification.confidence,

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

            return {

                title: document.title,

                url: location.href,

                tables:
                    document.querySelectorAll("table").length,

                grids:
                    document.querySelectorAll(
                        ".grid,.card,.product,.listing,.item"
                    ).length,

                lists:
                    document.querySelectorAll(
                        "ul,ol"
                    ).length,

                forms:
                    document.forms.length,

                images:
                    document.images.length,

                links:
                    document.links.length,

                buttons:
                    document.querySelectorAll(
                        "button,input[type=button],input[type=submit]"
                    ).length,

                priceTexts:[
                    ...document.querySelectorAll("*")

                ]
                    .map(el => el.innerText)
                    .filter(Boolean)
                    .filter(text =>
                        /\$|€|£|₹|Rs|PKR|USD/i.test(text)
                    )

                    .slice(0,20),

                addToCart:[
                    ...document.querySelectorAll(
                        "button,a,input"
                    )
                ]

                    .some(el=>
                       /add to cart|buy now|purchase/i
                       .test(el.innerText)
                    ),

                productImages:[
                    ...document.images
                ]

                    .filter(img=>
                        img.width>250 &&
                        img.height>250
                    )
                    .map(img=>img.src),

                faqQuestions:[
                    ...document.querySelectorAll(
                        "details summary,.faq h3,.faq h4"
                    )
                ]

                    .map(el=>el.innerText.trim()),

                emails:
                  document.body.innerText.match(
                    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [],
    
                phones:
                  document.body.innerText.match(/\+?\d[\d\s\-()]{8,}/g) || [],

                socialLinks:[
                  ...document.links
                ]
                    .map(a=>a.href)
                    .filter(link=>
                     /facebook|instagram|linkedin|twitter|youtube/i
                     .test(link)
                    ),

                headings: {

                    h1:
                        document.querySelectorAll("h1").length,

                    h2:
                        document.querySelectorAll("h2").length,

                    h3:
                        document.querySelectorAll("h3").length

                },

                search:

                    !!document.querySelector(

                        "input[type='search'],input[name*=search],input[placeholder*=Search]"

                    ),

                filters:

                    document.querySelectorAll(

                        "select,input[type=checkbox],input[type=radio]"

                    ).length,

                downloads:

                    document.querySelectorAll(

                        "a[href$='.pdf'],a[href$='.doc'],a[href$='.docx'],a[href$='.xls'],a[href$='.xlsx'],a[href$='.zip']"

                    ).length,

                pagination:

                    !!document.querySelector(

                        ".pagination,ul.pagination,.pager,.next,#next"

                    ),

                loadMore:

                    [...document.querySelectorAll("button,a")]

                        .some(el =>

                            /load more/i.test(el.innerText)

                        ),

                infiniteScroll:

                    document.body.scrollHeight >

                    window.innerHeight * 2,

                breadcrumbs:

                    document.querySelectorAll(

                        ".breadcrumb,nav[aria-label='breadcrumb']"

                    ).length,

                navigationMenus:

                    document.querySelectorAll(

                        "nav"

                    ).length,

                footer:

                    !!document.querySelector("footer"),

                header:

                    !!document.querySelector("header"),

                paragraphs:

                    document.querySelectorAll("p").length,

                metaDescription:

                    document.querySelector(

                        "meta[name='description']"

                    )?.content || "",

                keywords:

                    document.querySelector(

                        "meta[name='keywords']"

                    )?.content || "",

                h1Text:

                    text("h1"),

                h2Text:

                    text("h2")

            };

        });

    }

    analyzeStructure(dom) {

        return {

            tables: dom.tables,

            grids: dom.grids,

            lists: dom.lists,

            forms: dom.forms,

            images: dom.images,

            links: dom.links,

            buttons: dom.buttons,

            headings: dom.headings,

            paragraphs: dom.paragraphs

        };

    }

    analyzeNavigation(dom) {

        return {

            breadcrumbs: dom.breadcrumbs,

            navigationMenus: dom.navigationMenus,

            header: dom.header,

            footer: dom.footer,

            pagination: dom.pagination,

            loadMore: dom.loadMore,

            infiniteScroll: dom.infiniteScroll,

            search: dom.search,

            filters: dom.filters

        };

    }

    analyzeContent(dom) {

        return {

            title: dom.title,

            url: dom.url,

            metaDescription: dom.metaDescription,

            keywords: dom.keywords,

            h1: dom.h1Text,

            h2: dom.h2Text,

            downloads: dom.downloads

        };

    }

    classify(data){

    let score={

        product:0,

        category:0,

        company:0,

        faq:0,

        article:0,

        tender:0

    };



    const{

        structure,

        navigation,

        content,

        commerce

    }=data;



    if(commerce.hasPrice)

        score.product+=35;



    if(commerce.hasAddToCart)

        score.product+=40;



    if(commerce.productImages>=3)

        score.product+=20;



    if(

        navigation.filters &&

        structure.grids>=4

    )

        score.category+=40;



    if(

        structure.grids>=10

    )

        score.category+=30;



    if(

        commerce.faqCount>=3

    )

        score.faq+=60;



    if(

        commerce.emails>0 &&

        commerce.phones>0

    )

        score.company+=50;



    if(

        structure.paragraphs>15

    )

        score.article+=35;



    if(

        /tender|bid|procurement/i

        .test(content.title)

    )

        score.tender+=80;



    let winner="detail";

    let confidence=40;



    for(const key in score){

        if(score[key]>confidence){

            confidence=score[key];

            winner=key;

        }

    }

    return{

        type:winner,

        confidence

    };

}

    analyzeCommerce(dom){

        return{

            hasPrice:

                dom.priceTexts.length>0,

            hasAddToCart:

                dom.addToCart,

            productImages:

                dom.productImages.length,

            faqCount:

                dom.faqQuestions.length,

            emails:

                dom.emails.length,

            phones:

                dom.phones.length,

            socialLinks:

                dom.socialLinks.length

        };

    }

}

export default PageAnalyzer;