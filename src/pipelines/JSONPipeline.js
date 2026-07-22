class JSONPipeline {

    constructor() {

    }

    async initialize() {

    }

    async execute(url) {

        return {

            type: "json",

            url,

            status: "coming-soon"

        };

    }

    async shutdown() {

    }

}

export default JSONPipeline;