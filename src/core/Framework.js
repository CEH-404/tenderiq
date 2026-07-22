import ResourceRouter from "./ResourceRouter.js";

import ResourceType from "./ResourceType.js";

import HTMLPipeline from "../pipelines/HTMLPipeline.js";
import PDFPipeline from "../pipelines/PDFPipeline.js";
import ImagePipeline from "../pipelines/ImagePipeline.js";
import DocumentPipeline from "../pipelines/DocumentPipeline.js";
import VideoPipeline from "../pipelines/VideoPipeline.js";
import JSONPipeline from "../pipelines/JSONPipeline.js";
import XMLPipeline from "../pipelines/XMLPipeline.js";
import DownloadPipeline from "../pipelines/DownloadPipeline.js";

import Crawler from "../scraper/Crawler.js";

import JSONExporter from "../exporters/JSONExporter.js";

import TableDataExporter from "../exporters/TableDataExporter.js";

class Framework {

    constructor() {

        this.htmlPipeline = new HTMLPipeline();
        this.pdfPipeline = new  PDFPipeline();
        this.imagePipeline = new ImagePipeline();
        this.documentPipeline = new DocumentPipeline();
        this.videoPipeline = new VideoPipeline();
        this.jsonPipeline = new JSONPipeline();
        this.xmlPipeline = new  XMLPipeline();
        this.downloadPipeline = new DownloadPipeline();

        this.crawler = new 
        Crawler(this);

        this.jsonExporter = new JSONExporter();

        this.tableDataExporter = new TableDataExporter();
    }

    async initialize() {

        await this.htmlPipeline.initialize();
        await this.pdfPipeline.initialize();
        await this.imagePipeline.initialize();
        await this.documentPipeline.initialize();
        await this.videoPipeline.initialize();
        await this.jsonPipeline.initialize();
        await this.xmlPipeline.initialize();
        await this.downloadPipeline.initialize();

    }

    async scrape(url) {

        const resource =

            await ResourceRouter.route(url);

        switch (resource.type) {

            case ResourceType.HTML:

                return await this.htmlPipeline.execute(url);

            case ResourceType.PDF:

                return {

                    type: "pdf",

                    url,

                    message:
                        "PDF Pipeline Coming Soon"

                };

            case ResourceType.IMAGE:

                return {

                    type: "image",

                    url,

                    message:
                        "Image Pipeline Coming Soon"

                };

            case ResourceType.VIDEO:

                return {

                    type: "video",

                    url,

                    message:
                        "Video Pipeline Coming Soon"

                };

            case ResourceType.DOCUMENT:

                return {

                    type: "document",

                    url,

                    message:
                        "Document Pipeline Coming Soon"

                };

            default:

                throw new Error(

                    `Unsupported Resource: ${resource.type}`

                );

        }

        const pages =
            await this.crawler.crawl(options.url);

        const websiteKnowledge =
            KnowledgeMerger.merge(

        pages.map(
            page => page.knowledge
        )

    );

await this.jsonExporter.export(
    websiteKnowledge
);

return websiteKnowledge;

    }

    async crawl(options) {

    const result =
    await this.crawler.crawl(options.url);

await this.jsonExporter.export(result);

// Export only table data
await this.tableDataExporter.export(
    result.knowledge
);

return result;

}

    async shutdown() {

        await this.htmlPipeline.shutdown();
        await this.pdfPipeline.shutdown();
        await this.imagePipeline.shutdown();
        await this.documentPipeline.shutdown();
        await this.videoPipeline.shutdown();
        await this.jsonPipeline.shutdown();
        await this.xmlPipeline.shutdown();
        await this.downloadPipeline.shutdown();

    }

}

export default Framework;