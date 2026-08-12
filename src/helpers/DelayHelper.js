class DelayHelper {

    static async wait(milliseconds = 1000) {

        return new Promise(resolve => {

            setTimeout(resolve, milliseconds);

        });

    }

    static async random(min = 500, max = 1500) {

        const delay =

            Math.floor(

                Math.random() * (max - min + 1)

            ) + min;

        return this.wait(delay);

    }

}

export default DelayHelper;