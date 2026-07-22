import fs from "fs";
import path from "path";

class FileTransport{

    constructor(){

        this.logDirectory = "./logs";

        if(!fs.existsSync(this.logDirectory)){
            fs.mkdirSync(this.logDirectory,{recursive:true});
        }

    }

    write(level,message){

        const filePath = path.join(this.logDirectory,"application.log");

        const line = `${message}\n`;

        fs.appendFileSync(filePath,line);

    }

}

export default FileTransport;