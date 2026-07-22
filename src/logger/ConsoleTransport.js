import colors from "@colors/colors";

colors.enable();

class ConsoleTransport {

    info(message){
        console.log(colors.cyan(message));
    }

    success(message){
        console.log(colors.green(message));
    }

    warning(message){
        console.log(colors.yellow(message));
    }

    error(message){
        console.log(colors.red(message));
    }

    debug(message){
        console.log(colors.gray(message));
    }

}

export default ConsoleTransport;