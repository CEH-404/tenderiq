class CollectionHelper {

    static unique(items = [], key = null) {

        if (!key) {

            return [...new Set(items)];

        }

        const seen = new Set();

        return items.filter(item => {

            const value = item[key];

            if (seen.has(value)) {

                return false;

            }

            seen.add(value);

            return true;

        });

    }

    static groupBy(items = [], key) {

        return items.reduce((groups, item) => {

            const value = item[key] ?? "unknown";

            if (!groups[value]) {

                groups[value] = [];

            }

            groups[value].push(item);

            return groups;

        }, {});

    }

    static sort(items = [], key, order = "asc") {

        return [...items].sort((a, b) => {

            if (a[key] === b[key]) {

                return 0;

            }

            if (order === "desc") {

                return a[key] < b[key] ? 1 : -1;

            }

            return a[key] > b[key] ? 1 : -1;

        });

    }

    static chunk(items = [], size = 100) {

        const chunks = [];

        for (let i = 0; i < items.length; i += size) {

            chunks.push(

                items.slice(i, i + size)

            );

        }

        return chunks;

    }

}

export default CollectionHelper;