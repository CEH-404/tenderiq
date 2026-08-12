/**
 * TenderIQ - Standard Tender Schema
 *
 * Standardized Tender object used across:
 *
 * Scraper
 * Tender Pipeline
 * AI Processing Layer
 * Database Layer
 * API Layer
 *
 */


const TenderSchema = Object.freeze({


    /*
    ----------------------------------
    Identity
    ----------------------------------
    */

    id: null,



    /*
    ----------------------------------
    Source Information
    ----------------------------------
    */

    source: {

        portal: "",

        url: "",

        extractedPage: ""

    },



    /*
    ----------------------------------
    Tender References
    ----------------------------------
    */

    reference: {

        tenderNo: "",

        tsNo: "",

        externalId: ""

    },



    /*
    ----------------------------------
    Core Tender Information
    ----------------------------------
    */

    title: "",


    organization: "",


    department: "",



    procurementMethod: "",


    procurementType: "",



    category: "",


    description: "",




    /*
    ----------------------------------
    Geographic Information
    ----------------------------------
    */

    city: "",


    province: "",



    location: {


        address: "",


        city: "",


        province: "",


        country: "Pakistan"


    },




    /*
    ----------------------------------
    Tender Dates
    ----------------------------------
    */

    publishedDate: null,


    closingDate: null,


    openingDate: null,



    /*
    ----------------------------------
    Tender Status
    ----------------------------------
    */

    status: "ACTIVE",




    /*
    ----------------------------------
    Documents / Attachments
    ----------------------------------
    */

    documents: [],



    /*
    ----------------------------------
    Contact Information
    ----------------------------------
    */

    contact: {


        name: "",


        email: "",


        phone: ""


    },





    /*
    ----------------------------------
    AI Processing Fields
    ----------------------------------
    */


    ai: {


        cleaned: false,


        categorized: false,


        category: "",


        tags: [],


        confidence: 0,


        summary: ""


    },






    /*
    ----------------------------------
    Duplicate Detection
    ----------------------------------
    */

    fingerprint: "",





    /*
    ----------------------------------
    Extraction Metadata
    ----------------------------------
    */

    metadata: {


        page: 1,


        tableIndex: null,


        scrapedAt: null,


        extractedAt: null,


        scraperVersion: "1.0.0"


    }



});


export default TenderSchema;