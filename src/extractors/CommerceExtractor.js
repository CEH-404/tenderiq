class CommerceExtractor {

    async extract(page) {

        return await page.evaluate(() => {

            const getText = (selector) => {
                const el = document.querySelector(selector);
                return el ? el.textContent.trim() : null;
            };

            const getAttribute = (selector, attribute) => {
                const el = document.querySelector(selector);
                return el ? el.getAttribute(attribute) : null;
            };

            // ---------- Product Name ----------

            const productName =
                getText("h1") ||
                getAttribute("meta[property='og:title']", "content") ||
                document.title;

            // ---------- Price ----------

            const priceSelectors = [
                "[itemprop='price']",
                ".price",
                ".product-price",
                ".sale-price",
                ".current-price",
                ".woocommerce-Price-amount",
                ".price-item"
            ];

            let price = null;

            for (const selector of priceSelectors) {

                price = getText(selector);

                if (price) break;
            }

            // ---------- Currency ----------

            const currency =
                getAttribute("[itemprop='priceCurrency']", "content") ||
                getText(".currency") ||
                null;

            // ---------- SKU ----------

            const sku =
                getText("[itemprop='sku']") ||
                getText(".sku") ||
                null;

            // ---------- Brand ----------

            const brand =
                getText("[itemprop='brand']") ||
                getText(".brand") ||
                null;

            // ---------- Availability ----------

            const availability =
                getText("[itemprop='availability']") ||
                getText(".stock") ||
                null;

            // ---------- Description ----------

            const description =
                getAttribute(
                    "meta[name='description']",
                    "content"
                ) ||
                getText(".description") ||
                getText(".product-description");

            // ---------- Images ----------

            const images = [

                ...document.querySelectorAll("img")

            ]
                .map(img => img.src)
                .filter(Boolean);

            // ---------- Add To Cart ----------

            const hasAddToCart =

                !!document.querySelector(

                    "button[name='add-to-cart'],\
                     button.add-to-cart,\
                     .single_add_to_cart_button,\
                     form[action*='cart']"

                );

            // ---------- Categories ----------

            const categories = [

                ...document.querySelectorAll(

                    ".product-category,\
                     .posted_in a,\
                     nav.breadcrumb a"

                )

            ]

                .map(el => el.textContent.trim())

                .filter(Boolean);

            return {

                productName,

                price,

                currency,

                sku,

                brand,

                availability,

                description,

                hasAddToCart,

                categories,

                images

            };

        });

    }

}

export default CommerceExtractor;