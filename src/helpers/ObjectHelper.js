class ObjectHelper {

    static pick(object = {}, keys = []) {

        const result = {};

        keys.forEach(key => {

            if (key in object) {

                result[key] = object[key];

            }

        });

        return result;

    }


    static omit(object = {}, keys = []) {

        const result = {};

        Object.keys(object).forEach(key => {

            if (!keys.includes(key)) {

                result[key] = object[key];

            }

        });

        return result;

    }


    static flatten(object = {}, prefix = "", result = {}) {

        Object.keys(object).forEach(key => {

            const value = object[key];

            const newKey =
                prefix
                    ? `${prefix}.${key}`
                    : key;


            if (

                value &&
                typeof value === "object" &&
                !Array.isArray(value)

            ) {

                this.flatten(
                    value,
                    newKey,
                    result
                );

            } else {

                result[newKey] = value;

            }

        });

        return result;

    }


    static mergeDeep(target = {}, source = {}) {

        for (const key of Object.keys(source)) {

            if (

                source[key] &&
                typeof source[key] === "object" &&
                !Array.isArray(source[key])

            ) {

                if (!target[key]) {

                    target[key] = {};

                }

                this.mergeDeep(
                    target[key],
                    source[key]
                );

            } else {

                target[key] = source[key];

            }

        }

        return target;

    }

}

export default ObjectHelper;