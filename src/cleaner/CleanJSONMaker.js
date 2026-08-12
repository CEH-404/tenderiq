class CleanJSONMaker {


    static make(extraction = {}) {


        extraction =
            extraction || {};


        return {


            version:
                "1.0.0",



            generatedAt:
                new Date().toISOString(),



            source: {

                url:
                    extraction?.metadata?.url || "",


                portal:
                    this.detectPortal(
                        extraction?.metadata?.url
                    )

            },



            resources:

                this.cleanResources(
                    extraction.resources
                ),



            tables:

                this.cleanTables(
                    extraction.tables
                ),



            links:

                this.cleanLinks(
                    extraction.links
                ),



            metadata:

                this.cleanMetadata(
                    extraction.metadata
                )


        };


    }





    /*
    ----------------------------------
    Metadata Cleaner
    ----------------------------------
    */

    static cleanMetadata(metadata = {}) {


        metadata =
            metadata || {};


        return {


            title:
                metadata.title || "",



            language:
                metadata.language || "",



            scrapedAt:
                new Date().toISOString()


        };


    }





    /*
    ----------------------------------
    Resource Cleaner
    ----------------------------------
    */

    static cleanResources(resources = {}) {


        resources =
            resources || {};


        return {


            documents:
                resources.documents || [],



            downloads:
                resources.downloads || [],



            pdfs:
                resources.pdfs || []


        };


    }





    /*
    ----------------------------------
    Table Cleaner
    ----------------------------------
    */

    static cleanTables(tables = []) {


        if (!Array.isArray(tables)) {

            return [];

        }


        return tables.map(table => ({


            headers:
                table?.headers || [],



            rows:
                table?.rows || []


        }));


    }





    /*
    ----------------------------------
    Link Cleaner
    ----------------------------------
    */

    static cleanLinks(links = []) {


        if (!Array.isArray(links)) {

            return [];

        }


        return links.filter(

            link =>
                link &&
                link.url

        );


    }





    /*
    ----------------------------------
    Portal Detector
    ----------------------------------
    */

    static detectPortal(url = "") {


        if (!url) {

            return "";

        }


        try {


            return new URL(url).hostname;


        }

        catch {


            return "";

        }


    }


}


export default CleanJSONMaker;