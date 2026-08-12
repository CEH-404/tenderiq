import fs from "fs-extra";
import path from "path";

class ExportHelper {

    static async saveJSON(data, outputPath) {

        await fs.ensureDir(
            path.dirname(outputPath)
        );

        await fs.writeJson(
            outputPath,
            data,
            {
                spaces: 2
            }
        );

        return outputPath;

    }

    static async saveText(text, outputPath) {

        await fs.ensureDir(
            path.dirname(outputPath)
        );

        await fs.writeFile(
            outputPath,
            text,
            "utf8"
        );

        return outputPath;

    }

    static timestamp() {

        const now = new Date();

        return now
            .toISOString()
            .replace(/:/g, "-")
            .replace(/\..+/, "");

    }

    static filename(prefix, extension) {

        return `${prefix}-${this.timestamp()}.${extension}`;

    }

    static async ensureOutputDirectory(directory = "./outputs") {

        await fs.ensureDir(directory);

        return directory;

    }

}

export default ExportHelper;