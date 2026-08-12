class LoggerHelper {

    static info(message) {

        console.log(
            `[INFO] ${message}`
        );

    }

    static success(message) {

        console.log(
            `[SUCCESS] ${message}`
        );

    }

    static warning(message) {

        console.warn(
            `[WARNING] ${message}`
        );

    }

    static error(message, error = null) {

        console.error(
            `[ERROR] ${message}`
        );

        if (error) {

            console.error(error);

        }

    }

    static separator() {

        console.log(

            "----------------------------------------"

        );

    }

    static title(text) {

        this.separator();

        console.log(text);

        this.separator();

    }

}

export default LoggerHelper;