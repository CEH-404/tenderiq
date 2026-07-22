import fs from "fs/promises";
import path from "path";

class JSONExporter {

    constructor(outputDirectory = "./output") {

        this.outputDirectory = outputDirectory;

    }

    async export(data, filename = null) {

        await fs.mkdir(this.outputDirectory, {

            recursive: true

        });

        if (!filename) {

            const now = new Date();

            filename = `scrape-${

                now.getFullYear()

            }-${
                String(now.getMonth() + 1).padStart(2, "0")
            }-${
                String(now.getDate()).padStart(2, "0")
            }_${
                String(now.getHours()).padStart(2, "0")
            }-${
                String(now.getMinutes()).padStart(2, "0")
            }-${
                String(now.getSeconds()).padStart(2, "0")
            }.json`;

        }

        const filePath = path.join(

            this.outputDirectory,

            filename

        );

        await fs.writeFile(

            filePath,

            JSON.stringify(data, null, 2),

            "utf8"

        );

        return {

            success: true,

            path: filePath,

            filename

        };

    }

}

export default JSONExporter;