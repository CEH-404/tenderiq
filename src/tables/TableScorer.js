class TableScorer {

    static score(table = {}) {

        let score = 0;

        const headers = (table.headers || [])
            .map(header => String(header).toLowerCase());

        const rows = table.rows || [];

        // =============================
        // Basic Structure
        // =============================

        if (headers.length >= 2)
            score += 10;

        if (rows.length >= 5)
            score += 15;

        if (rows.length >= 20)
            score += 15;

        // =============================
        // Tender Keywords
        // =============================

        const tenderKeywords = [

            "tender",
            "bid",
            "procurement",
            "department",
            "closing date",
            "opening date",
            "emd"

        ];

        score += this.keywordScore(
            headers,
            tenderKeywords,
            15
        );

        // =============================
        // Product Keywords
        // =============================

        const productKeywords = [

            "product",
            "price",
            "sku",
            "stock",
            "quantity"

        ];

        score += this.keywordScore(
            headers,
            productKeywords,
            12
        );

        // =============================
        // Contact Keywords
        // =============================

        const contactKeywords = [

            "email",
            "phone",
            "mobile",
            "contact"

        ];

        score += this.keywordScore(
            headers,
            contactKeywords,
            8
        );

        // =============================
        // Layout Detection
        // =============================

        if (headers.length <= 1)
            score -= 20;

        if (rows.length <= 1)
            score -= 20;

        // =============================
        // Empty Cells Penalty
        // =============================

        let emptyCells = 0;
        let totalCells = 0;

        for (const row of rows) {

            for (const cell of row) {

                totalCells++;

                if (
                    cell === "" ||
                    cell === null ||
                    cell === undefined
                ) {

                    emptyCells++;

                }

            }

        }

        if (totalCells > 0) {

            const ratio = emptyCells / totalCells;

            if (ratio > 0.50)
                score -= 20;

        }

        // =============================
        // Clamp Score
        // =============================

        score = Math.max(0, score);
        score = Math.min(100, score);

        return score;

    }

    static keywordScore(headers, keywords, points) {

        for (const keyword of keywords) {

            if (

                headers.some(header =>

                    header.includes(keyword)

                )

            ) {

                return points;

            }

        }

        return 0;

    }

}

export default TableScorer;