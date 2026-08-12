class KnowledgeGraphBuilder {

    static build(raw = {}) {

        const pages = Array.isArray(raw.pages)
            ? raw.pages
            : [];

        const summary = {

            pages: pages.length,

            links: 0,

            tables: 0,

            grids: 0,

            faq: 0,

            forms: 0,

            images: 0,

            documents: 0,

            words: 0
        };

        for (const page of pages) {

            summary.links += page.links?.length || 0;

            summary.tables += page.tables?.length || 0;

            summary.grids += page.grid?.length || 0;

            summary.faq += page.faq?.length || 0;

            summary.forms += page.forms?.length || 0;

            summary.images += page.images?.length || 0;

            summary.documents += page.documents?.length || 0;

            summary.words += page.text?.wordCount || 0;

        }

        return {

            pages,

            summary

        };

    }

}

export default KnowledgeGraphBuilder;

// class KnowledgeGraphBuilder {

//     static build(raw = {}) {

//         const graph = {

//             page: {

//                 url: raw.url,

//                 type:
//                     raw.analysis?.pageType || "unknown",

//                 confidence:
//                     raw.analysis?.confidence || 0

//             },

//             metadata:
//                 raw.metadata || {},

//             company:
//                 raw.company || null,

//             commerce:
//                 raw.commerce || null,

//             faq:
//                 raw.faq || [],

//             tables:
//                 raw.tables || [],

//             tableData:
//                 raw.tableData || [],

//             grids:
//                 raw.grid || [],

//             gridData:
//                 raw.gridData || [],

//             links:
//                 raw.links || [],

//             resources:
//                 raw.resources || {},

//             extraction:
//                 raw.Strategy || {}

//         };

//         graph.summary = {

//             links:
//                 graph.links.length,

//             tables:
//                 graph.tables.length,

//             grids:
//                 graph.grids.length,

//             faq:
//                 graph.faq.length,

//             hasCommerce:
//                 !!graph.commerce,

//             hasCompany:
//                 !!graph.company

//         };

//         return graph;

//     }

// }

// export default KnowledgeGraphBuilder;