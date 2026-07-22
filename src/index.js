import Framework from "./core/Framework.js";

const framework = new Framework();

await framework.initialize();

const result = await framework.crawl({

    url: "https://eproc.punjab.gov.pk/ActiveTenders.aspx",
});

console.dir(result, {
    depth: null
});

await framework.shutdown();