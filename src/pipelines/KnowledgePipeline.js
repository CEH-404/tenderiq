import KnowledgeGraphBuilder from "../builders/KnowledgeGraphBuilder.js";

import WebsiteKnowledgeBuilder from "../builders/WebsiteKnowledgeBuilder.js";
import WebsiteRelationshipBuilder from "../builders/WebsiteRelationshipBuilder.js";
import WebsiteStatisticsBuilder from "../builders/WebsiteStatisticsBuilder.js";
import WebsiteTechnologyBuilder from "../builders/WebsiteTechnologyBuilder.js";
import WebsiteIndexBuilder from "../builders/WebsiteIndexBuilder.js";
import WebsiteResourceBuilder from "../builders/WebsiteResourceBuilder.js";
import WebsiteExportBuilder from "../builders/WebsiteExportBuilder.js";

class KnowledgePipeline {

    build(rawData) {

        const graph =
            KnowledgeGraphBuilder.build(rawData);

        const website =
            WebsiteKnowledgeBuilder.build(rawData);

        const relationships =
            WebsiteRelationshipBuilder.build(rawData);

        const statistics =
            WebsiteStatisticsBuilder.build(rawData);

        const technology =
            WebsiteTechnologyBuilder.build(rawData);

        const index =
            WebsiteIndexBuilder.build(rawData);

        const resources =
            WebsiteResourceBuilder.build(rawData);

        const exportData =
            WebsiteExportBuilder.build(
                rawData,
                graph
            );

        return {

            graph,

            website,

            relationships,

            statistics,

            technology,

            index,

            resources,

            export: exportData

        };

    }

}

export default KnowledgePipeline;