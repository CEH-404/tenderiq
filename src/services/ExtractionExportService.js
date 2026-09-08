import CleanJSONExporter from "../exporters/CleanJSONExporter.js";

import logger from "../logger/Logger.js";

class ExtractionExportService {

    constructor(
        outputDirectory = "./output/clean"
    ) {

        this.exporter =
            new CleanJSONExporter(
                outputDirectory
            );

    }

    async export(extractionData = {}) {

        logger.info(
            "Starting Clean JSON Export..."
        );

        try {

            const exported =
                await this.exporter.export(
                    extractionData
                );

            logger.success(
                "Clean JSON Export Completed."
            );

            return exported;

        }
        catch (error) {

            logger.error(
                `Clean JSON Export Failed: ${error.message}`
            );

            return {

                success: false,

                filePath: null,

                error: error.message

            };

        }

    }

}

export default ExtractionExportService;