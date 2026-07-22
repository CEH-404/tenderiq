import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export default class ExcelExporter {

    async export(rows, outputPath) {

        // Create output directory if it doesn't exist
        const outputDir = path.dirname(outputPath);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const workbook = new ExcelJS.Workbook();

        workbook.creator = "Enterprise Browser Framework";
        workbook.created = new Date();

        const sheet = workbook.addWorksheet("Procurement");

        sheet.columns = [
            { header: "Procurement Title", key: "title", width: 22 },
            { header: "Procurement Name", key: "procurementName", width: 55 },
            { header: "Type", key: "type", width: 15 },
            { header: "Publish Date", key: "publishDate", width: 18 },
            { header: "Close Date", key: "closeDate", width: 18 },
            { header: "Department", key: "department", width: 45 },
            { header: "Tender Notice", key: "tenderNotice", width: 18 },
            { header: "Bidding Document", key: "biddingDocument", width: 20 }
        ];

        // Header Style
        const header = sheet.getRow(1);

        header.height = 25;

        header.font = {
            bold: true,
            color: { argb: "FFFFFFFF" },
            size: 12
        };

        header.alignment = {
            horizontal: "center",
            vertical: "middle"
        };

        header.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "4472C4" }
        };

        header.eachCell(cell => {
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" }
            };
        });

        // Freeze Header
        sheet.views = [
            {
                state: "frozen",
                ySplit: 1
            }
        ];

        // Filter
        sheet.autoFilter = {
            from: "A1",
            to: "H1"
        };

        // Sort by Type (A-Z) and keep empty values at the bottom
rows.sort((a, b) => {

    const typeA = (a.type || "").trim().toLowerCase();
    const typeB = (b.type || "").trim().toLowerCase();

    // Empty values always go last
    if (typeA === "" && typeB !== "") return 1;
    if (typeA !== "" && typeB === "") return -1;
    if (typeA === "" && typeB === "") return 0;

    // Alphabetical A-Z
    return typeA.localeCompare(typeB);

});

// Add Data
rows.forEach(item => {

            const row = sheet.addRow({
                title: item.title,
                procurementName: item.procurementName,
                type: item.type,
                publishDate: item.publishDate,
                closeDate: item.closeDate,
                department: item.department
            });

            // Tender Notice hyperlink
            row.getCell(7).value = item.tenderNotice
                ? {
                    text: "🔗 Open",
                    hyperlink: item.tenderNotice
                }
                : "";

            // Bidding Document hyperlink
            row.getCell(8).value = item.biddingDocument
                ? {
                    text: "📄 Download",
                    hyperlink: item.biddingDocument
                }
                : "";

        });

        // Style all rows
        sheet.eachRow((row, rowNumber) => {

            if (rowNumber === 1) return;

            row.height = 22;

            row.eachCell(cell => {

                cell.alignment = {
                    vertical: "middle",
                    horizontal: "left",
                    wrapText: true
                };

                cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" }
                };

            });

        });

        // Alternate row colors
        sheet.eachRow((row, rowNumber) => {

            if (rowNumber === 1) return;

            if (rowNumber % 2 === 0) {

                row.eachCell(cell => {

                    cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFF8F8F8" }
                    };

                });

            }

        });

        // Hyperlink style
        for (let i = 2; i <= sheet.rowCount; i++) {

            [7, 8].forEach(col => {

                const cell = sheet.getRow(i).getCell(col);

                if (cell.value) {

                    cell.font = {
                        color: { argb: "FF0563C1" },
                        underline: true
                    };

                    cell.alignment = {
                        horizontal: "center",
                        vertical: "middle"
                    };

                }

            });

        }

        await workbook.xlsx.writeFile(outputPath);

        console.log(`Excel exported successfully: ${outputPath}`);

    }

}