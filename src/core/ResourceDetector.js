import axios from "axios";
import ResourceType from "./ResourceType.js";

class ResourceDetector {

    static async detect(url) {

        console.log("\n========== Resource Detector ==========");
        console.log("URL:", url);

        // -----------------------------
        // 1. Extension Detection
        // -----------------------------

        const extensionType = this.detectByExtension(url);

        console.log("Extension Result:", extensionType);

        if (extensionType !== ResourceType.UNKNOWN) {
            return extensionType;
        }

        // -----------------------------
        // 2. HEAD Request
        // -----------------------------

        try {

            const response = await axios.head(url, {

                timeout: 10000,

                maxRedirects: 5,

                validateStatus: () => true

            });

            const contentType =
                response.headers["content-type"] || "";

            console.log("HTTP Status:", response.status);
            console.log("Content-Type:", contentType);

            const headerType =
                this.detectByContentType(contentType);

            console.log("Header Result:", headerType);

            if (headerType !== ResourceType.UNKNOWN) {
                return headerType;
            }

        }

        catch (error) {

            console.log("HEAD Request Failed:");
            console.log(error.message);

        }

        // -----------------------------
        // 3. GET Fallback
        // -----------------------------

        try {

            const response = await axios.get(url, {

                timeout: 10000,

                maxRedirects: 5,

                responseType: "stream",

                validateStatus: () => true

            });

            const contentType =
                response.headers["content-type"] || "";

            console.log("GET Content-Type:", contentType);

            const getType =
                this.detectByContentType(contentType);

            console.log("GET Result:", getType);

            if (getType !== ResourceType.UNKNOWN) {

                response.data.destroy();

                return getType;

            }

            response.data.destroy();

        }

        catch (error) {

            console.log("GET Request Failed:");
            console.log(error.message);

        }

        // -----------------------------
        // 4. Dynamic Page Heuristics
        // -----------------------------

        const lower = url.toLowerCase();

        if (

            lower.endsWith(".aspx") ||

            lower.endsWith(".php") ||

            lower.endsWith(".jsp") ||

            lower.endsWith(".asp") ||

            lower.includes("/product") ||

            lower.includes("/category") ||

            lower.includes("/blog") ||

            lower.includes("/news") ||

            lower.includes("/article") ||

            lower.includes("/shop")

        ) {

            console.log("Detected Dynamic HTML Page");

            return ResourceType.HTML;

        }

        // -----------------------------
        // 5. Safe Default
        // -----------------------------

        console.log("Fallback -> HTML");

        return ResourceType.HTML;

    }

    static detectByExtension(url) {

        const lower = url.toLowerCase();

        if (lower.endsWith(".pdf"))
            return ResourceType.PDF;

        if (
            lower.endsWith(".png") ||
            lower.endsWith(".jpg") ||
            lower.endsWith(".jpeg") ||
            lower.endsWith(".gif") ||
            lower.endsWith(".svg") ||
            lower.endsWith(".webp")
        )
            return ResourceType.IMAGE;

        if (
            lower.endsWith(".doc") ||
            lower.endsWith(".docx") ||
            lower.endsWith(".xls") ||
            lower.endsWith(".xlsx") ||
            lower.endsWith(".ppt") ||
            lower.endsWith(".pptx")
        )
            return ResourceType.DOCUMENT;

        if (
            lower.endsWith(".mp4") ||
            lower.endsWith(".avi") ||
            lower.endsWith(".mov") ||
            lower.endsWith(".mkv")
        )
            return ResourceType.VIDEO;

        if (lower.endsWith(".json"))
            return ResourceType.JSON;

        if (
            lower.endsWith(".xml")
        )
            return ResourceType.XML;

        if (
            lower.endsWith(".zip") ||
            lower.endsWith(".rar") ||
            lower.endsWith(".7z")
        )
            return ResourceType.ARCHIVE;

        return ResourceType.UNKNOWN;

    }

    static detectByContentType(contentType = "") {

        const type =
            contentType.toLowerCase();

        if (type.includes("text/html"))
            return ResourceType.HTML;

        if (type.includes("application/pdf"))
            return ResourceType.PDF;

        if (type.includes("image/"))
            return ResourceType.IMAGE;

        if (type.includes("video/"))
            return ResourceType.VIDEO;

        if (
            type.includes("application/msword") ||

            type.includes("officedocument")
        )
            return ResourceType.DOCUMENT;

        if (type.includes("application/json"))
            return ResourceType.JSON;

        if (
            type.includes("application/xml") ||
            type.includes("text/xml")
        )
            return ResourceType.XML;

        if (
            type.includes("application/zip") ||
            type.includes("application/x-rar")
        )
            return ResourceType.ARCHIVE;

        return ResourceType.UNKNOWN;

    }

}

export default ResourceDetector;