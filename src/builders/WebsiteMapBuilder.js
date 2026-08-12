class WebsiteMapBuilder {

    static build(raw = {}) {

        return {

            page: {

                url:
                    raw.url,

                type:
                    raw.analysis?.pageType || "unknown",

                confidence:
                    raw.analysis?.confidence || 0

            },

            navigation: {

                internalLinks:
                    raw.links?.filter(
                        link => link.internal
                    ) || [],

                externalLinks:
                    raw.links?.filter(
                        link => link.external
                    ) || []

            },

            structure: {

                tables:
                    raw.tables || [],

                grids:
                    raw.grid || [],

                forms:
                    raw.resources?.forms || 0,

                images:
                    raw.resources?.images || 0,

                videos:
                    raw.resources?.videos || 0,

                documents:
                    raw.resources?.documents || 0

            },

            knowledge: {

                company:
                    !!raw.company,

                commerce:
                    !!raw.commerce,

                faq:
                    raw.faq?.length || 0

            },

            generatedAt:
                new Date().toISOString()

        };

    }

}

export default WebsiteMapBuilder;