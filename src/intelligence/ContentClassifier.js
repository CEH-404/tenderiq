class ContentClassifier {

    classify(content = {}) {

        const result = {

            hasTitle: false,

            hasDescription: false,

            hasKeywords: false,

            hasHeadings: false,

            hasDownloads: false,

            richness: 0

        };

        if (content.title?.trim()) {

            result.hasTitle = true;
            result.richness += 20;

        }

        if (content.metaDescription?.trim()) {

            result.hasDescription = true;
            result.richness += 20;

        }

        if (content.keywords?.trim()) {

            result.hasKeywords = true;
            result.richness += 15;

        }

        if (
            (content.h1?.length || 0) +
            (content.h2?.length || 0) > 0
        ) {

            result.hasHeadings = true;
            result.richness += 25;

        }

        if ((content.downloads || 0) > 0) {

            result.hasDownloads = true;
            result.richness += 20;

        }

        return result;

    }

}

export default ContentClassifier;