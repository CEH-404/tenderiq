class URLNormalizer {

    static normalize(url, baseUrl = null) {

        try {

            const parsed = baseUrl
                ? new URL(url, baseUrl)
                : new URL(url);

            // Allow only HTTP/HTTPS
            if (
                parsed.protocol !== "http:" &&
                parsed.protocol !== "https:"
            ) {
                return null;
            }

            // Normalize hostname
            parsed.hostname =
                parsed.hostname.toLowerCase();

            // Remove default ports
            if (
                (parsed.protocol === "http:" && parsed.port === "80") ||
                (parsed.protocol === "https:" && parsed.port === "443")
            ) {
                parsed.port = "";
            }

            // Remove fragment
            parsed.hash = "";

            // Remove trailing slash
            if (
                parsed.pathname.length > 1 &&
                parsed.pathname.endsWith("/")
            ) {
                parsed.pathname =
                    parsed.pathname.slice(0, -1);
            }

            // Remove common tracking parameters
            const trackingParams = [

                "utm_source",
                "utm_medium",
                "utm_campaign",
                "utm_term",
                "utm_content",

                "fbclid",
                "gclid",
                "msclkid",
                "yclid",

                "mc_cid",
                "mc_eid",

                "ref",
                "source"

            ];

            trackingParams.forEach(param => {

                parsed.searchParams.delete(param);

            });

            return parsed.toString();

        }

        catch {

            return null;

        }

    }

    static removeDuplicates(urls = []) {

        return [
            ...new Set(
                urls.filter(Boolean)
            )
        ];

    }

    static isInternal(url, baseUrl) {

        try {

            const target =
                new URL(url);

            const base =
                new URL(baseUrl);

            return (

                target.hostname === base.hostname ||

                target.hostname.endsWith(
                    "." + base.hostname
                )

            );

        }

        catch {

            return false;

        }

    }

    static hasBlockedProtocol(url) {

        const lower =
            url.toLowerCase();

        return (

            lower.startsWith("mailto:") ||

            lower.startsWith("tel:") ||

            lower.startsWith("javascript:") ||

            lower.startsWith("data:") ||

            lower.startsWith("blob:")

        );

    }

    static hasBlockedExtension(url) {

        try {

            const pathname =
                new URL(url).pathname
                    .toLowerCase();

            const extensions = [

                ".jpg",
                ".jpeg",
                ".png",
                ".gif",
                ".svg",
                ".webp",
                ".ico",

                ".css",
                ".js",
                ".map",

                ".woff",
                ".woff2",
                ".ttf",
                ".eot",

                ".pdf",
                ".doc",
                ".docx",
                ".xls",
                ".xlsx",
                ".ppt",
                ".pptx",
                ".csv",

                ".zip",
                ".rar",
                ".7z",
                ".tar",
                ".gz",

                ".mp3",
                ".mp4",
                ".avi",
                ".mov",
                ".wmv",
                ".webm",
                ".mkv",

                ".exe",
                ".bin",
                ".apk",
                ".dmg",
                ".iso"

            ];

            return extensions.some(ext =>
                pathname.endsWith(ext)
            );

        }

        catch {

            return false;

        }

    }

    static isBlockedPath(url) {

        try {

            const pathname =
                new URL(url)
                    .pathname
                    .toLowerCase();

            const blockedPaths = [

                "/cart",
                "/checkout",

                "/login",
                "/logout",
                "/signin",
                "/signup",
                "/register",

                "/account",
                "/wishlist",

                "/privacy",
                "/terms",
                "/cookie",

                "/wp-admin",
                "/admin",

                "/search",
                "/compare",

                "/feed",
                "/rss",

                "/api",
                "/graphql",
                "/ajax",

                "/assets",
                "/static"

            ];

            return blockedPaths.some(path =>

                pathname === path ||

                pathname.startsWith(
                    path + "/"
                )

            );

        }

        catch {

            return false;

        }

    }

    static isAllowed(url, baseUrl) {

        if (!url)
            return false;

        if (this.hasBlockedProtocol(url))
            return false;

        if (!this.isInternal(url, baseUrl))
            return false;

        if (this.hasBlockedExtension(url))
            return false;

        if (this.isBlockedPath(url))
            return false;

        return true;

    }

    static filter(urls, baseUrl) {

        return this.removeDuplicates(

            urls.filter(url =>

                this.isAllowed(
                    url,
                    baseUrl
                )

            )

        );

    }

    static getType(url) {

        if (this.isProduct(url))
            return "product";

        if (this.isCategory(url))
            return "category";

        if (this.isPagination(url))
            return "pagination";

        return "page";

    }

    static isProduct(url) {

        const lower =
            url.toLowerCase();

        return (

            lower.includes("/product") ||

            lower.includes("/products/") ||

            lower.includes("/item") ||

            lower.includes("/shop/")

        );

    }

    static isCategory(url) {

        const lower =
            url.toLowerCase();

        return (

            lower.includes("/category") ||

            lower.includes("/collection") ||

            lower.includes("/collections") ||

            lower.includes("/catalog")

        );

    }

    static isPagination(url) {

        const lower =
            url.toLowerCase();

        return (

            lower.includes("?page=") ||

            lower.includes("&page=")

        );

    }

    static analyze(url, baseUrl) {

        const normalized =
            this.normalize(
                url,
                baseUrl
            );

        if (!normalized) {

            return {

                valid: false,
                url: null,
                reason: "invalid"

            };

        }

        if (
            !this.isAllowed(
                normalized,
                baseUrl
            )
        ) {

            return {

                valid: false,
                url: normalized,
                reason: "blocked"

            };

        }

        return {

            valid: true,

            url: normalized,

            type:
                this.getType(
                    normalized
                ),

            priority:

                this.isProduct(normalized)
                    ? 90

                    : this.isCategory(normalized)
                        ? 80

                        : 50

        };

    }

    static clean(urls, baseUrl) {

        const normalized =

            urls

                .map(url =>

                    this.normalize(
                        url,
                        baseUrl
                    )

                )

                .filter(Boolean);

        return this.filter(

            normalized,

            baseUrl

        );

    }

}

