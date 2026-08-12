import logger from "../logger/logger.js";

class FormExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.forms === false) {
            return [];
        }

        logger.info("Extracting forms...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const forms = await page.evaluate(() => {

            return [...document.forms].map(form => ({

                id: form.id || "",

                name: form.name || "",

                method: (form.method || "GET").toUpperCase(),

                action: form.action || "",

                enctype: form.enctype || "",

                fields: [...form.elements].map(field => ({

                    tag: field.tagName,

                    type: field.type || "",

                    name: field.name || "",

                    id: field.id || "",

                    placeholder: field.placeholder || "",

                    required: field.required || false

                }))

            }));

        });

        logger.success(`${forms.length} form(s) extracted.`);

        return forms;

    }

}

export default FormExtractor;