class ResourceClassifier {

    classify(resources = {}) {

        return {

            html:
                (resources.html || 0) > 0,

            images:
                (resources.images || 0) > 0,

            videos:
                (resources.videos || 0) > 0,

            documents:
                (resources.documents || 0) > 0,

            pdf:
                (resources.pdfs || 0) > 0,

            schemas:
                (resources.schemas || 0) > 0,

            scripts:
                (resources.scripts || 0) > 0,

            styles:
                (resources.stylesheets || 0) > 0,

            forms:
                (resources.forms || 0) > 0,

            tables:
                (resources.tables || 0) > 0,

            links:
                (resources.links || 0) > 0,

            mediaScore:

                (resources.images || 0) +
                (resources.videos || 0) +
                (resources.documents || 0),

            contentScore:

                (resources.tables || 0) +
                (resources.links || 0) +
                (resources.schemas || 0)

        };

    }

}

export default ResourceClassifier;