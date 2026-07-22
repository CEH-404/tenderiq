class FAQExtractor {

    async extract(page) {

        return await page.evaluate(() => {

            const faqs = [];

            // ----------------------------------
            // Method 1: <details><summary>
            // ----------------------------------

            document
                .querySelectorAll("details")
                .forEach(item => {

                    const question =
                        item.querySelector("summary")
                            ?.innerText
                            ?.trim();

                    const answer =
                        item.innerText
                            .replace(question || "", "")
                            .trim();

                    if (question) {

                        faqs.push({

                            question,

                            answer,

                            source: "details"

                        });

                    }

                });

            // ----------------------------------
            // Method 2: Accordion FAQ
            // ----------------------------------

            const accordionSelectors = [

                ".faq-item",
                ".accordion-item",
                ".faq",
                ".question"

            ];

            accordionSelectors.forEach(selector => {

                document.querySelectorAll(selector)
                    .forEach(item => {

                        const question =

                            item.querySelector(

                                "h2,h3,h4,h5,.question,.title,button"

                            )?.innerText?.trim();

                        const answer =

                            item.querySelector(

                                ".answer,.content,p,div"

                            )?.innerText?.trim();

                        if (

                            question &&

                            answer

                        ) {

                            faqs.push({

                                question,

                                answer,

                                source: "accordion"

                            });

                        }

                    });

            });

            // ----------------------------------
            // Method 3: FAQPage JSON-LD
            // ----------------------------------

            document

                .querySelectorAll(

                    'script[type="application/ld+json"]'

                )

                .forEach(script => {

                    try {

                        const json =

                            JSON.parse(script.innerText);

                        const schemas =

                            Array.isArray(json)

                                ? json

                                : [json];

                        schemas.forEach(schema => {

                            if (

                                schema["@type"] ===

                                "FAQPage"

                            ) {

                                (

                                    schema.mainEntity || []

                                )

                                    .forEach(item => {

                                        faqs.push({

                                            question:

                                                item.name,

                                            answer:

                                                item.acceptedAnswer?.text ||

                                                "",

                                            source:

                                                "jsonld"

                                        });

                                    });

                            }

                        });

                    }

                    catch {

                    }

                });

            // ----------------------------------
            // Method 4: Microdata
            // ----------------------------------

            document

                .querySelectorAll(

                    '[itemtype*="Question"]'

                )

                .forEach(item => {

                    const question =

                        item.querySelector(

                            '[itemprop="name"]'

                        )?.innerText?.trim();

                    const answer =

                        item.querySelector(

                            '[itemprop="text"]'

                        )?.innerText?.trim();

                    if (

                        question &&

                        answer

                    ) {

                        faqs.push({

                            question,

                            answer,

                            source: "microdata"

                        });

                    }

                });

            // ----------------------------------
            // Remove Duplicates
            // ----------------------------------

            const unique = [];

            const seen = new Set();

            faqs.forEach(item => {

                const key =

                    item.question +

                    item.answer;

                if (

                    !seen.has(key)

                ) {

                    seen.add(key);

                    unique.push(item);

                }

            });

            return {

                totalFAQs:

                    unique.length,

                faqs:

                    unique

            };

        });

    }

}

export default FAQExtractor;