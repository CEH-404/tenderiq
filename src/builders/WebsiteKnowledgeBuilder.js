class WebsiteKnowledgeBuilder {

    static build(raw = {}) {

        return {

            website: {

                url:
                    raw.url,

                title:
                    raw.metadata?.title || "",

                description:
                    raw.metadata?.description || "",

                keywords:
                    raw.metadata?.keywords || ""

            },

            classification: {

                type:
                    raw.analysis?.pageType || "unknown",

                confidence:
                    raw.analysis?.confidence || 0

            },

            company:
                raw.company || {},

            commerce:
                raw.commerce || {},

            faq:
                raw.faq || [],

            articles:
                raw.article || [],

            tables:
                raw.tableData || [],

            grids:
                raw.gridData || [],

            links:
                raw.links || [],

            resources:
                raw.resources || {},

            extractionStrategy:
                raw.extractionStrategy || {},

            extractedAt:
                new Date().toISOString()

        };

    }

}

export default WebsiteKnowledgeBuilder;