import ConsoleTransport from "./ConsoleTransport.js";
import FileTransport from "./FileTransport.js";

class Logger{

    constructor(){

        this.console = new ConsoleTransport();

        this.file = new FileTransport();

    }

    timestamp(){

        return new Date().toISOString();

    }

    format(level,message){

        return `[${this.timestamp()}] [${level}] ${message}`;

    }

    info(message){

        const log=this.format("INFO",message);

        this.console.info(log);

        this.file.write("INFO",log);

    }

    success(message){

        const log=this.format("SUCCESS",message);

        this.console.success(log);

        this.file.write("SUCCESS",log);

    }

    warning(message){

        const log=this.format("WARNING",message);

        this.console.warning(log);

        this.file.write("WARNING",log);

    }

    error(message){

        const log=this.format("ERROR",message);

        this.console.error(log);

        this.file.write("ERROR",log);

    }

    debug(message){

        const log=this.format("DEBUG",message);

        this.console.debug(log);

        this.file.write("DEBUG",log);

    }

}

const logger = new Logger();

export default logger;