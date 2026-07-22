class DocumentPipeline {

    constructor() {

    }

    async initialize() {

    }

    async execute(url) {

        return {

            type: "document",

            url,

            status: "coming-soon"

        };

    }

    async shutdown() {

    }

}

export default DocumentPipeline;