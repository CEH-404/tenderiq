import logger from "../logger/Logger.js";

class FAQExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.faq === false) {
            return [];
        }

        logger.info("Extracting FAQs...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const faqs = await page.evaluate(() => {

            const results = [];

            // <details>
            document.querySelectorAll("details").forEach(item => {

                const question =
                    item.querySelector("summary")?.innerText.trim() || "";

                const answer =
                    item.innerText.replace(question, "").trim();

                if (question && answer) {

                    results.push({
                        question,
                        answer
                    });

                }

            });

            // FAQ Sections
            document.querySelectorAll(".faq,.faqs,[class*=faq]").forEach(section => {

                const questions = section.querySelectorAll("h1,h2,h3,h4,h5,strong");

                questions.forEach(q => {

                    const question = q.innerText.trim();

                    let answer = "";

                    let node = q.nextElementSibling;

                    while (

                        node &&
                        !/^H[1-6]$/.test(node.tagName)

                    ) {

                        answer += node.innerText.trim() + "\n";
                        node = node.nextElementSibling;

                    }

                    if (question && answer.trim()) {

                        results.push({

                            question,
                            answer: answer.trim()

                        });

                    }

                });

            });

            return results;

        });

        logger.success(`${faqs.length} FAQ(s) extracted.`);

        return faqs;

    }

}

export default FAQExtractor;