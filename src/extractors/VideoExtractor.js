import logger from "../logger/Logger.js";

class VideoExtractor {

    constructor(pageManager) {
        this.pageManager = pageManager;
    }

    async extract(pageId, strategy = null) {

        if (strategy && strategy.videos === false) {
            return [];
        }

        logger.info("Extracting videos...");

        const page = this.pageManager.get(pageId);

        if (!page) {
            throw new Error(`Page not found: ${pageId}`);
        }

        const videos = await page.evaluate(() => {

            const results = [];

            document.querySelectorAll("video").forEach(video => {

                results.push({

                    type: "html5",

                    src: video.currentSrc || video.src,

                    poster: video.poster || "",

                    controls: video.controls,

                    autoplay: video.autoplay,

                    muted: video.muted,

                    duration: video.duration || null

                });

            });

            document.querySelectorAll("iframe").forEach(frame => {

                const src = frame.src || "";

                if (/youtube|youtu\.be|vimeo|dailymotion/i.test(src)) {

                    results.push({

                        type: "embedded",

                        provider:
                            src.includes("youtube") || src.includes("youtu.be")
                                ? "youtube"
                                : src.includes("vimeo")
                                    ? "vimeo"
                                    : "dailymotion",

                        src

                    });

                }

            });

            return results;

        });

        logger.success(`${videos.length} video(s) extracted.`);

        return videos;

    }

}

export default VideoExtractor;