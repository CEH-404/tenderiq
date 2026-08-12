class PageHelper {

    static title(page) {

        return page.title();

    }

    static url(page) {

        return page.url();

    }

    static async html(page) {

        return await page.content();

    }

    static async text(page) {

        return await page.evaluate(() =>

            document.body.innerText

        );

    }

    static async scrollTop(page) {

        await page.evaluate(() =>

            window.scrollTo(0, 0)

        );

    }

    static async scrollBottom(page) {

        await page.evaluate(() =>

            window.scrollTo(
                0,
                document.body.scrollHeight
            )

        );

    }

    static async reload(page) {

        await page.reload({

            waitUntil: "networkidle"

        });

    }

    static async close(page) {

        if (!page.isClosed()) {

            await page.close();

        }

    }

    static async exists(page, selector) {

        return (await page.$(selector)) !== null;

    }

}

export default PageHelper;