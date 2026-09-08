import logger from "../logger/Logger.js";

class PageClassifier {

    classify(analysis = {}) {

        const score = {
            product: 0,
            category: 0,
            company: 0,
            article: 0,
            faq: 0,
            table: 0,
            search: 0,
            unknown: 0
        };

        const structure = analysis.structure || {};
        const navigation = analysis.navigation || {};
        const commerce = analysis.commerce || {};
        const content = analysis.content || {};

        if (commerce.hasAddToCart)
            score.product += 40;

        if (commerce.hasPrice)
            score.product += 30;

        if ((commerce.productImages || 0) >= 3)
            score.product += 20;

        if ((structure.grids || 0) >= 6)
            score.category += 30;

        if ((navigation.filters || 0) > 0)
            score.category += 20;

        if ((structure.tables || 0) > 0)
            score.table += 40;

        if ((commerce.faqCount || 0) >= 3)
            score.faq += 50;

        if (
            (commerce.emails || 0) > 0 &&
            (commerce.phones || 0) > 0
        )
            score.company += 40;

        if ((structure.paragraphs || 0) >= 20)
            score.article += 30;

        if (navigation.search)
            score.search += 40;

        let type = "unknown";
        let confidence = 0;

        for (const key of Object.keys(score)) {

            if (score[key] > confidence) {

                confidence = score[key];
                type = key;

            }

        }

        logger.info(
            `Page classified as ${type} (${confidence}%)`
        );

        return {
            type,
            confidence,
            scores: score
        };

    }

}

export default PageClassifier;