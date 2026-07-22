class WebsiteTypeDetector {

    static detect(data = {}) {

        const content = [

            data.metadata?.title || "",

            data.metadata?.description || "",

            data.text || "",

            JSON.stringify(data.links || [])

        ]

        .join(" ")

        .toLowerCase();

        const websiteTypes = {

            ecommerce: [
                "add to cart",
                "buy now",
                "checkout",
                "product",
                "price",
                "shop",
                "woocommerce",
                "shopify"
            ],

            government: [
                "government",
                ".gov",
                "tender",
                "procurement",
                "ministry",
                "department",
                "public notice"
            ],

            company: [
                "about us",
                "our services",
                "our clients",
                "contact us",
                "our team",
                "mission",
                "vision"
            ],

            university: [
                "admission",
                "faculty",
                "student",
                "campus",
                "university",
                "research"
            ],

            hospital: [
                "doctor",
                "patient",
                "appointment",
                "hospital",
                "clinic",
                "medical"
            ],

            blog: [
                "posted by",
                "comments",
                "categories",
                "recent posts",
                "read more"
            ],

            documentation: [
                "documentation",
                "api",
                "getting started",
                "installation",
                "reference"
            ]

        };

        let bestType = "unknown";
        let bestScore = 0;

        const scores = {};

        for (const [type, keywords] of Object.entries(websiteTypes)) {

            let score = 0;

            for (const keyword of keywords) {

                if (content.includes(keyword)) {

                    score++;

                }

            }

            scores[type] = score;

            if (score > bestScore) {

                bestScore = score;
                bestType = type;

            }

        }

        return {

            type: bestType,

            confidence: Math.min(bestScore * 20, 100),

            scores

        };

    }

}

export default WebsiteTypeDetector;