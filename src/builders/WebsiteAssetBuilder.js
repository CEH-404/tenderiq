class WebsiteAssetBuilder {

    static build(raw = {}) {

        const resources =
            raw.resources || {};

        return {

            assets: {

                images: {

                    count:
                        resources.images || 0,

                    items:
                        raw.images || []

                },

                videos: {

                    count:
                        resources.videos || 0,

                    items:
                        raw.videos || []

                },

                documents: {

                    count:
                        resources.documents || 0,

                    items:
                        raw.documents || []

                },

                pdfs: {

                    count:
                        resources.pdfs || 0,

                    items:
                        raw.pdfs || []

                },

                scripts: {

                    count:
                        resources.scripts || 0,

                    items:
                        raw.scripts || []

                },

                stylesheets: {

                    count:
                        resources.stylesheets || 0,

                    items:
                        raw.stylesheets || []

                }

            },

            summary: {

                totalAssets:

                    (resources.images || 0) +

                    (resources.videos || 0) +

                    (resources.documents || 0) +

                    (resources.pdfs || 0) +

                    (resources.scripts || 0) +

                    (resources.stylesheets || 0)

            },

            generatedAt:
                new Date().toISOString()

        };

    }

}

export default WebsiteAssetBuilder;