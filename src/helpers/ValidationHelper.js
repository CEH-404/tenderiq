class ValidationHelper {

    static isURL(value) {

        try {

            new URL(value);

            return true;

        }

        catch {

            return false;

        }

    }

    static isEmail(value = "") {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/

            .test(value);

    }

    static isPhone(value = "") {

        return /^\+?[0-9\s\-()]{7,20}$/

            .test(value);

    }

    static isEmpty(value) {

        return (

            value === undefined ||

            value === null ||

            value === ""

        );

    }

    static isArray(value) {

        return Array.isArray(value);

    }

    static isObject(value) {

        return (

            value !== null &&

            typeof value === "object" &&

            !Array.isArray(value)

        );

    }

    static hasValue(value) {

        return !this.isEmpty(value);

    }

}

export default ValidationHelper;