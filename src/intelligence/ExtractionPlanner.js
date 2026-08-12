import PageClassifier from "./PageClassifier.js";

class ExtractionPlanner {

    constructor() {

        this.classifier = new PageClassifier();

    }

    plan(analysis = {}, resources = {}) {

        const page =
            this.classifier.classify(analysis);

        const strategy = {

            pageType: page.type,

            confidence: page.confidence,

            html: true,

            text: true,

            metadata: true,

            links: true,

            tables: false,

            grids: false,

            commerce: false,

            company: false,

            faq: false,

            article: false,

            images: false,

            videos: false,

            documents: false,

            schema: false,

            forms: false,

            scripts: false,

            styles: false,

            search: false

        };

        switch (page.type) {

            case "product":

                strategy.commerce = true;
                strategy.images = true;
                strategy.schema = true;
                strategy.forms = true;

                break;

            case "category":

                strategy.grids = true;
                strategy.images = true;
                strategy.search = true;

                break;

            case "company":

                strategy.company = true;
                strategy.forms = true;

                break;

            case "faq":

                strategy.faq = true;
                strategy.schema = true;

                break;

            case "article":

                strategy.article = true;
                strategy.images = true;

                break;

            case "table":

                strategy.tables = true;

                break;

        }

        if (resources.documents > 0)
            strategy.documents = true;

        if (resources.images > 0)
            strategy.images = true;

        if (resources.videos > 0)
            strategy.videos = true;

        if (resources.schemas > 0)
            strategy.schema = true;

        if (resources.forms > 0)
            strategy.forms = true;

        if (resources.scripts > 0)
            strategy.scripts = true;

        if (resources.stylesheets > 0)
            strategy.styles = true;

        return strategy;

    }

}

export default ExtractionPlanner;