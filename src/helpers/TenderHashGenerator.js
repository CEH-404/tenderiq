import crypto from "crypto";

class TenderHashGenerator {

    static generate(tender = {}) {

        const payload = [

            tender.source?.portal || "",

            tender.reference?.tenderNo || "",

            tender.title || "",

            tender.organization || "",

            tender.publishedDate || "",

            tender.closingDate || ""

        ].join("|");

        return crypto
            .createHash("sha256")
            .update(payload)
            .digest("hex");

    }

    static assign(tender = {}) {

        return {

            ...tender,

            hash: this.generate(tender)

        };

    }

    static assignMany(tenders = []) {

        return tenders.map(tender =>
            this.assign(tender)
        );

    }

}

export default TenderHashGenerator;