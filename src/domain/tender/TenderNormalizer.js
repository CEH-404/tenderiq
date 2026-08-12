import TenderStatus from "./TenderStatus.js";


class TenderNormalizer {


    static normalize(tender = {}) {


        const normalized = {


            ...tender,


            title:
                this.normalizeText(
                    tender.title
                ),


            organization:
                this.normalizeText(
                    tender.organization
                ),


            department:
                this.normalizeText(
                    tender.department
                ),


            procurementMethod:
                this.normalizeText(
                    tender.procurementMethod
                ),


            procurementType:
                this.normalizeText(
                    tender.procurementType
                ),


            category:
                this.normalizeText(
                    tender.category
                ),


            city:
                this.normalizeText(
                    tender.city
                ),


            province:
                this.normalizeText(
                    tender.province
                ),


            description:
                this.normalizeText(
                    tender.description
                ),



            publishedDate:
                this.normalizeDate(
                    tender.publishedDate
                ),



            closingDate:
                this.normalizeDate(
                    tender.closingDate
                ),



            openingDate:
                this.normalizeDate(
                    tender.openingDate
                ),



            extractedAt:
                this.normalizeDate(
                    tender.extractedAt
                ),



            status:
                this.normalizeStatus(
                    tender.status
                ),



            source:
                this.normalizeSource(
                    tender.source
                ),



            location:
                this.normalizeLocation(
                    tender.location
                ),



            contact:
                this.normalizeContact(
                    tender.contact
                ),



            documents:
                this.normalizeDocuments(
                    tender.documents
                )

        };



        normalized.fingerprint =
            this.generateFingerprint(
                normalized
            );



        return normalized;


    }





    static normalizeText(value) {


        if (!value) {

            return "";

        }


        return String(value)
            .replace(/\s+/g, " ")
            .trim();


    }







    static normalizeDate(value) {


        if (!value) {

            return null;

        }



        if (value instanceof Date) {

            return value.toISOString();

        }



        const cleaned =
            String(value)
                .replace(
                    /(\d{2})-(\w{3})-(\d{4})/,
                    "$2 $1 $3"
                );



        const date =
            new Date(cleaned);



        if (
            isNaN(
                date.getTime()
            )
        ) {

            return null;

        }



        return date.toISOString();


    }








    static normalizeStatus(status) {


        if (!status) {

            return TenderStatus.UNKNOWN;

        }



        const normalized =

            String(status)
                .trim()
                .toUpperCase();



        if (

            Object.values(
                TenderStatus
            )
            .includes(
                normalized
            )

        ) {

            return normalized;

        }



        return TenderStatus.UNKNOWN;


    }







    static normalizeSource(source = {}) {


        return {


            portal:
                this.normalizeText(
                    source.portal
                ),


            url:
                this.normalizeText(
                    source.url
                ),


            extractedPage:
                this.normalizeText(
                    source.extractedPage
                )


        };


    }







    static normalizeLocation(location = {}) {


        return {


            address:
                this.normalizeText(
                    location.address
                ),


            city:
                this.normalizeText(
                    location.city
                ),


            province:
                this.normalizeText(
                    location.province
                ),


            country:
                location.country ||
                "Pakistan"


        };


    }







    static normalizeContact(contact = {}) {


        return {


            name:
                this.normalizeText(
                    contact.name
                ),


            email:
                this.normalizeText(
                    contact.email
                ),


            phone:
                this.normalizeText(
                    contact.phone
                )


        };


    }







    static normalizeDocuments(documents) {


        if (
            !Array.isArray(documents)
        ) {

            return [];

        }



        return documents.map(
            document => {


                if (
                    typeof document === "string"
                ) {


                    return {

                        url: document,

                        name: ""

                    };


                }



                return {


                    url:
                        document.url ||
                        "",


                    name:
                        document.name ||
                        ""


                };


            }

        );


    }







    static generateFingerprint(tender) {


        const value =


            [

                tender.reference?.tenderNo,


                tender.title,


                tender.organization,


                tender.closingDate


            ]

            .filter(Boolean)

            .join("|")

            .toLowerCase();




        return Buffer
            .from(value)
            .toString("base64");

    }


}


export default TenderNormalizer;