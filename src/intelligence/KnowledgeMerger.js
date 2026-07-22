import KnowledgeStatisticsBuilder
from "./KnowledgeStatisticsBuilder.js";

class KnowledgeMerger {

    static build(pages = []) {

        if (!pages.length) {

            return null;

        }

        const firstPage = pages[0];

        const merged = {

            website: {

                ...firstPage.website

            },

            pages: [],

            company: {},

            products: [],

            faq: [],

            tables: {

                totalTables: 0,

                usefulTables: 0,

                datasets: []

            },

            documents: [],

            resources: {

                images: []

            },

            links: [],

            metadata: {},

            statistics: {

                pages: 0,

                products: 0,

                faqs: 0,

                tables: 0,

                documents: 0,

                images: 0,

                links: 0

            },

            generatedAt:

                new Date().toISOString()

        };

        //------------------------------------
        // Merge Every Page
        //------------------------------------

        for (const page of pages) {

            //------------------------------------
            // Pages
            //------------------------------------

            merged.pages.push(page.page);

            //------------------------------------
            // Company
            //------------------------------------

            merged.company = {

                ...merged.company,

                ...page.company

            };

            //------------------------------------
            // Products
            //------------------------------------

            if (page.products) {

                merged.products.push(page.products);

            }

            //------------------------------------
            // FAQ
            //------------------------------------

            if (page.faq?.length) {

                merged.faq.push(...page.faq);

            }

            //------------------------------------
            // Tables
            //------------------------------------

            if (page.tables?.datasets) {

                merged.tables.datasets.push(

                    ...page.tables.datasets

                );

            }

            //------------------------------------
            // Documents
            //------------------------------------

            if (page.documents?.length) {

                merged.documents.push(

                    ...page.documents

                );

            }

            //------------------------------------
            // Images
            //------------------------------------

            if (page.resources?.images?.length) {

                merged.resources.images.push(

                    ...page.resources.images

                );

            }

            //------------------------------------
            // Links
            //------------------------------------

            if (page.links?.length) {

                merged.links.push(

                    ...page.links

                );

            }

        }

        //------------------------------------
        // Remove Duplicates
        //------------------------------------

        merged.documents = this.uniqueObjects(
            merged.documents,
            "href"
        );

        merged.links = this.uniqueObjects(
            merged.links,
            "href"
        );

        merged.resources.images = [

            ...new Set(
                merged.resources.images
            )

        ];

        merged.faq = this.uniqueFAQ(
            merged.faq
        );

        //------------------------------------
        // Tables
        //------------------------------------

        merged.tables.totalTables =

            merged.tables.datasets.length;

        merged.tables.usefulTables =

            merged.tables.datasets.length;

        //------------------------------------
        // Statistics
        //------------------------------------

        merged.statistics =
            KnowledgeStatisticsBuilder.build(
                 merged
            );

        return merged;

    }

    //------------------------------------

    static uniqueObjects(items, key) {

        const map = new Map();

        for (const item of items) {

            if (!item[key]) continue;

            map.set(item[key], item);

        }

        return [...map.values()];

    }

    //------------------------------------

    static uniqueFAQ(faqs) {

        const map = new Map();

        for (const faq of faqs) {

            const key =

                faq.question?.toLowerCase();

            if (!key) continue;

            map.set(key, faq);

        }

        return [...map.values()];

    }

}

export default KnowledgeMerger;