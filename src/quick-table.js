import XLSX from "xlsx";
import fs from "fs";


const data =
JSON.parse(
fs.readFileSync(
"table-json.json",
"utf8"
));


const rows=data[0].rows;


const sheet =
XLSX.utils.aoa_to_sheet(rows);


const workbook =
XLSX.utils.book_new();


XLSX.utils.book_append_sheet(
workbook,
sheet,
"Tenders"
);


XLSX.writeFile(
workbook,
"Punjab_Tenders.xlsx"
);


console.log("Excel Created");