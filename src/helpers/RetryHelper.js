class RetryHelper {

    static async execute(task, options = {}) {

        const retries =
            options.retries ?? 3;

        const delay =
            options.delay ?? 1000;

        let lastError;

        for (let attempt = 1; attempt <= retries; attempt++) {

            try {

                return await task();

            }

            catch (error) {

                lastError = error;

                if (attempt === retries) {

                    throw error;

                }

                await new Promise(resolve =>
                    setTimeout(
                        resolve,
                        delay * attempt
                    )
                );

            }

        }

        throw lastError;

    }

}

export default RetryHelper;