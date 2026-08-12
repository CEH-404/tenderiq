class ContentHelper {

    static wordCount(text = "") {

        return text
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .length;

    }

    static characterCount(text = "") {

        return text.length;

    }

    static readingTime(text = "") {

        const words = this.wordCount(text);

        return Math.max(
            1,
            Math.ceil(words / 200)
        );

    }

    static isEmpty(text = "") {

        return !text.trim();

    }

    static truncate(text = "", maxLength = 300) {

        if (text.length <= maxLength) {

            return text;

        }

        return text.substring(0, maxLength) + "...";

    }

    static statistics(text = "") {

        return {

            words:
                this.wordCount(text),

            characters:
                this.characterCount(text),

            readingTime:
                this.readingTime(text),

            empty:
                this.isEmpty(text)

        };

    }

}

export default ContentHelper;