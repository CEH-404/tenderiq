class WebsiteProfileBuilder {

    static build(raw = {}) {

        return {

            identity: {

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

                pageType:
                    raw.analysis?.pageType || "unknown",

                confidence:
                    raw.analysis?.confidence || 0

            },

            company:
                raw.company || {},

            commerce:
                raw.commerce || {},

            resources:
                raw.resources || {},

            statistics: {

                links:
                    raw.links?.length || 0,

                tables:
                    raw.tables?.length || 0,

                gridItems:
                    raw.grid?.length || 0,

                faq:
                    raw.faq?.length || 0,

                images:
                    raw.resources?.images || 0,

                videos:
                    raw.resources?.videos || 0,

                documents:
                    raw.resources?.documents || 0

            },

            extraction: {

                strategy:
                    raw.extractionStrategy || {},

                completed:
                    new Date().toISOString()

            }

        };

    }

}

export default WebsiteProfileBuilder;