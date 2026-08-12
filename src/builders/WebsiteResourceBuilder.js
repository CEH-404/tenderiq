class WebsiteResourceBuilder {

    static build(raw = {}) {

        const resources =
            raw.resources || {};

        return {

            html: {

                available:
                    !!raw.html,

                size:
                    raw.html?.length || 0

            },

            text: {

                available:
                    !!raw.text,

                length:
                    raw.text?.length || 0

            },

            metadata:
                raw.metadata || {},

            resources: {

                images:
                    resources.images || 0,

                videos:
                    resources.videos || 0,

                documents:
                    resources.documents || 0,

                pdfs:
                    resources.pdfs || 0,

                schemas:
                    resources.schemas || 0,

                forms:
                    resources.forms || 0,

                scripts:
                    resources.scripts || 0,

                stylesheets:
                    resources.stylesheets || 0

            },

            extracted: {

                links:
                    raw.links?.length || 0,

                tables:
                    raw.tables?.length || 0,

                grids:
                    raw.grid?.length || 0,

                faq:
                    raw.faq?.length || 0,

                company:
                    !!raw.company,

                commerce:
                    !!raw.commerce

            },

            generatedAt:
                new Date().toISOString()

        };

    }

}

export default WebsiteResourceBuilder;