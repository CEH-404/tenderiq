import TableDatasetBuilder from "../tables/TableDatasetBuilder.js";
import WebsiteTypeDetector from "./WebsiteTypeDetector.js";
import SchemaValidator from "./SchemaValidator.js";

class WebsiteKnowledgeBuilder {

    static build(data = {}) {

        const websiteType =
            WebsiteTypeDetector.detect(data);

        const documents =
            this.extractDocuments(data.links);

        const images =
            this.extractImages(data);

        const tables =
            this.buildTables(data.tables);

        const knowledge = {

            // =====================================
            // Page Information
            // =====================================

            page: {

                url:
                    data.url || "",

                title:
                    data.metadata?.title || "",

                description:
                    data.metadata?.description || "",

                language:
                    data.metadata?.language || "",

                crawledAt:
                    new Date().toISOString()

            },

            // =====================================
            // Website
            // =====================================

            website: {

                type:
                    websiteType.type,

                confidence:
                    websiteType.confidence

            },

            // =====================================
            // Company
            // =====================================

            company:

                data.company || {},

            // =====================================
            // Products
            // =====================================

            products:

                data.commerce || {},

            // =====================================
            // FAQ
            // =====================================

            faq:

                data.faq || [],

            // =====================================
            // Tables
            // =====================================

            tables,

            // =====================================
            // Documents
            // =====================================

            documents,

            // =====================================
            // Resources
            // =====================================

            resources: {

                images

            },

            // =====================================
            // Links
            // =====================================

            links:

                data.links || [],

            // =====================================
            // Analysis
            // =====================================

            analysis:

                data.analysis || {},

            // =====================================
            // Pagination
            // =====================================

            pagination:

                data.pagination || {},

            // =====================================
            // Text
            // =====================================

            text:

                data.text || "",

            // =====================================
            // Metadata
            // =====================================

            metadata:

                data.metadata || {},

            // =====================================
            // Statistics
            // =====================================

            statistics: {

                totalLinks:
                    data.links?.length || 0,

                totalDocuments:
                    documents.length,

                totalImages:
                    images.length,

                totalFAQs:
                    data.faq?.length || 0,

                totalTables:
                    tables.totalTables,

                usefulTables:
                    tables.usefulTables

            },

            generatedAt:

                new Date().toISOString()

        };

        return SchemaValidator
            .validate(knowledge)
            .knowledge;

    }

    static buildTables(tables = []) {

        if (!tables.length) {

            return {

                totalTables: 0,

                usefulTables: 0,

                datasets: []

            };

        }

        return TableDatasetBuilder.build(tables);

    }

    static extractDocuments(links = []) {

        const extensions = [

            ".pdf",
            ".doc",
            ".docx",
            ".xls",
            ".xlsx",
            ".ppt",
            ".pptx",
            ".csv",
            ".zip"

        ];

        return links.filter(link => {

            const url =
                link.href?.toLowerCase();

            return url &&
                extensions.some(ext =>
                    url.endsWith(ext)
                );

        });

    }

    static extractImages(data = {}) {

        const images = [];

        if (Array.isArray(data.commerce?.images)) {

            images.push(
                ...data.commerce.images
            );

        }

        if (Array.isArray(data.html?.images)) {

            images.push(
                ...data.html.images
            );

        }

        return [...new Set(images)];

    }

}

export default WebsiteKnowledgeBuilder;