class ExtractionReportBuilder {

    static build(raw = {}, knowledge = {}) {

        return {

            url: raw.url,

            pageType:
                raw.analysis?.pageType || "unknown",

            confidence:
                raw.analysis?.confidence || 0,

            extraction: {

                html:
                    !!raw.html,

                text:
                    !!raw.text,

                metadata:
                    !!raw.metadata,

                links:
                    raw.links?.length || 0,

                tables:
                    raw.tables?.length || 0,

                grids:
                    raw.grid?.length || 0,

                faq:
                    raw.faq?.length || 0,

                company:
                    raw.company ? 1 : 0,

                commerce:
                    raw.commerce ? 1 : 0

            },

            resources:
                raw.resources || {},

            strategy:
                raw.extractionStrategy || {},

            summary:
                knowledge.summary || {}

        };

    }

}

export default ExtractionReportBuilder;