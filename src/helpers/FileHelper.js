import fs from "fs-extra";
import path from "path";

class FileHelper {

    static async ensureDirectory(directory) {

        await fs.ensureDir(directory);

    }

    static async exists(filePath) {

        return await fs.pathExists(filePath);

    }

    static async read(filePath, encoding = "utf8") {

        return await fs.readFile(
            filePath,
            encoding
        );

    }

    static async write(filePath, data) {

        await fs.ensureDir(
            path.dirname(filePath)
        );

        await fs.writeFile(
            filePath,
            data
        );

        return filePath;

    }

    static async append(filePath, data) {

        await fs.ensureDir(
            path.dirname(filePath)
        );

        await fs.appendFile(
            filePath,
            data
        );

    }

    static async remove(filePath) {

        if (await fs.pathExists(filePath)) {

            await fs.remove(filePath);

        }

    }

    static filename(filePath) {

        return path.basename(filePath);

    }

    static extension(filePath) {

        return path.extname(filePath);

    }

    static directory(filePath) {

        return path.dirname(filePath);

    }

}

export default FileHelper;