export default URLNormalizer;

// class URLNormalizer {


//     static normalize(url, baseUrl = null) {

//         try {

//             const parsed = baseUrl
//                 ? new URL(url, baseUrl)
//                 : new URL(url);


//             // Allow only web pages
//             if (
//                 parsed.protocol !== "http:" &&
//                 parsed.protocol !== "https:"
//             ) {
//                 return null;
//             }


//             // Remove hash
//             parsed.hash = "";


//             // Remove trailing slash
//             if (
//                 parsed.pathname.length > 1 &&
//                 parsed.pathname.endsWith("/")
//             ) {

//                 parsed.pathname =
//                     parsed.pathname.slice(0, -1);

//             }


//             // Remove tracking parameters

//             const trackingParams = [

//                 "utm_source",
//                 "utm_medium",
//                 "utm_campaign",
//                 "utm_term",
//                 "utm_content",
//                 "fbclid",
//                 "gclid"

//             ];


//             trackingParams.forEach(param => {

//                 parsed.searchParams.delete(param);

//             });



//             return parsed.toString();


//         }

//         catch {

//             return null;

//         }

//     }



//     static removeDuplicates(urls = []) {

//         return [
//             ...new Set(
//                 urls.filter(Boolean)
//             )
//         ];

//     }




//     static isInternal(url, baseUrl) {


//         try {

//             const target =
//                 new URL(url);


//             const base =
//                 new URL(baseUrl);


//             return (

//                 target.hostname === base.hostname ||

//                 target.hostname.endsWith(
//                     "." + base.hostname
//                 )

//             );


//         }

//         catch {

//             return false;

//         }

//     }




//     static hasBlockedProtocol(url) {


//         const lower =
//             url.toLowerCase();


//         return (

//             lower.startsWith("mailto:") ||

//             lower.startsWith("tel:") ||

//             lower.startsWith("javascript:") ||

//             lower.startsWith("data:") ||

//             lower.startsWith("blob:")

//         );

