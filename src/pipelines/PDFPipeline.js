class PDFPipeline {

    constructor() {

    }

    async initialize() {

    }

    async execute(url) {

        return {

            type: "pdf",

            url,

            status: "coming-soon"

        };

    }

    async shutdown() {

    }

}

export default PDFPipeline;