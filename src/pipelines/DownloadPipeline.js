class DownloadPipeline {

    constructor() {

    }

    async initialize() {

    }

    async execute(url) {

        return {

            type: "download",

            url,

            status: "coming-soon"

        };

    }

    async shutdown() {

    }

}

export default DownloadPipeline;