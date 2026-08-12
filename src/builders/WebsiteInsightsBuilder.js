class WebsiteInsightsBuilder {

    static build(raw = {}) {

        const analysis =
            raw.analysis || {};

        const resources =
            raw.resources || {};

        const commerce =
            raw.commerce || {};

        const company =
            raw.company || {};

        return {

            page: {

                url:
                    raw.url,

                type:
                    analysis.pageType || "unknown",

                confidence:
                    analysis.confidence || 0

            },

            insights: {

                hasCommerce:
                    !!commerce,

                hasCompany:
                    !!company,

                hasFAQ:
                    (raw.faq?.length || 0) > 0,

                hasTables:
                    (raw.tables?.length || 0) > 0,

                hasGrid:
                    (raw.grid?.length || 0) > 0,

                hasStructuredData:
                    (resources.schemas || 0) > 0,

                hasSearch:
                    (resources.search || 0) > 0,

                hasForms:
                    (resources.forms || 0) > 0

            },

            statistics: {

                links:
                    raw.links?.length || 0,

                tables:
                    raw.tables?.length || 0,

                grids:
                    raw.grid?.length || 0,

                images:
                    resources.images || 0,

                videos:
                    resources.videos || 0,

                documents:
                    resources.documents || 0,

                scripts:
                    resources.scripts || 0,

                stylesheets:
                    resources.stylesheets || 0

            },

            generatedAt:
                new Date().toISOString()

        };

    }

}

export default WebsiteInsightsBuilder;