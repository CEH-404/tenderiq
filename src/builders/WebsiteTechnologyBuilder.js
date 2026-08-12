class WebsiteTechnologyBuilder {

    static build(raw = {}) {

        const resources =
            raw.resources || {};

        const metadata =
            raw.metadata || {};

        return {

            technologies: {

                javascript:
                    (resources.scripts || 0) > 0,

                css:
                    (resources.stylesheets || 0) > 0,

                schemaMarkup:
                    (resources.schemas || 0) > 0,

                forms:
                    (resources.forms || 0) > 0,

                search:
                    (resources.search || 0) > 0

            },

            assets: {

                scripts:
                    resources.scripts || 0,

                stylesheets:
                    resources.stylesheets || 0,

                schemas:
                    resources.schemas || 0,

                forms:
                    resources.forms || 0

            },

            seo: {

                title:
                    metadata.title || "",

                description:
                    metadata.description || "",

                keywords:
                    metadata.keywords || ""

            },

            generatedAt:
                new Date().toISOString()

        };

    }

}

export default WebsiteTechnologyBuilder;