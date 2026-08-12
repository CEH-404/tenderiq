import Framework from "./core/Framework.js";



console.log(
    "Scraper Arguments:",
    process.argv
);



const url =
    process.argv[2]?.trim();



if (!url) {

    console.error(
        "Usage: node src/index.js <url> [maxDepth] [maxPages] [timeout]"
    );

    process.exit(1);

}



try {


    new URL(url);


}
catch(error){


    console.error(
        "Invalid URL:",
        url
    );

    process.exit(1);


}



const maxDepth =
    Number(
        process.argv[3]
        ||
        process.env.MAX_DEPTH
        ||
        3
    );



const maxPages =
    Number(
        process.argv[4]
        ||
        process.env.MAX_PAGES
        ||
        100
    );



const timeout =
    Number(
        process.argv[5]
        ||
        process.env.TIMEOUT
        ||
        30000
    );




const framework =
    new Framework();



try {


    console.log(
        "Initializing scraper framework..."
    );


    await framework.initialize();



    console.log(
        "Starting crawl:",
        {
            url,
            maxDepth,
            maxPages,
            timeout
        }
    );



    const result =
        await framework.crawl({

            url,

            maxDepth,

            maxPages,

            timeout

        });



    console.dir(
        result,
        {
            depth:null
        }
    );



}
catch(error){


    console.error(
        "Scraper execution failed:"
    );


    console.error(
        error.stack || error.message
    );


    process.exitCode = 1;


}
finally {


    console.log(
        "Shutting down framework..."
    );


    await framework.shutdown();


    console.log(
        "Scraper shutdown completed."
    );


}