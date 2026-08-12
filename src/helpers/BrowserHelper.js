class BrowserHelper {

    static async waitForNetworkIdle(page, timeout = 5000) {

        await page.waitForLoadState(
            "networkidle",
            { timeout }
        );

    }

    static async waitForSelector(page, selector, timeout = 5000) {

        await page.waitForSelector(
            selector,
            { timeout }
        );

    }

    static async scrollToBottom(page) {

        await page.evaluate(async () => {

            await new Promise(resolve => {

                let totalHeight = 0;

                const distance = 500;

                const timer = setInterval(() => {

                    window.scrollBy(0, distance);

                    totalHeight += distance;

                    if (

                        totalHeight >=
                        document.body.scrollHeight

                    ) {

                        clearInterval(timer);

                        resolve();

                    }

                }, 100);

            });

        });

    }

    static async autoScroll(page) {

        await this.scrollToBottom(page);

        await page.waitForTimeout(1000);

    }

    static async screenshot(page, path) {

        await page.screenshot({

            path,

            fullPage: true

        });

    }

}

export default BrowserHelper;