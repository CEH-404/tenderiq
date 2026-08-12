class CrawlQueueManager {

    constructor(options = {}) {

        this.maxDepth =
            options.maxDepth ?? Infinity;

        this.maxPages =
            options.maxPages ?? Infinity;

        this.queue = [];

        this.visited = new Set();

        this.queued = new Set();

    }

    enqueue(url, depth = 0, priority = 50) {

        if (!url) {
            return false;
        }

        if (depth > this.maxDepth) {
            return false;
        }

        if (this.visited.has(url)) {
            return false;
        }

        if (this.queued.has(url)) {
            return false;
        }

        this.queue.push({

            url,

            depth,

            priority

        });

        this.queue.sort(
            (a, b) => b.priority - a.priority
        );

        this.queued.add(url);

        return true;

    }

    dequeue() {

        if (this.isEmpty()) {
            return null;
        }

        const item =
            this.queue.shift();

        this.queued.delete(
            item.url
        );

        return item;

    }

    markVisited(url) {

        if (!url) {
            return;
        }

        this.visited.add(url);

    }

    isVisited(url) {

        return this.visited.has(url);

    }

    isQueued(url) {

        return this.queued.has(url);

    }

    canVisit(url) {

        return (

            !this.isVisited(url) &&

            !this.isQueued(url)

        );

    }

    isEmpty() {

        return this.queue.length === 0;

    }

    clear() {

        this.queue = [];

        this.visited.clear();

        this.queued.clear();

    }

    getStats() {

        return {

            queued:
                this.queue.length,

            visited:
                this.visited.size,

            remaining:
                this.queue.length,

            processed:
                this.visited.size,

            maxPages:
                this.maxPages

        };

    }

    reachedLimit() {

        return (

            this.visited.size >=
            this.maxPages

        );

    }

}

export default CrawlQueueManager;