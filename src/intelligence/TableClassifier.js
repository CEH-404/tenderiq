class TableClassifier {

    constructor() {

        this.categories = {

            tender: [
                "tender",
                "bid",
                "procurement",
                "closing date",
                "opening date",
                "department",
                "reference no",
                "estimated cost",
                "emd"
            ],

            product: [
                "product",
                "price",
                "sku",
                "brand",
                "stock",
                "quantity",
                "category",
                "sale price"
            ],

            employee: [
                "employee",
                "name",
                "designation",
                "department",
                "salary",
                "manager",
                "staff"
            ],

            financial: [
                "balance",
                "amount",
                "debit",
                "credit",
                "payment",
                "invoice",
                "tax",
                "profit",
                "expense"
            ],

            schedule: [
                "date",
                "time",
                "venue",
                "event",
                "schedule",
                "meeting"
            ],

            contact: [
                "phone",
                "email",
                "address",
                "mobile",
                "contact"
            ],

            specification: [
                "specification",
                "model",
                "version",
                "weight",
                "dimension",
                "capacity"
            ],

            comparison: [
                "feature",
                "comparison",
                "difference",
                "advantages",
                "plan"
            ]

        };

    }

    classify(table) {

        const headers = (table.headers || [])
            .join(" ")
            .toLowerCase();

        const rows = JSON.stringify(
            table.rows || []
        ).toLowerCase();

        const content = headers + " " + rows;

        let bestCategory = "unknown";
        let bestScore = 0;

        const scores = {};

        for (const [category, keywords] of Object.entries(this.categories)) {

            let score = 0;

            for (const keyword of keywords) {

                if (content.includes(keyword)) {

                    score++;

                }

            }

            scores[category] = score;

            if (score > bestScore) {

                bestScore = score;
                bestCategory = category;

            }

        }

        const confidence = Math.min(

            Math.round((bestScore / 5) * 100),

            100

        );

        return {

            type: bestCategory,

            confidence,

            score: bestScore,

            scores

        };

    }

    classifyAll(tables = []) {

        return tables.map(table => ({

            ...table,

            classification: this.classify(table)

        }));

    }

}

export default TableClassifier;