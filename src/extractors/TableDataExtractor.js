class TableDataExtractor {

    async extract(page) {

        return await page.evaluate(() => {

            const tables = [];

            document.querySelectorAll("table").forEach((table, tableIndex) => {

                const headers = [];

                const rows = [];

                // -----------------------------
                // Extract Headers
                // -----------------------------

                const headerRow = table.querySelector("thead tr");

                if (headerRow) {

                    headerRow.querySelectorAll("th").forEach(th => {

                        headers.push(

                            th.innerText.trim()

                        );

                    });

                }

                // If no thead exists, use first row

                if (headers.length === 0) {

                    const firstRow = table.querySelector("tr");

                    if (firstRow) {

                        firstRow.querySelectorAll("th,td").forEach(cell => {

                            headers.push(

                                cell.innerText.trim()

                            );

                        });

                    }

                }

                // -----------------------------
                // Extract Body
                // -----------------------------

                const bodyRows = table.querySelectorAll("tbody tr");

                const sourceRows =

                    bodyRows.length > 0

                        ? bodyRows

                        : table.querySelectorAll("tr");

                sourceRows.forEach((tr, index) => {

                    if (

                        index === 0 &&

                        bodyRows.length === 0

                    ) {

                        return;

                    }

                    const row = [];

                    tr.querySelectorAll("th,td").forEach(cell => {

                        row.push({

                            text: cell.innerText.trim(),

                            html: cell.innerHTML.trim(),

                            colspan:

                                parseInt(

                                    cell.getAttribute("colspan")

                                ) || 1,

                            rowspan:

                                parseInt(

                                    cell.getAttribute("rowspan")

                                ) || 1

                        });

                    });

                    if (row.length > 0) {

                        rows.push(row);

                    }

                });

                // -----------------------------
                // Convert to Objects
                // -----------------------------

                const objects = [];

                rows.forEach(row => {

                    const obj = {};

                    row.forEach((cell, i) => {

                        const key =

                            headers[i] ||

                            `Column_${i + 1}`;

                        obj[key] = cell.text;

                    });

                    objects.push(obj);

                });

                tables.push({

                    tableIndex,

                    headers,

                    totalColumns:

                        headers.length,

                    totalRows:

                        rows.length,

                    rows,

                    objects

                });

            });

            return {

                totalTables:

                    tables.length,

                tables

            };

        });

    }

}

export default TableDataExtractor;