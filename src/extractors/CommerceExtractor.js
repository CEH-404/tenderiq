import logger from "../logger/Logger.js";

class CommerceExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.commerce === false) {
            return [];
        }

        logger.info("Extracting commerce data...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const products = await page.evaluate(() => {

            // Universal product selectors
            const selectors = [

                // Shopify
                ".product",
                ".product-card",
                ".product-item",
                ".grid-product",

                // WooCommerce
                ".woocommerce-loop-product",
                ".product-small",
                ".type-product",

                // Elementor
                ".elementor-product",
                ".elementor-post",

                // Generic
                "[class*=product]",
                "[class*=Product]",
                "[class*=card]",
                "[data-product-id]",
                "[itemtype*='Product']"

            ];

            const elements = [];
            const seen = new Set();

            selectors.forEach(selector => {

                document.querySelectorAll(selector).forEach(el => {

                    if (!seen.has(el)) {

                        seen.add(el);
                        elements.push(el);

                    }

                });

            });

            return elements.map(el => {

                const text = el.innerText || "";

                const title =
                    el.querySelector(
                        "h1,h2,h3,h4,h5,.title,.product-title,[itemprop='name']"
                    )?.innerText.trim() || "";

                const description =
                    el.querySelector(
                        "p,.description,.product-description,[itemprop='description']"
                    )?.innerText.trim() || "";

                const image =
                    el.querySelector("img")?.src || "";

                const url =
                    el.querySelector("a")?.href || "";

                const priceNode =
                    el.querySelector(
                        ".price,.woocommerce-Price-amount,[itemprop='price'],.money"
                    );

                const price =
                    priceNode?.innerText.trim() ||
                    text.match(/(?:Rs\.?|PKR|\$|€|£|₹)\s?[\d,.]+/i)?.[0] ||
                    "";

                const availability =
                    /in stock/i.test(text)
                        ? "In Stock"
                        : /out of stock/i.test(text)
                        ? "Out of Stock"
                        : "";

                const addToCart =
                    !![...el.querySelectorAll("button,a,input")]
                        .find(node =>
                            /add to cart|buy now|purchase|order/i
                                .test(node.innerText || "")
                        );

                return {

                    title,
                    description,
                    price,
                    image,
                    url,
                    availability,
                    addToCart

                };

            }).filter(product =>
                product.title ||
                product.price ||
                product.image
            );

        });

        logger.success(
            `${products.length} commerce item(s) extracted.`
        );

        return products;

    }

}

export default CommerceExtractor;