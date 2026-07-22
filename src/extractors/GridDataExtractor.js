class GridDataExtractor {

    async extract(page) {

        return await page.evaluate(() => {

            const selectors = [

                ".product",
                ".product-item",
                ".product-card",
                ".card",
                ".listing",
                ".listing-item",
                ".grid-item",
                ".item",
                ".tile",
                ".collection-item"

            ];

            const grids = [];

            const seen = new Set();

            for (const selector of selectors) {

                const elements = document.querySelectorAll(selector);

                elements.forEach((element, index) => {

                    const link =
                        element.querySelector("a")?.href || null;

                    if (link && seen.has(link)) {

                        return;

                    }

                    if (link) {

                        seen.add(link);

                    }

                    const title =

                        element.querySelector(

                            "h1,h2,h3,h4,h5,.title,.product-title,.name"

                        )?.innerText.trim() || null;

                    const price =

                        element.querySelector(

                            ".price,.product-price,.woocommerce-Price-amount,[itemprop='price']"

                        )?.innerText.trim() || null;

                    const image =

                        element.querySelector("img")?.src || null;

                    const description =

                        element.querySelector(

                            ".description,.product-description,p"

                        )?.innerText.trim() || null;

                    const button =

                        element.querySelector(

                            "button,.btn,.add-to-cart"

                        )?.innerText.trim() || null;

                    const badge =

                        element.querySelector(

                            ".badge,.label,.sale,.discount"

                        )?.innerText.trim() || null;

                    grids.push({

                        index,

                        selector,

                        title,

                        price,

                        description,

                        image,

                        url: link,

                        button,

                        badge

                    });

                });

            }

            return {

                totalItems: grids.length,

                items: grids

            };

        });

    }

}

export default GridDataExtractor;