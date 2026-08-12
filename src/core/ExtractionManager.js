import PageAnalyzer from "../analyzers/PageAnalyzer.js";
import ResourceAnalyzer from "../analyzers/ResourceAnalyzer.js";
import ExtractionAnalyzer from "../analyzers/ExtractionAnalyzer.js";

import HTMLExtractor from "../extractors/HTMLExtractor.js";
import TextExtractor from "../extractors/TextExtractor.js";
import MetadataExtractor from "../extractors/MetadataExtractor.js";
import LinkExtractor from "../extractors/LinkExtractor.js";
import TableExtractor from "../extractors/TableExtractor.js";
import GridExtractor from "../extractors/GridExtractor.js";

import CommerceExtractor from "../extractors/CommerceExtractor.js";
import CompanyExtractor from "../extractors/CompanyExtractor.js";
import FAQExtractor from "../extractors/FAQExtractor.js";

import TenderPipeline from "../pipelines/TenderPipeline.js";

import logger from "../logger/logger.js";

class ExtractionManager {

    constructor(pageManager) {

        this.pageManager = pageManager;

        this.pageAnalyzer =
            new PageAnalyzer(pageManager);

        this.resourceAnalyzer =
            new ResourceAnalyzer(pageManager);

        this.strategyAnalyzer =
            new ExtractionAnalyzer();

        this.htmlExtractor =
            new HTMLExtractor(pageManager);

        this.textExtractor =
            new TextExtractor(pageManager);

        this.metadataExtractor =
            new MetadataExtractor(pageManager);

        this.linkExtractor =
            new LinkExtractor(pageManager);

        this.tableExtractor =
            new TableExtractor(pageManager);

        this.gridExtractor =
            new GridExtractor(pageManager);

        this.commerceExtractor =
            new CommerceExtractor(pageManager);

        this.companyExtractor =
            new CompanyExtractor(pageManager);

        this.faqExtractor =
            new FAQExtractor(pageManager);

    }

    async extract(pageId) {

        const page =
            this.pageManager.getPage(pageId);

        if (!page) {

            throw new Error(
                `Page not found: ${pageId}`
            );

        }

        const analysis =
            await this.pageAnalyzer.analyze(pageId);

        const resources =
            await this.resourceAnalyzer.analyze(pageId);

        const strategy =
            this.strategyAnalyzer.analyze(
                analysis,
                resources
            );

        const result = {

            analysis,

            resources,

            strategy,

            html: "",

            text: "",

            metadata: {},

            links: [],

            tables: [],

            tenders: {

                success: true,

                total: 0,

                valid: 0,

                invalid: 0,

                tenders: [],

                errors: []

            },

            grid: [],

            commerce: null,

            company: null,

            faq: null

        };

        // ----------------------------
        // Base Extractors
        // ----------------------------

        const [

            html,

            text,

            metadata,

            links

        ] = await Promise.all([

            this.htmlExtractor.extract(pageId)
                .catch(error => {
                    logger.warning(`HTML extraction failed: ${error.message}`);
                    return "";
                }),

            this.textExtractor.extract(pageId)
                .catch(error => {
                    logger.warning(`Text extraction failed: ${error.message}`);
                    return "";
                }),

            this.metadataExtractor.extract(pageId)
                .catch(error => {
                    logger.warning(`Metadata extraction failed: ${error.message}`);
                    return {};
                }),

            this.linkExtractor.extract(pageId)
                .catch(error => {
                    logger.warning(`Link extraction failed: ${error.message}`);
                    return [];
                })

        ]);

        result.html = html;
        result.text = text;
        result.metadata = metadata;
        result.links = links;

        // ----------------------------
        // Tables
        // ----------------------------

        if (strategy.tables) {

            try {

                const tableData =
                    await this.tableExtractor.extract(pageId);


        result.tables = tableData;

        result.tenders = TenderPipeline.processExtraction({
            analysis: result.analysis,
            resources: result.resources,
            strategy: result.strategy,
            html: result.html,
            text: result.text,
            metadata: result.metadata,
            links: result.links,
            tables: tableData
        });

            }

            catch (error) {

                logger.warning(
                    `Table extraction failed: ${error.message}`
                );

            }

        }

        // ----------------------------
        // Grid
        // ----------------------------

        if (strategy.grids) {

            try {

                result.grid =
                    await this.gridExtractor.extract(
                        pageId,
                        strategy
                    );

            }

            catch (error) {

                logger.warning(
                    `Grid extraction failed: ${error.message}`
                );

            }

        }

        // ----------------------------
        // Commerce
        // ----------------------------

        if (strategy.commerce) {

            try {

                result.commerce =
                    await this.commerceExtractor.extract(
                        pageId,
                        strategy
                    );

            }

            catch (error) {

                logger.warning(
                    `Commerce extraction failed: ${error.message}`
                );

            }

        }

        // ----------------------------
        // Company
        // ----------------------------

        if (strategy.company) {

            try {

                result.company =
                    await this.companyExtractor.extract(
                        pageId,
                        strategy
                    );

            }

            catch (error) {

                logger.warning(
                    `Company extraction failed: ${error.message}`
                );

            }

        }

        // ----------------------------
        // FAQ
        // ----------------------------

        if (strategy.faq) {

            try {

                result.faq =
                    await this.faqExtractor.extract(
                        pageId,
                        strategy
                    );

            }

            catch (error) {

                logger.warning(
                    `FAQ extraction failed: ${error.message}`
                );

            }

        }

        return result;

    }

}

