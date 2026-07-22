class TableClassifier {

    static classify(table = {}) {

        const headers = (table.headers || [])
            .map(header => String(header).toLowerCase().trim());

        const joined = headers.join(" ");

        // =============================
        // Tender Tables
        // =============================

        if (
            joined.includes("tender") ||
            joined.includes("bid") ||
            joined.includes("procurement") ||
            joined.includes("closing date") ||
            joined.includes("opening date") ||
            joined.includes("emd")
        ) {

            return "tender";

        }

        // =============================
        // Product Tables
        // =============================

        if (
            joined.includes("product") ||
            joined.includes("price") ||
            joined.includes("sku") ||
            joined.includes("stock") ||
            joined.includes("quantity")
        ) {

            return "product";

        }

        // =============================
        // Contact Tables
        // =============================

        if (
            joined.includes("phone") ||
            joined.includes("email") ||
            joined.includes("contact") ||
            joined.includes("mobile")
        ) {

            return "contact";

        }

        // =============================
        // Employee Tables
        // =============================

        if (
            joined.includes("employee") ||
            joined.includes("designation") ||
            joined.includes("department") ||
            joined.includes("staff")
        ) {

            return "employee";

        }

        // =============================
        // Financial Tables
        // =============================

        if (
            joined.includes("amount") ||
            joined.includes("cost") ||
            joined.includes("budget") ||
            joined.includes("payment")
        ) {

            return "financial";

        }

        // =============================
        // Schedule Tables
        // =============================

        if (
            joined.includes("date") ||
            joined.includes("time") ||
            joined.includes("schedule") ||
            joined.includes("event")
        ) {

            return "schedule";

        }

        // =============================
        // Generic
        // =============================

        return "generic";

    }

}

export default TableClassifier;