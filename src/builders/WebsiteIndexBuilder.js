class WebsiteIndexBuilder {

    static build(raw = {}) {

        return {

            index: {

                url:
                    raw.url,

                title:
                    raw.metadata?.title || "",

                pageType:
                    raw.analysis?.pageType || "unknown",

                confidence:
                    raw.analysis?.confidence || 0

            },

            collections: {

                links:
                    raw.links || [],

                tables:
                    raw.tables || [],

                grid:
                    raw.grid || [],

                tableData:
                    raw.tableData || [],

                gridData:
                    raw.gridData || [],

                faq:
                    raw.faq || [],

                company:
                    raw.company || {},

                commerce:
                    raw.commerce || {},

                resources:
                    raw.resources || {}

            },

            metrics: {

                totalLinks:
                    raw.links?.length || 0,

                totalTables:
                    raw.tables?.length || 0,

                totalGridItems:
                    raw.grid?.length || 0,

                totalFAQ:
                    raw.faq?.length || 0,

                totalResources:

                    (raw.resources?.images || 0) +

                    (raw.resources?.videos || 0) +

                    (raw.resources?.documents || 0) +

                    (raw.resources?.pdfs || 0)

            },

            indexedAt:
                new Date().toISOString()

        };

    }

}

export default WebsiteIndexBuilder;