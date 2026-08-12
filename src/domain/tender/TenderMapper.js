import TenderSchema from "./TenderSchema.js";
import TenderNormalizer from "./TenderNormalizer.js";

class TenderMapper {

    static findValue(rawTender, keys = []) {

        for (const key of keys) {

            if (
                rawTender[key] !== undefined &&
                rawTender[key] !== null &&
                rawTender[key] !== ""
            ) {
                return rawTender[key];
            }

        }

        return "";

    }

    static map(rawTender = {}) {

        const tender = structuredClone(TenderSchema);

        const context = rawTender._context ?? {};

        /*
        ----------------------------------
        Identity
        ----------------------------------
        */

        tender.id =
            rawTender.id ??
            null;

        /*
        ----------------------------------
        Source
        ----------------------------------
        */

        tender.source.portal =

            context.portal ||

            this.findValue(
                rawTender,
                [
                    "sourcePortal",
                    "portal",
                    "Source",
                    "Portal"
                ]
            ) ||

            "";

        tender.source.url =

            context.sourceUrl ||

            this.findValue(
                rawTender,
                [
                    "sourceUrl",
                    "url",
                    "URL"
                ]
            ) ||

            "";

        /*
        ----------------------------------
        Reference Numbers
        ----------------------------------
        */

        tender.reference.tenderNo =

            this.findValue(
                rawTender,
                [
                    "tenderNo",
                    "tender_number",
                    "Tender No",
                    "Tender Number",
                    "Reference No",
                    "Bid No"
                ]
            );

        tender.reference.tsNo =

            this.findValue(
                rawTender,
                [
                    "tsNo",
                    "ts_number",
                    "TS No",
                    "TS Number"
                ]
            );

        /*
        ----------------------------------
        Basic Information
        ----------------------------------
        */

        tender.title =

            this.findValue(
                rawTender,
                [
                    "title",
                    "Tender Title",
                    "Tender Name",
                    "Description",
                    "Project Name"
                ]
            );

        tender.organization =

            this.findValue(
                rawTender,
                [
                    "organization",
                    "Organization",
                    "Department",
                    "Procuring Agency",
                    "Authority"
                ]
            );

        tender.department =

            this.findValue(
                rawTender,
                [
                    "department",
                    "Department",
                    "Ministry"
                ]
            );

        /*
        ----------------------------------
        Procurement
        ----------------------------------
        */

        tender.procurementMethod =

            this.findValue(
                rawTender,
                [
                    "procurementMethod",
                    "Procurement Method",
                    "Method"
                ]
            );

        tender.procurementType =

            this.findValue(
                rawTender,
                [
                    "procurementType",
                    "Procurement Type",
                    "type",
                    "Type"
                ]
            );

        /*
        ----------------------------------
        Location
        ----------------------------------
        */

        tender.city =

            this.findValue(
                rawTender,
                [
                    "city",
                    "City",
                    "District"
                ]
            );

        tender.province =

            this.findValue(
                rawTender,
                [
                    "province",
                    "Province"
                ]
            );

        tender.category =

            this.findValue(
                rawTender,
                [
                    "category",
                    "Category",
                    "Sector"
                ]
            );

        tender.description =

            this.findValue(
                rawTender,
                [
                    "description",
                    "Description",
                    "Scope of Work",
                    "Details"
                ]
            );

        /*
        ----------------------------------
        Dates
        ----------------------------------
        */

        tender.publishedDate =

            this.findValue(
                rawTender,
                [
                    "publishedDate",
                    "Advertisement Date",
                    "Published Date",
                    "Publication Date"
                ]
            ) ||

            null;

        tender.closingDate =

            this.findValue(
                rawTender,
                [
                    "closingDate",
                    "Closing Date",
                    "Bid Closing Date",
                    "Submission End Date",
                    "Last Date"
                ]
            ) ||

            null;

        tender.openingDate =

            this.findValue(
                rawTender,
                [
                    "openingDate",
                    "Opening Date",
                    "Bid Opening Date"
                ]
            ) ||

            null;

        /*
        ----------------------------------
        Documents
        ----------------------------------
        */

        const documents =

            this.findValue(
                rawTender,
                [
                    "documents",
                    "Documents",
                    "Attachments",
                    "Files"
                ]
            );

        tender.documents =

            Array.isArray(documents)
                ? documents
                : [];

        /*
        ----------------------------------
        Contact
        ----------------------------------
        */

        tender.contact = {

            name:

                this.findValue(
                    rawTender,
                    [
                        "contactName",
                        "Contact Person"
                    ]
                ),

            email:

                this.findValue(
                    rawTender,
                    [
                        "contactEmail",
                        "Email"
                    ]
                ),

            phone:

                this.findValue(
                    rawTender,
                    [
                        "contactPhone",
                        "Phone"
                    ]
                )

        };

        /*
        ----------------------------------
        Location Object
        ----------------------------------
        */

        tender.location = {

            address:

                this.findValue(
                    rawTender,
                    [
                        "address",
                        "Address"
                    ]
                ),

            city:
                tender.city,

            province:
                tender.province

        };

        /*
        ----------------------------------
        Metadata
        ----------------------------------
        */

        tender.metadata = {

            page:

                context.page ??

                rawTender.page ??

                1,

            tableIndex:

                context.tableIndex ??

                rawTender._tableIndex ??

                rawTender.tableIndex ??

                null,

            rowIndex:

                context.rowIndex ??

                rawTender._rowIndex ??

                rawTender.rowIndex ??

                null,

            headers:

                context.headers ??

                rawTender._headers ??

                [],

            scrapedAt:

                context.scrapedAt ??

                rawTender.scrapedAt ??

                new Date().toISOString(),

            extractedAt:

                context.extractedAt ??

                rawTender.extractedAt ??

                new Date().toISOString(),

            scraperVersion:

                "1.0.0"

        };

        /*
        ----------------------------------
        Compatibility
        ----------------------------------
        */

        tender.extractedAt =
            tender.metadata.extractedAt;

        tender.status =

            rawTender.status ??

            "active";

        return TenderNormalizer.normalize(
            tender
        );

    }

}

export default TenderMapper;