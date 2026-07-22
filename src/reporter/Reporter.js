class Reporter {

    report(result) {

        console.log("\n======================================");

        console.log("SCRAPED PAGE");

        console.log("======================================");

        console.log("\nURL:");

        console.log(result.url);

        console.log("\nMetadata:");

        console.log(result.metadata);

        console.log("\nLinks:");

        console.table(result.links);

        console.log("\nTables:");

        console.table(result.tables);

        console.log("\nGrid:");

        console.table(result.grid);

        console.log("\nText:");

        console.log(result.text);

    }

}

export default Reporter;