class DOMHelper {

    static async exists(page, selector) {

        const element =
            await page.$(selector);

        return element !== null;

    }

    static async count(page, selector) {

        return await page.$$eval(

            selector,

            elements => elements.length

        );

    }

    static async text(page, selector) {

        const element =
            await page.$(selector);

        if (!element) {

            return null;

        }

        return await element.evaluate(

            node => node.innerText.trim()

        );

    }

    static async texts(page, selector) {

        return await page.$$eval(

            selector,

            elements =>

                elements

                    .map(

                        element =>

                            element.innerText.trim()

                    )

                    .filter(Boolean)

        );

    }

    static async attributes(page, selector, attribute) {

        return await page.$$eval(

            selector,

            (elements, attribute) =>

                elements

                    .map(

                        element =>

                            element.getAttribute(attribute)

                    )

                    .filter(Boolean),

            attribute

        );

    }

}

export default DOMHelper;