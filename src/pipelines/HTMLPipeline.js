import BrowserManager from "../browser/BrowserManager.js";
import ContextManager from "../browser/ContextManager.js";
import PageManager from "../browser/PageManager.js";
import NavigationManager from "../browser/NavigationManager.js";

import HTMLExtractor from "../extractors/HTMLExtractor.js";
import TextExtractor from "../extractors/TextExtractor.js";
import LinkExtractor from "../extractors/LinkExtractor.js";
import MetadataExtractor from "../extractors/MetadataExtractor.js";
import TableExtractor from "../extractors/TableExtractor.js";
import GridExtractor from "../extractors/GridExtractor.js";

import PageAnalyzer from "../analyzers/PageAnalyzer.js";

import logger from "../logger/logger.js";

import PaginationAnalyzer from "../analyzers/PaginationAnalyzer.js";

import PaginationNavigator from "../navigation/PaginationNavigator.js";

import CommerceExtractor from "../extractors/CommerceExtractor.js";

import CompanyExtractor from "../extractors/CompanyExtractor.js";

import FAQExtractor from "../extractors/FAQExtractor.js";

import TableDataExtractor from "../extractors/TableDataExtractor.js";

import GridDataExtractor from "../extractors/GridDataExtractor.js";

import KnowledgeGraphBuilder from "../builders/KnowledgeGraphBuilder.js";

import TableClassifier from "../intelligence/TableClassifier.js";

import ExcelExporter from "../exporters/ExcelExporter.js";

class HTMLPipeline {

    constructor() {

        this.browserManager = new BrowserManager();

        this.contextManager = null;

        this.pageManager = null;

        this.navigationManager = null;

        this.htmlExtractor = null;

        this.textExtractor = null;

        this.linkExtractor = null;

        this.metadataExtractor = null;

        this.tableExtractor = null;

        this.gridExtractor = null;

        this.pageAnalyzer = null;

        this.initialized = false;

        this.commerceExtractor = null;

        this.companyExtractor = null;

        this.faqExtractor = null;

        this.tableDataExtractor = null;

        this.gridDataExtractor = null;

        this.tableClassifier = null;

        this.excelExporter = null;

    }

    async initialize() {

        if (this.initialized) {

            return;

        }

        logger.info("Initializing HTML Pipeline...");

        await this.browserManager.launch();

        this.contextManager =
            new ContextManager(this.browserManager);

        this.pageManager =
            new PageManager(this.contextManager);

        this.navigationManager =
            new NavigationManager(this.pageManager);

        this.htmlExtractor =
            new HTMLExtractor(this.pageManager);

        this.textExtractor =
            new TextExtractor(this.pageManager);

        this.linkExtractor =
            new LinkExtractor(this.pageManager);

        this.metadataExtractor =
            new MetadataExtractor(this.pageManager);

        this.tableExtractor =
            new TableExtractor(this.pageManager);

        this.gridExtractor =
            new GridExtractor(this.pageManager);

        this.pageAnalyzer =
            new PageAnalyzer(this.pageManager);

        this.paginationAnalyzer =
            new PaginationAnalyzer(this.pageManager);

        this.paginationNavigator =
            new PaginationNavigator(
                this.pageManager,
                this.navigationManager
            );

        this.companyExtractor =
            new CompanyExtractor();

        this.commerceExtractor =
            new CommerceExtractor();

        this.faqExtractor =
            new FAQExtractor();

        this.tableDataExtractor =
            new TableDataExtractor();

        this.gridDataExtractor =
            new GridDataExtractor();

        this.tableClassifier = 
            new TableClassifier();
        this.excelExporter =
            new ExcelExporter();

        this.initialized = true;

        logger.success("HTML Pipeline Ready.");

    }

  async execute(url) {

    if (!this.initialized) {
        await this.initialize();
    }

    const contextId =
        await this.contextManager.create();

    const pageId =
        await this.pageManager.create(contextId);

    const page =
        this.pageManager.get(pageId);

    try {

        this.paginationNavigator.currentPage = 1;

        await this.navigationManager.goto(pageId, url);

        const html = await this.htmlExtractor.extract(pageId);
        const text = await this.textExtractor.extract(pageId);
        const links = await this.linkExtractor.extract(pageId);
        const metadata = await this.metadataExtractor.extract(pageId);

        await page.waitForTimeout(5000);

        let tableRows = [];

        const pagination =
            await this.paginationAnalyzer.analyze(pageId);

        do {

            await page.waitForSelector("table");

            const rows =
                await this.tableExtractor.extract(page);
            console.log("Current URL:", page.url());
            console.log("Rows on this page:", rows.length);

            tableRows.push(...rows);
            
            console.log("Total Rows:", tableRows.length);

            console.log(
                `Collected ${tableRows.length} rows`
            );

        } while (
            await this.paginationNavigator.next(
                pageId,
                pagination
            )
        );

        const tables = tableRows;
        const grid = await this.gridExtractor.extract(pageId);
        const gridData = await this.gridDataExtractor.extract(page);

        const analysis = await this.pageAnalyzer.analyze(pageId);

        const commerce =
            await this.commerceExtractor.extract(page);

        const company =
            await this.companyExtractor.extract(page);

        const faq =
            await this.faqExtractor.extract(page);

        const tableData =
            await this.tableDataExtractor.extract(page);

        const rawData = {
            url,
            analysis,
            pagination,
            html,
            text,
            links,
            metadata,
            tables,
            grid,
            gridData,
            commerce,
            company,
            faq,
            tableData
        };

        const knowledge =
            KnowledgeGraphBuilder.build(rawData);

        console.log("Table Rows:", tableRows.length);
        

        await this.excelExporter.export(
            tableRows,
            "./outputs/procurement.xlsx"
        );

        return {
            type: "html",
            raw: rawData,
            knowledge
        };

    } finally {

        await this.pageManager.close(pageId);

        await this.contextManager.close(contextId);

    }
  }
  async shutdown() {

    if (!this.initialized) {
        return;
    }

    await this.browserManager.close();

    this.initialized = false;

    logger.success("HTML Pipeline Shutdown.");

}
}
export default HTMLPipeline;