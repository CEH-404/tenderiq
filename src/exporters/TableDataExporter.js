import fs from "fs/promises";
import path from "path";

class TableDataExporter {

    async export(knowledge) {

        const outputDir = "./outputs";

        await fs.mkdir(outputDir, { recursive: true });

        const tableData =
            knowledge?.tables?.datasets || [];

        await fs.writeFile(

            path.join(outputDir, "table-data.json"),

            JSON.stringify(tableData, null, 2),

            "utf8"

        );

        return path.join(outputDir, "table-data.json");

    }

}

export default TableDataExporter;