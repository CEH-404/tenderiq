class KnowledgeStatisticsBuilder {

    static build(knowledge = {}) {

        return {

            website: {

                type:

                    knowledge.website?.type || "unknown",

                confidence:

                    knowledge.website?.confidence || 0

            },

            pages: {

                total:

                    knowledge.pages?.length || 0

            },

            products: {

                total:

                    knowledge.products?.length || 0

            },

            faq: {

                total:

                    knowledge.faq?.length || 0

            },

            tables: {

                total:

                    knowledge.tables?.totalTables || 0,

                useful:

                    knowledge.tables?.usefulTables || 0,

                datasets:

                    knowledge.tables?.datasets?.length || 0

            },

            documents: {

                total:

                    knowledge.documents?.length || 0

            },

            resources: {

                images:

                    knowledge.resources?.images?.length || 0

            },

            links: {

                total:

                    knowledge.links?.length || 0

            },

            generatedAt:

                new Date().toISOString()

        };

    }

}

export default KnowledgeStatisticsBuilder;