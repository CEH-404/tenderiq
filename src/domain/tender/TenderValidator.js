import TenderStatus from "./TenderStatus.js";


class TenderValidator {


    static validate(tender = {}) {


        const errors = [];



        /*
        ----------------------------------
        Basic Information
        ----------------------------------
        */


        if (
            !tender.title ||
            typeof tender.title !== "string"
        ) {

            errors.push(
                "Tender title is required."
            );

        }



        if (
            !tender.organization ||
            typeof tender.organization !== "string"
        ) {

            errors.push(
                "Organization is required."
            );

        }





        /*
        ----------------------------------
        Source Validation
        ----------------------------------
        */


        if (
            !tender.source?.portal
        ) {

            errors.push(
                "Source portal is required."
            );

        }



        if (
            !tender.source?.url
        ) {

            errors.push(
                "Source URL is required."
            );

        }





        /*
        ----------------------------------
        Reference Validation
        ----------------------------------
        */


        if (
            !tender.reference?.tenderNo
        ) {

            errors.push(
                "Tender number is required."
            );

        }





        /*
        ----------------------------------
        Date Validation
        ----------------------------------
        */


        if (
            !tender.publishedDate
        ) {

            errors.push(
                "Published date is required."
            );

        }



        if (
            !tender.closingDate
        ) {

            errors.push(
                "Closing date is required."
            );

        }




        /*
        ----------------------------------
        Optional Field Validation
        ----------------------------------
        */


        if (
            tender.title &&
            typeof tender.title !== "string"
        ) {

            errors.push(
                "Tender title must be a string."
            );

        }



        if (
            tender.organization &&
            typeof tender.organization !== "string"
        ) {

            errors.push(
                "Organization must be a string."
            );

        }





        /*
        ----------------------------------
        Source URL Validation
        ----------------------------------
        */


        if (
            tender.source?.url
        ) {


            try {

                new URL(
                    tender.source.url
                );


            }

            catch {

                errors.push(
                    "Invalid source URL."
                );

            }


        }





        /*
        ----------------------------------
        Documents Validation
        ----------------------------------
        */


        if (
            tender.documents &&
            !Array.isArray(
                tender.documents
            )
        ) {

            errors.push(
                "Documents must be an array."
            );

        }





        /*
        ----------------------------------
        Status Validation
        ----------------------------------
        */


        if (
            tender.status &&
            !Object.values(
                TenderStatus
            )
            .includes(
                tender.status
            )
        ) {


            errors.push(
                `Invalid tender status: ${tender.status}`
            );


        }





        return {


            valid:
                errors.length === 0,


            errors


        };


    }


}


export default TenderValidator;