class KnowledgeGraphBuilder {

    static build(data = {}) {

        const graph = {

            website: {

                url: data.url || "",

                title: data.metadata?.title || "",

                description: data.metadata?.description || "",

                language: data.metadata?.language || "",

                canonical: data.metadata?.canonical || ""

            },

            company: data.company || {},

            commerce: data.commerce || {},

            faq: data.faq || [],

            tables: data.tables || [],

            tableData: data.tableData || [],

            grid: data.grid || [],

            gridData: data.gridData || [],

            documents: this.extractDocuments(data.links),

            images: this.extractImages(data),

            internalLinks: this.extractInternalLinks(data.links),

            externalLinks: this.extractExternalLinks(data.links),

            statistics: this.buildStatistics(data),

            generatedAt: new Date().toISOString()

        };

        return graph;

    }

    static extractDocuments(links = []) {

        return links.filter(link => {

            if (!link.href) {

                return false;

            }

            const url = link.href.toLowerCase();

            return (

                url.endsWith(".pdf") ||

                url.endsWith(".doc") ||

                url.endsWith(".docx") ||

                url.endsWith(".xls") ||

                url.endsWith(".xlsx") ||

                url.endsWith(".ppt") ||

                url.endsWith(".pptx")

            );

        });

    }

    static extractImages(data) {

        const images = [];

        if (data.commerce?.images) {

            images.push(...data.commerce.images);

        }

        return [...new Set(images)];

    }

    static extractInternalLinks(links = []) {

        return links.filter(link => link.internal);

    }

    static extractExternalLinks(links = []) {

        return links.filter(link => link.external);

    }

    static buildStatistics(data) {

        return {

            totalLinks:

                data.links?.length || 0,

            internalLinks:

                data.links?.filter(x => x.internal).length || 0,

            externalLinks:

                data.links?.filter(x => x.external).length || 0,

            totalTables:

                data.tables?.length || 0,

            totalGridItems:

                data.grid?.length || 0,

            totalFAQs:

                data.faq?.length || 0,

            totalProducts:

                data.commerce?.products?.length || 0,

            totalDocuments:

                this.extractDocuments(data.links).length,

            totalImages:

                this.extractImages(data).length

        };

    }

}

export default KnowledgeGraphBuilder;