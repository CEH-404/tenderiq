export default class TableExtractor {

    async extract(page) {

        // Wait until the procurement table is loaded
        await page.waitForSelector("table");

        return await page.evaluate(() => {

            // Find the table containing the procurement headers
            const tables = [...document.querySelectorAll("table")];

            const procurementTable = tables.find(table =>
                table.innerText.includes("Procurement Title") &&
                table.innerText.includes("Procurement Name")
            );

            if (!procurementTable) {
                return [];
            }

            const rows = [...procurementTable.querySelectorAll("tbody tr")];

            return rows
                .map(row => {

                    const cells = [...row.querySelectorAll("td")];

                    // Ignore header/footer/pager rows
                    if (cells.length < 9) {
                        return null;
                    }

                    return {
                        title: cells[0]?.innerText.trim() || "",
                        procurementName: cells[1]?.innerText.trim() || "",
                        type: cells[2]?.innerText.trim() || "",
                        publishDate: cells[3]?.innerText.trim() || "",
                        closeDate: cells[4]?.innerText.trim() || "",
                        department: cells[5]?.innerText.trim() || "",

                        tenderNotice:
                            cells[7]?.querySelector("a")?.href || "",

                        biddingDocument:
                            cells[8]?.querySelector("a")?.href || ""
                    };

                })
                .filter(row => row !== null);

        });

    }

}