class WebsiteRelationshipBuilder {

    static build(raw = {}) {

        const relationships = [];

        if (raw.company) {

            relationships.push({

                source: raw.url,

                target: "company",

                type: "owns"

            });

        }

        if (raw.commerce) {

            relationships.push({

                source: raw.url,

                target: "commerce",

                type: "contains"

            });

        }

        (raw.links || []).forEach(link => {

            relationships.push({

                source: raw.url,

                target: link.href,

                type: link.internal
                    ? "internal-link"
                    : "external-link"

            });

        });

        (raw.faq || []).forEach((faq, index) => {

            relationships.push({

                source: raw.url,

                target: `faq-${index + 1}`,

                type: "faq"

            });

        });

        (raw.tables || []).forEach((table, index) => {

            relationships.push({

                source: raw.url,

                target: `table-${index + 1}`,

                type: "table"

            });

        });

        (raw.grid || []).forEach((item, index) => {

            relationships.push({

                source: raw.url,

                target: `grid-${index + 1}`,

                type: "grid"

            });

        });

        return {

            nodes: {

                website: raw.url,

                company: raw.company || null,

                commerce: raw.commerce || null

            },

            relationships,

            generatedAt:
                new Date().toISOString()

        };

    }

}

export default WebsiteRelationshipBuilder;