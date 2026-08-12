class WebsiteSummaryBuilder {

    static build(raw = {}) {

        const summary = {

            url:
                raw.url,

            pageType:
                raw.analysis?.pageType || "unknown",

            confidence:
                raw.analysis?.confidence || 0,

            title:
                raw.metadata?.title || "",

            description:
                raw.metadata?.description || "",

            totalLinks:
                raw.links?.length || 0,

            totalTables:
                raw.tables?.length || 0,

            totalGridItems:
                raw.grid?.length || 0,

            totalProducts:
                raw.commerce?.products?.length || 0,

            totalFAQs:
                raw.faq?.length || 0,

            totalImages:
                raw.resources?.images || 0,

            totalVideos:
                raw.resources?.videos || 0,

            totalDocuments:
                raw.resources?.documents || 0,

            hasCompany:
                !!raw.company,

            hasCommerce:
                !!raw.commerce,

            extractedAt:
                new Date().toISOString()

        };

        return summary;

    }

}

export default WebsiteSummaryBuilder;