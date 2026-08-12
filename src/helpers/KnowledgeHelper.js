class KnowledgeHelper {

    static summarize(knowledge = {}) {

        return {

            pageType:
                knowledge.page?.type || "unknown",

            confidence:
                knowledge.page?.confidence || 0,

            totalLinks:
                knowledge.links?.length || 0,

            totalTables:
                knowledge.tables?.length || 0,

            totalGridItems:
                knowledge.gridData?.length || 0,

            totalFAQ:
                knowledge.faq?.length || 0,

            hasCompany:
                !!knowledge.company,

            hasCommerce:
                !!knowledge.commerce

        };

    }

    static merge(...objects) {

        return Object.assign({}, ...objects);

    }

    static clone(object) {

        return JSON.parse(

            JSON.stringify(object)

        );

    }

    static isEmpty(object) {

        return Object.keys(object).length === 0;

    }

    static timestamp() {

        return new Date().toISOString();

    }

}

export default KnowledgeHelper;