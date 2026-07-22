class SchemaValidator {

    static validate(knowledge = {}) {

        const errors = [];

        // -----------------------------
        // Website
        // -----------------------------

        if (!knowledge.website) {

            errors.push("Missing website section");

        } else {

            if (!knowledge.website.url) {

                errors.push("Missing website URL");

            }

            if (!knowledge.website.title) {

                errors.push("Missing website title");

            }

        }

        // -----------------------------
        // Company
        // -----------------------------

        if (!knowledge.company) {

            knowledge.company = {};

        }

        // -----------------------------
        // Products
        // -----------------------------

        if (!knowledge.products) {

            knowledge.products = {};

        }

        // -----------------------------
        // FAQ
        // -----------------------------

        if (!Array.isArray(knowledge.faq)) {

            knowledge.faq = [];

        }

        // -----------------------------
        // Tables
        // -----------------------------

        if (!knowledge.tables) {

            knowledge.tables = {

                totalTables: 0,

                usefulTables: 0,

                datasets: []

            };

        }

        // -----------------------------
        // Documents
        // -----------------------------

        if (!Array.isArray(knowledge.documents)) {

            knowledge.documents = [];

        }

        // -----------------------------
        // Links
        // -----------------------------

        if (!Array.isArray(knowledge.links)) {

            knowledge.links = [];

        }

        // -----------------------------
        // Resources
        // -----------------------------

        if (!knowledge.resources) {

            knowledge.resources = {

                images: []

            };

        }

        // -----------------------------
        // Metadata
        // -----------------------------

        if (!knowledge.metadata) {

            knowledge.metadata = {};

        }

        // -----------------------------
        // Statistics
        // -----------------------------

        if (!knowledge.statistics) {

            knowledge.statistics = {};

        }

        return {

            valid: errors.length === 0,

            errors,

            knowledge

        };

    }

}

export default SchemaValidator;