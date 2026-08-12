import logger from "../logger/logger.js";

class PageReady {

    constructor(page) {

        this.page = page;

    }

    async wait(timeout = 60000) {

        const start = Date.now();

        while (Date.now() - start < timeout) {

            try {

                await this.page.waitForLoadState("domcontentloaded");

                const info = await this.page.evaluate(() => {

                    return {

                        url: location.href,

                        title: document.title,

                        readyState: document.readyState,

                        body: document.body
                            ? document.body.innerText
                            : "",

                        html: document.documentElement.outerHTML

                    };

                });

                const text =
                    (
                        info.title +
                        " " +
                        info.body
                    ).toLowerCase();

                const challengeDetected =

                    text.includes("checking your browser") ||

                    text.includes("just a moment") ||

                    text.includes("verify you are human") ||

                    text.includes("attention required") ||

                    info.html.includes("cf-browser-verification") ||

                    info.html.includes("challenge-running") ||

                    info.html.includes("cf_challenge") ||

                    info.html.includes("turnstile") ||

                    info.html.includes("cf-turnstile");

                console.log("------------ PAGE READY ------------");
                console.log("URL:", info.url);
                console.log("TITLE:", info.title);
                console.log("READY:", info.readyState);
                console.log("CHALLENGE:", challengeDetected);

                if (

                    !challengeDetected &&

                    info.readyState === "complete"

                ) {

                    logger.success("Page is fully ready.");

                    return true;

                }

                await this.page.waitForTimeout(1000);

            }

            catch (err) {

                await this.page.waitForTimeout(1000);

            }

        }

        logger.warning(
            "PageReady timeout. Continuing anyway..."
        );

        return false;

    }

}

export default PageReady;