import BrowserManager from "../browser/BrowserManager.js";
import ContextManager from "../browser/ContextManager.js";
import PageManager from "../browser/PageManager.js";
import NavigationManager from "../browser/NavigationManager.js";

import ExtractionManager from "./ExtractionManager.js";

import KnowledgeGraphBuilder from "../builders/KnowledgeGraphBuilder.js";

import JSONExporter from "../exporters/JSONExporter.js";
import ExcelExporter from "../exporters/ExcelExporter.js";

import ExtractionExportService from "../services/ExtractionExportService.js";

import logger from "../logger/Logger.js";

import SiteCrawler from "../scraper/SiteCrawler.js";

import URLNormalizer from "../scraper/URLNormalizer.js";


import TenderAIPipeline from "../pipelines/TenderAIPipeline.js";
import AITenderExportService from "../exporters/AITenderExportService.js";

class ScraperEngine {


    constructor() {

        this.browserManager = null;
        this.contextManager = null;
        this.pageManager = null;
        this.navigationManager = null;
        this.siteCrawler = null;
        this.extractionManager = null;

        this.jsonExporter = new JSONExporter();
        this.excelExporter = new ExcelExporter();

        this.extractionExporter =
            new ExtractionExportService();


        this.tenderAIPipeline =
    new TenderAIPipeline();

this.aiExporter =
    new AITenderExportService();

        this.initialized = false;

    }



    async initialize() {

        if(this.initialized){
            return;
        }


        logger.info(
            "Initializing Scraper Engine..."
        );


        try {


            this.browserManager =
                new BrowserManager();


            await this.browserManager.launch();



            this.contextManager =
                new ContextManager(
                    this.browserManager
                );



            this.pageManager =
                new PageManager(
                    this.contextManager
                );



            this.navigationManager =
                new NavigationManager(
                    this.pageManager
                );



            this.extractionManager =
                new ExtractionManager(
                    this.pageManager
                );



            this.siteCrawler =
                new SiteCrawler(
                    this.pageManager,
                    this.navigationManager,
                    this.extractionManager
                );



            this.initialized = true;


            logger.success(
                "Scraper Engine Ready."
            );


        }
        catch(error){


            logger.error(
                `Scraper Engine initialization failed: ${error.message}`
            );


            await this.shutdown();


            throw error;

        }

    }




    async scrape(input, options = {}) {


        if(!this.initialized){

            await this.initialize();

        }



        let url;



        // Support scrape(url, options)
        if(typeof input === "string"){

            url = input;

        }


        // Support scrape({url,...})
        else if(
            input &&
            typeof input === "object"
        ){

            url = input.url;


            options = {
                ...input,
                ...options
            };

        }



        logger.info(
            `Received scrape URL: ${url}`
        );



        const normalizedUrl =
            URLNormalizer.normalize(
                url
            );



        if(!normalizedUrl){


            throw new Error(
                `Invalid URL: ${url}`
            );


        }


        url = normalizedUrl;



        const startTime =
            Date.now();



        const contextId =
            await this.contextManager.create();



        const pageId =
            await this.pageManager.create(
                contextId
            );



        try {



            logger.info(
                `Starting crawl: ${url}`
            );



            const pages =
                await this.siteCrawler.crawl(
                    pageId,
                    url,
                    options
                );



            logger.success(
                `Crawled ${pages.length} pages.`
            );



            const knowledge =
                KnowledgeGraphBuilder.build({
                    pages
                });



            let jsonResult = null;


            try {

                jsonResult =
                    await this.jsonExporter.export(
                        knowledge
                    );


            }
            catch(error){

                logger.warning(
                    `JSON export failed: ${error.message}`
                );

            }




            let knowledgeExcel = null;


            try {


                knowledgeExcel =
                    await this.excelExporter.exportKnowledge(
                        knowledge
                    );


            }
            catch(error){


                logger.warning(
                    `Knowledge Excel export failed: ${error.message}`
                );

            }





            let tableExcel = null;



            if(options.exportExcel){


                const allTables = [];


                for(const page of pages){

                    if(Array.isArray(page.tables)){

                        allTables.push(
                            ...page.tables
                        );

                    }

                }



                if(allTables.length){


                    tableExcel =
                        await this.excelExporter.export(
                            allTables,
                            options.output ||
                            "./outputs/output.xlsx"
                        );


                }

            }




            let cleanJSONExport = null;



            try {
cleanJSONExport =
    await this.extractionExporter.export(
        knowledge
    );
            }
            catch(error){


                logger.warning(
                    `Clean JSON export failed: ${error.message}`
                );


            }

        let aiJSONExport = null;

try {

    if (
        cleanJSONExport?.success &&
        cleanJSONExport?.data
    ) {

        const aiJson =
            await this.tenderAIPipeline.execute(
                cleanJSONExport.data
            );

        // export() returns the file path string — wrap it so the result
        // object below can read .filePath / .data off it.
        const aiFilePath =
            await this.aiExporter.export(
                aiJson
            );

        aiJSONExport = {

            success: true,

            filePath: aiFilePath,

            data: aiJson

        };

    }

}
catch (error) {

    logger.warning(
        `AI JSON export failed: ${error.message}`
    );

}


            const duration =
                Date.now() - startTime;



            return {


                success:true,


                pages,


                knowledge,


                stats:
                knowledge.summary,


                cleanJSONExport,



                crawl:{


                    pagesVisited:
                    pages.length,


                    exportedTables:
                    pages.reduce(
                        (total,page)=>
                        total +
                        (page.tables?.length || 0),
                        0
                    ),


                    timestamp:
                    new Date().toISOString()

                },



                duration,

                ai:
                    aiJSONExport?.data,

                export:{


                    jsonFilename:
                    jsonResult?.filename,


                    jsonPath:
                    jsonResult?.path,


                    excelFilename:
                    tableExcel?.filename ??
                    knowledgeExcel?.filename,


                    excelPath:
                    tableExcel?.path ??
                    knowledgeExcel?.path,


                    cleanJson:
                    cleanJSONExport?.filePath,

                    aiJson:
                    aiJSONExport?.filePath


                }


            };



        }
        finally {


            await this.pageManager.close(
                pageId
            );


            await this.contextManager.close(
                contextId
            );


        }


    }





    async shutdown(){


        if(!this.initialized){

            return;

        }



        if(this.browserManager){

            await this.browserManager.close();

        }



        this.initialized=false;



        logger.success(
            "Scraper Engine Shutdown."
        );


    }


}


export default ScraperEngine;