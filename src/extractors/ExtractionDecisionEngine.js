import PageClassifier from "./PageClassifier.js";
import ResourceClassifier from "./ResourceClassifier.js";
import ContentClassifier from "./ContentClassifier.js";
import ExtractionPlanner from "./ExtractionPlanner.js";

class ExtractionDecisionEngine {

    constructor() {

        this.pageClassifier =
            new PageClassifier();

        this.resourceClassifier =
            new ResourceClassifier();

        this.contentClassifier =
            new ContentClassifier();

        this.planner =
            new ExtractionPlanner();

    }

    build(analysis = {}, resources = {}) {

        const page =
            this.pageClassifier.classify(analysis);

        const resource =
            this.resourceClassifier.classify(resources);

        const content =
            this.contentClassifier.classify(
                analysis.content || {}
            );

        const strategy =
            this.planner.plan(
                analysis,
                resources
            );

        return {

            page,

            resource,

            content,

            strategy,

            confidence:
                page.confidence,

            pageType:
                page.type

        };

    }

}

export default ExtractionDecisionEngine;