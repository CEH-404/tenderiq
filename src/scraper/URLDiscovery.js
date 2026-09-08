import logger from "../logger/Logger.js";
import URLNormalizer from "./URLNormalizer.js";

class URLDiscovery {

    discover(baseUrl, links) {

        logger.info("Discovering URLs...");

        if (!Array.isArray(links)) {

            throw new Error("Links must be an array.");

        }

        const discovered =
            links.map(link => link.href);

        const unique =
            [...new Set(discovered)];

        return URLNormalizer.clean(
            discovered,
            baseUrl
);

    }

    internal(baseUrl, urls) {

        const origin =
            new URL(baseUrl).origin;

        return urls.filter(url => {

            try {

                return new URL(url).origin === origin;

            }

            catch {

                return false;

            }

        });

    }

    external(baseUrl, urls) {

        const origin =
            new URL(baseUrl).origin;

        return urls.filter(url => {

            try {

                return new URL(url).origin !== origin;

            }

            catch {

                return false;

            }

        });

    }

}

export default URLDiscovery;