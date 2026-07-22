class XMLPipeline {

    constructor() {

    }

    async initialize() {

    }

    async execute(url) {

        return {

            type: "xml",

            url,

            status: "coming-soon"

        };

    }

    async shutdown() {

    }

}

export default XMLPipeline;