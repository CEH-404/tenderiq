class ImagePipeline {

    constructor() {

    }

    async initialize() {

    }

    async execute(url) {

        return {

            type: "image",

            url,

            status: "coming-soon"

        };

    }

    async shutdown() {

    }

}

export default ImagePipeline;