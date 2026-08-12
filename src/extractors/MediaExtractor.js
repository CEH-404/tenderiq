import logger from "../logger/logger.js";

class MediaExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.media === false) {
            return {};
        }

        logger.info("Extracting media...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const media = await page.evaluate(() => {

            const videos = [...document.querySelectorAll("video")].map(video => ({

                src:
                    video.currentSrc ||
                    video.src ||
                    "",

                poster:
                    video.poster || "",

                controls:
                    video.controls,

                autoplay:
                    video.autoplay,

                muted:
                    video.muted,

                loop:
                    video.loop

            }));

            const audios = [...document.querySelectorAll("audio")].map(audio => ({

                src:
                    audio.currentSrc ||
                    audio.src ||
                    "",

                controls:
                    audio.controls,

                autoplay:
                    audio.autoplay,

                loop:
                    audio.loop

            }));

            const iframes = [...document.querySelectorAll("iframe")].map(frame => ({

                src: frame.src,

                title: frame.title || "",

                width: frame.width,

                height: frame.height

            }));

            return {

                videos,

                audios,

                iframes

            };

        });

        logger.success("Media extracted.");

        return media;

    }

}

export default MediaExtractor;