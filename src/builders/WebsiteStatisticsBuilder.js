class WebsiteStatisticsBuilder {

    static build(raw = {}) {

        const resources =
            raw.resources || {};

        const links =
            raw.links || [];

        const internalLinks =
            links.filter(link => link.internal);

        const externalLinks =
            links.filter(link => link.external);

        return {

            pages: 1,

            links: {

                total:
                    links.length,

                internal:
                    internalLinks.length,

                external:
                    externalLinks.length

            },

            content: {

                tables:
                    raw.tables?.length || 0,

                grids:
                    raw.grid?.length || 0,

                gridItems:
                    raw.gridData?.length || 0,

                tableRows:
                    raw.tableData?.length || 0,

                faq:
                    raw.faq?.length || 0

            },

            media: {

                images:
                    resources.images || 0,

                videos:
                    resources.videos || 0,

                pdfs:
                    resources.pdfs || 0,

                documents:
                    resources.documents || 0

            },

            technology: {

                scripts:
                    resources.scripts || 0,

                stylesheets:
                    resources.stylesheets || 0,

                schemas:
                    resources.schemas || 0,

                forms:
                    resources.forms || 0

            },

            generatedAt:
                new Date().toISOString()

        };

    }

}

export default WebsiteStatisticsBuilder;