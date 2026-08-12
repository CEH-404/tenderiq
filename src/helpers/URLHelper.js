class URLHelper {

    static normalize(url) {

        try {

            const parsed = new URL(url);

            parsed.hash = "";

            parsed.hostname =
                parsed.hostname.toLowerCase();

            if (
                parsed.pathname.length > 1 &&
                parsed.pathname.endsWith("/")
            ) {

                parsed.pathname =
                    parsed.pathname.slice(0, -1);

            }

            return parsed.toString();

        }

        catch {

            return null;

        }

    }

    static isValid(url) {

        try {

            new URL(url);

            return true;

        }

        catch {

            return false;

        }

    }

    static isInternal(baseUrl, targetUrl) {

        try {

            return (
                new URL(baseUrl).origin ===
                new URL(targetUrl).origin
            );

        }

        catch {

            return false;

        }

    }

    static resolve(baseUrl, href) {

        try {

            return new URL(
                href,
                baseUrl
            ).toString();

        }

        catch {

            return null;

        }

    }

}

export default URLHelper;