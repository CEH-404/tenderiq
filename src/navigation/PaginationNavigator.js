import logger from "../logger/logger.js";

class PaginationNavigator {

    constructor(pageManager, navigationManager) {

        this.pageManager = pageManager;
        this.navigationManager = navigationManager;

    }

    async next(pageId, pagination) {

        if (!pagination.hasPagination) {
            return false;
        }

        switch (pagination.strategy) {

            case "aspnet":
                return await this.aspNet(pageId);

            case "next-button":
                return await this.nextButton(pageId, pagination);

            case "number":
                return await this.number(pageId, pagination);

            case "load-more":
                return await this.loadMore(pageId);

            case "infinite-scroll":
                return await this.infiniteScroll(pageId);

            default:
                return false;
        }
    }

    async aspNet(pageId) {

        const page = this.pageManager.get(pageId);

        //--------------------------------------------------
        // Find a usable ASP.NET next-page control
        //--------------------------------------------------

        const nextLocator = page.locator(`
            a[title="Next"],
            a[aria-label="Next"],
            a[id*="Next"],
            a[href*="Page$Next"],
            input[value="Next"],
            .rgPageNext,
            .PagerNext
        `).first();

        if (!(await nextLocator.count())) {

            logger.info("No ASP.NET next button found.");

            return false;

        }

        //--------------------------------------------------
        // Save current HTML
        //--------------------------------------------------

        const beforeHtml =
            await page.locator("body").innerHTML();

        logger.info("Moving to next ASP.NET page...");

        //--------------------------------------------------
        // Click
        //--------------------------------------------------

        await nextLocator.click();

        //--------------------------------------------------
        // Wait until DOM actually changes
        //--------------------------------------------------

        try {

            await page.waitForFunction(

                previous =>

                    document.body.innerHTML !== previous,

                beforeHtml,

                {
                    timeout: 30000
                }

            );

        }

        catch {

            logger.info("Page content did not change.");

            return false;

        }

        //--------------------------------------------------

        await page.waitForTimeout(1500);

        logger.success("Pagination successful.");

        return true;

    }

    async nextButton(pageId, pagination) {

        if (!pagination.nextUrl)
            return false;

        await this.navigationManager.goto(
            pageId,
            pagination.nextUrl
        );

        return true;
    }

    async number(pageId, pagination) {

        if (!pagination.nextUrl)
            return false;

        await this.navigationManager.goto(
            pageId,
            pagination.nextUrl
        );

        return true;
    }

    async loadMore(pageId) {

        const page = this.pageManager.get(pageId);

        const clicked = await page.evaluate(() => {

            const btn = [...document.querySelectorAll("button,a")]
                .find(el => /load more/i.test(el.innerText));

            if (!btn) return false;

            btn.click();

            return true;

        });

        if (clicked) {
            await page.waitForLoadState("networkidle");
        }

        return clicked;

    }

    async infiniteScroll(pageId) {

        const page = this.pageManager.get(pageId);

        let oldHeight = 0;

        while (true) {

            const newHeight = await page.evaluate(
                () => document.body.scrollHeight
            );

            if (newHeight === oldHeight)
                break;

            oldHeight = newHeight;

            await page.evaluate(() =>
                window.scrollTo(
                    0,
                    document.body.scrollHeight
                )
            );

            await page.waitForTimeout(1500);
        }

        return true;

    }

}

export default PaginationNavigator;