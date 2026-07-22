class VideoPipeline {

    constructor() {

    }

    async initialize() {

    }

    async execute(url) {

        return {

            type: "video",

            url,

            status: "coming-soon"

        };

    }

    async shutdown() {

    }

}

export default VideoPipeline;