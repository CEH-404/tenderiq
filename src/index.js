import Framework from "./core/Framework.js";

const url = process.argv[2];

if (!url) {

    console.error(
        "Usage: node src/index.js <url> [maxDepth] [maxPages] [timeout]"
    );

    process.exit(1);

}

const maxDepth = Number(process.argv[3] || process.env.MAX_DEPTH || 3);
const maxPages = Number(process.argv[4] || process.env.MAX_PAGES || 100);
const timeout = Number(process.argv[5] || process.env.TIMEOUT || 30000);

const framework = new Framework();

await framework.initialize();

const result = await framework.crawl({
    url,
    maxDepth,
    maxPages,
    timeout
});

console.dir(result, {
    depth: null
});

await framework.shutdown();