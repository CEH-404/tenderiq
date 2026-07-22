class TableNormalizer {

    static normalize(table = {}) {

        const headers = this.normalizeHeaders(
            table.headers || []
        );

        const rows = this.normalizeRows(
            table.rows || [],
            headers.length
        );

        return {
            headers,
            rows
        };

    }

    static normalizeHeaders(headers = []) {

        return headers.map(header =>

            String(header)
                .replace(/\s+/g, " ")
                .replace(/\n/g, " ")
                .trim()

        );

    }

    static normalizeRows(rows = [], columnCount = 0) {

        return rows

            .map(row =>

                this.normalizeRow(
                    row,
                    columnCount
                )

            )

            .filter(row =>

                !this.isEmptyRow(row)

            );

    }

    static normalizeRow(row = [], columnCount = 0) {

        const normalized = row.map(cell =>

            this.normalizeCell(cell)

        );

        while (normalized.length < columnCount) {

            normalized.push("");

        }

        return normalized.slice(0, columnCount);

    }

    static normalizeCell(value) {

        if (value === null || value === undefined) {

            return "";

        }

        return String(value)

            .replace(/\s+/g, " ")

            .replace(/\n/g, " ")

            .trim();

    }

    static isEmptyRow(row = []) {

        return row.every(cell =>

            cell === ""

        );

    }

}

export default TableNormalizer;