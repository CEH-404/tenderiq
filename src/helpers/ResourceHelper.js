class ResourceHelper {

    static summarize(resources = {}) {

        return {

            total:

                (resources.images || 0) +

                (resources.videos || 0) +

                (resources.documents || 0) +

                (resources.pdfs || 0) +

                (resources.schemas || 0) +

                (resources.forms || 0) +

                (resources.scripts || 0) +

                (resources.stylesheets || 0),

            media:

                (resources.images || 0) +

                (resources.videos || 0),

            documents:

                (resources.documents || 0) +

                (resources.pdfs || 0),

            technologies:

                (resources.scripts || 0) +

                (resources.stylesheets || 0) +

                (resources.schemas || 0)

        };

    }

    static hasMedia(resources = {}) {

        return (

            (resources.images || 0) > 0 ||

            (resources.videos || 0) > 0

        );

    }

    static hasDocuments(resources = {}) {

        return (

            (resources.documents || 0) > 0 ||

            (resources.pdfs || 0) > 0

        );

    }

    static hasStructuredData(resources = {}) {

        return (resources.schemas || 0) > 0;

    }

}

export default ResourceHelper;