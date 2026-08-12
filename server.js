import express from "express";
import cors from "cors";

import scraperRoutes
from "./routes/scraper.routes.js";


const app = express();


app.use(
    cors()
);


app.use(
    express.json()
);


app.use(
    express.static("public")
);


app.use(
    "/api/scraper",
    scraperRoutes
);



app.listen(
    3000,
    // Temp add 
    "0.0.0.0",
    // End temp add
    ()=>{

        console.log(
            "Server running on port 3000"
        );

    }
);