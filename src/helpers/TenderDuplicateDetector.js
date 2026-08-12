class TenderDuplicateDetector {

    /**
     * Remove duplicate tenders using hash
     * @param {Array} tenders
     * @returns {Object}
     */
    static removeDuplicates(tenders = []) {

        const uniqueTenders = [];

        const duplicateTenders = [];

        const hashes = new Set();

        for (const tender of tenders) {

            if (!tender.hash) {

                duplicateTenders.push({

                    tender,

                    reason: "Missing tender hash."

                });

                continue;

            }

            if (hashes.has(tender.hash)) {

                duplicateTenders.push({

                    tender,

                    reason: "Duplicate hash."

                });

                continue;

            }

            hashes.add(tender.hash);

            uniqueTenders.push(tender);

        }

        return {

            success: true,

            total: tenders.length,

            unique: uniqueTenders.length,

            duplicates: duplicateTenders.length,

            tenders: uniqueTenders,

            duplicateTenders

        };

    }

    /**
     * Check if tender already exists
     * @param {String} hash
     * @param {Set} existingHashes
     * @returns {Boolean}
     */
    static exists(hash, existingHashes = new Set()) {

        return existingHashes.has(hash);

    }

}

export default TenderDuplicateDetector;