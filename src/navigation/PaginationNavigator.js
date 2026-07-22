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

    const nextBtn = page.locator(".rgPageNext");

    const before = await page.locator(".rgCurrentPage span").textContent();

    console.log("Current Page:", before);

    await nextBtn.click();

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const after = await page.locator(".rgCurrentPage span").textContent();

    if (before === after) {
        console.log("No more pages");
        return false;
    }

    logger.info(`Moved ${before} -> ${after}`);

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