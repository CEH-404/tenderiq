import ResourceType from "./ResourceType.js";
import ResourceDetector from "./ResourceDetector.js";

class ResourceRouter {

    static async route(url) {

        const type =
            await ResourceDetector.detect(url);

        return {

            url,

            type,

            html:
                type === ResourceType.HTML,

            pdf:
                type === ResourceType.PDF,

            image:
                type === ResourceType.IMAGE,

            video:
                type === ResourceType.VIDEO,

            document:
                type === ResourceType.DOCUMENT,

            archive:
                type === ResourceType.ARCHIVE,

            json:
                type === ResourceType.JSON,

            xml:
                type === ResourceType.XML

        };

    }

}

export default ResourceRouter;