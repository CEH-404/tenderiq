import logger from "../logger/logger.js";


class MetadataExtractor {

    constructor(pageManager){

        if(!pageManager){
            throw new Error(
                "PageManager instance required"
            );
        }

        this.pageManager = pageManager;

    }


    async extract(pageId){

        try{

            logger.info("Extracting metadata...");


            const page = this.pageManager.get(pageId);


            if(!page){

                throw new Error(
                    `Page not found: ${pageId}`
                );

            }


            const metadata = await page.evaluate(()=>{


                const getMeta = (name)=>{

                    const element =
                    document.querySelector(
                        `meta[name="${name}"]`
                    );

                    return element
                    ?
                    element.content
                    :
                    "";

                };


                const getProperty = (property)=>{


                    const element =
                    document.querySelector(
                        `meta[property="${property}"]`
                    );


                    return element
                    ?
                    element.content
                    :
                    "";

                };


                return {

                    title:
                    document.title || "",


                    description:
                    getMeta("description"),


                    keywords:
                    getMeta("keywords")
                    ?
                    getMeta("keywords")
                    .split(",")
                    .map(k=>k.trim())
                    :
                    [],


                    author:
                    getMeta("author"),


                    robots:
                    getMeta("robots"),


                    canonical:
                    document.querySelector(
                        'link[rel="canonical"]'
                    )?.href || "",


                    language:
                    document.documentElement.lang || "",


                    charset:
                    document.characterSet || "",



                    openGraph:{

                        title:
                        getProperty(
                            "og:title"
                        ),

                        description:
                        getProperty(
                            "og:description"
                        ),

                        image:
                        getProperty(
                            "og:image"
                        ),

                        url:
                        getProperty(
                            "og:url"
                        )

                    },


                    twitter:{

                        card:
                        getMeta(
                            "twitter:card"
                        ),

                        title:
                        getMeta(
                            "twitter:title"
                        ),

                        description:
                        getMeta(
                            "twitter:description"
                        ),

                        image:
                        getMeta(
                            "twitter:image"
                        )

                    }


                };


            });


            logger.success(
                "Metadata extracted successfully."
            );


            return metadata;



        }
        catch(error){

            logger.error(
                error.message
            );

            throw error;

        }


    }


}


export default MetadataExtractor;