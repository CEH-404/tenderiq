import logger from "../logger/Logger.js";

class ExtractionAnalyzer {

    analyze(pageAnalysis, resourceAnalysis) {

        logger.info("Analyzing extraction strategy...");

        const strategy = {
            tables: false,
            grids: false,
            commerce: false,
            company: false,
            faq: false,
            links: false,
            images: false,
            downloads: false
        };

        const pageType = pageAnalysis.pageType;

        switch (pageType) {

            case "product":

                strategy.commerce = true;
                strategy.images = true;
                strategy.links = true;
                break;

            case "category":

                strategy.grids = true;
                strategy.links = true;
                strategy.images = true;
                break;

            case "company":

                strategy.company = true;
                strategy.links = true;
                break;

            case "faq":

                strategy.faq = true;
                strategy.links = true;
                break;

            case "tender":

                strategy.tables = true;
                strategy.downloads = true;
                strategy.links = true;
                break;

            default:

                strategy.tables = true;
                strategy.grids = true;
                strategy.links = true;
                strategy.images = true;
                strategy.downloads = true;

        }

        if (resourceAnalysis.counts.images > 0)
            strategy.images = true;

        if (
            resourceAnalysis.counts.pdfs > 0 ||
            resourceAnalysis.counts.documents > 0
        )
            strategy.downloads = true;

        logger.success("Extraction strategy selected.");

        return strategy;

    }

}

export default ExtractionAnalyzer;