//     }





//     static hasBlockedExtension(url) {


//         const extensions = [

//             ".jpg",
//             ".jpeg",
//             ".png",
//             ".gif",
//             ".svg",
//             ".webp",

//             ".mp4",
//             ".mp3",
//             ".avi",

//             ".pdf",
//             ".doc",
//             ".docx",

//             ".zip",
//             ".rar",
//             ".exe"

//         ];


//         const lower =
//             url.toLowerCase();



//         return extensions.some(ext =>
//             lower.endsWith(ext)
//         );

//     }




//     static isBlockedPath(url) {


//         const blockedPaths = [


//             "/cart",
//             "/checkout",

//             "/login",
//             "/logout",

//             "/signin",
//             "/signup",
//             "/register",

//             "/account",

//             "/wishlist",

//             "/privacy",
//             "/terms",

//             "/cookie",

//             "/wp-admin",

//             "/admin",

//             "/search",

//             "/compare"


//         ];



//         const pathname =
//             new URL(url).pathname
//                 .toLowerCase();



//         return blockedPaths.some(path =>

//             pathname === path ||

//             pathname.startsWith(
//                 path + "/"
//             )

//         );

//     }




//     static isAllowed(url, baseUrl) {


//         if (!url) {

//             return false;

//         }



//         if (
//             this.hasBlockedProtocol(url)
//         ) {

//             return false;

//         }



//         if (
//             !this.isInternal(
//                 url,
//                 baseUrl
//             )
//         ) {

//             return false;

//         }



//         if (
//             this.hasBlockedExtension(url)
//         ) {

//             return false;

//         }



//         if (
//             this.isBlockedPath(url)
//         ) {

//             return false;

//         }



//         return true;

//     }





//     static filter(urls, baseUrl) {


//         return this.removeDuplicates(

//             urls.filter(url =>

//                 this.isAllowed(
//                     url,
//                     baseUrl
//                 )

//             )

//         );

//     }





//     static getType(url) {


//         const lower =
//             url.toLowerCase();



//         if (
//             this.isProduct(url)
//         ) {

//             return "product";

//         }


//         if (
//             this.isCategory(url)
//         ) {

//             return "category";

//         }


//         if (
//             this.isPagination(url)
//         ) {

//             return "pagination";

//         }


//         return "page";

//     }





//     static isProduct(url) {


//         const lower =
//             url.toLowerCase();



//         return (

//             lower.includes("/product") ||

//             lower.includes("/products/") ||

//             lower.includes("/item") ||

//             lower.includes("/shop/")

//         );

//     }




//     static isCategory(url) {


//         const lower =
//             url.toLowerCase();



//         return (

//             lower.includes("/category") ||

//             lower.includes("/collection") ||

//             lower.includes("/collections") ||

//             lower.includes("/catalog")

//         );

//     }





//     static isPagination(url) {


//         return (

//             url.includes("?page=") ||

//             url.includes("&page=")

//         );

//     }





//     static analyze(url, baseUrl) {


//         const normalized =
//             this.normalize(
//                 url,
//                 baseUrl
//             );



//         if (!normalized) {

//             return {

//                 valid:false,
//                 url:null,
//                 reason:"invalid"

//             };

//         }



//         if (
//             !this.isAllowed(
//                 normalized,
//                 baseUrl
//             )
//         ) {


//             return {

//                 valid:false,
//                 url:normalized,
//                 reason:"blocked"

//             };


//         }



//         return {


//             valid:true,

//             url:normalized,

//             type:
//                 this.getType(
//                     normalized
//                 ),


//             priority:

//                 this.isProduct(normalized)
//                 ? 90

//                 :

//                 this.isCategory(normalized)
//                 ? 80

//                 :

//                 50


//         };


//     }





//     static clean(urls, baseUrl) {


//         const normalized = urls

//             .map(url =>

//                 this.normalize(
//                     url,
//                     baseUrl
//                 )

//             )

//             .filter(Boolean);



//         return this.filter(

//             normalized,

//             baseUrl

//         );

//     }


// }


// export default URLNormalizer;