export default ExtractionManager;

// import PageAnalyzer from "../analyzers/PageAnalyzer.js";
// import ResourceAnalyzer from "../analyzers/ResourceAnalyzer.js";
// import ExtractionAnalyzer from "../analyzers/ExtractionAnalyzer.js";

// import HTMLExtractor from "../extractors/HTMLExtractor.js";
// import TextExtractor from "../extractors/TextExtractor.js";
// import MetadataExtractor from "../extractors/MetadataExtractor.js";
// import LinkExtractor from "../extractors/LinkExtractor.js";
// import TableExtractor from "../extractors/TableExtractor.js";
// import GridExtractor from "../extractors/GridExtractor.js";

// import CommerceExtractor from "../extractors/CommerceExtractor.js";
// import CompanyExtractor from "../extractors/CompanyExtractor.js";
// import FAQExtractor from "../extractors/FAQExtractor.js";

// class ExtractionManager {

//     constructor(pageManager) {

//         this.pageManager = pageManager;

//         this.pageAnalyzer =
//             new PageAnalyzer(pageManager);

//         this.resourceAnalyzer =
//             new ResourceAnalyzer(pageManager);

//         this.strategyAnalyzer =
//             new ExtractionAnalyzer();

//         this.htmlExtractor =
//             new HTMLExtractor(pageManager);

//         this.textExtractor =
//             new TextExtractor(pageManager);

//         this.metadataExtractor =
//             new MetadataExtractor(pageManager);

//         this.linkExtractor =
//             new LinkExtractor(pageManager);

//         this.tableExtractor =
//             new TableExtractor(pageManager);

//         this.gridExtractor =
//             new GridExtractor(pageManager);

//         this.commerceExtractor =
//             new CommerceExtractor(
//                 pageManager
//             );

//         this.companyExtractor =
//             new CompanyExtractor(
//                 pageManager
//             );

//         this.faqExtractor =
//             new FAQExtractor(
//                 pageManager
//             );

//     }

//     async extract(pageId) {

//         const page =
//             this.pageManager.getPage(pageId);

//         if (!page) {

//             throw new Error(
//                 `Page not found: ${pageId}`
//             );

//         }

//         const analysis =
//             await this.pageAnalyzer.analyze(pageId);

//         const resources =
//             await this.resourceAnalyzer.analyze(pageId);

//         const strategy =
//             this.strategyAnalyzer.analyze(
//                 analysis,
//                 resources
//             );

//         const result = {

//             analysis,

//             resources,

//             strategy

//         };

//         result.html =
//             await this.htmlExtractor.extract(pageId);

//         result.text =
//             await this.textExtractor.extract(pageId);

//         result.metadata =
//             await this.metadataExtractor.extract(pageId);

//         result.links =
//             await this.linkExtractor.extract(pageId);

//         if (strategy.tables) {

//             result.tables =
//                 await this.tableExtractor.extract(pageId);

//         } else {

//             result.tables = [];

//         }

//         if (strategy.grids) {

//             result.grid =
//                 await this.gridExtractor.extract(
//                     pageId,
//                     strategy
//                 );

//         } else {

//             result.grid = [];

//         }

//         if (strategy.commerce) {

//             result.commerce =
//                 await this.commerceExtractor.extract(
//                     pageId,
//                     strategy
//                 );

//         }

//         if (strategy.company) {

//         result.company =
//             await this.companyExtractor.extract(
//                 pageId,
//                 strategy
//             );

//         }

//         if (strategy.faq) {

//             result.faq =
//                 await this.faqExtractor.extract(
//                     pageId,
//                     strategy
//                 );

//         }

//         return result;

//     }

// }

// export default ExtractionManager;