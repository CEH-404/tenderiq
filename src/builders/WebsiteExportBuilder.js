class WebsiteExportBuilder {

    static build(raw = {}, knowledge = {}) {

        return {

            metadata: {

                exportedAt:
                    new Date().toISOString(),

                version:
                    "1.0.0",

                framework:
                    "Enterprise Browser Framework"

            },

            website: {

                url:
                    raw.url,

                pageType:
                    raw.analysis?.pageType || "unknown",

                confidence:
                    raw.analysis?.confidence || 0

            },

            extraction: {

                strategy:
                    raw.extractionStrategy || {},

                resources:
                    raw.resources || {}

            },

            content: {

                metadata:
                    raw.metadata || {},

                company:
                    raw.company || {},

                commerce:
                    raw.commerce || {},

                faq:
                    raw.faq || [],

                links:
                    raw.links || [],

                tables:
                    raw.tables || [],

                grid:
                    raw.grid || [],

                tableData:
                    raw.tableData || [],

                gridData:
                    raw.gridData || []

            },

            knowledge,

            summary: {

                links:
                    raw.links?.length || 0,

                tables:
                    raw.tables?.length || 0,

                grids:
                    raw.grid?.length || 0,

                faq:
                    raw.faq?.length || 0,

                images:
                    raw.resources?.images || 0,

                videos:
                    raw.resources?.videos || 0,

                documents:
                    raw.resources?.documents || 0

            }

        };

    }

}

export default WebsiteExportBuilder;