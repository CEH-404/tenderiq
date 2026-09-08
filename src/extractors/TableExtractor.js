import logger from "../logger/Logger.js";

class TableExtractor {

    constructor(pageManager) {

        if (!pageManager) {

            throw new Error(
                "PageManager instance is required."
            );

        }

        this.pageManager = pageManager;

    }


    async extract(pageId) {

        logger.info(
            "Extracting table data..."
        );


        const page =
            this.pageManager.get(pageId);


        if (!page) {

            throw new Error(
                `Page not found: ${pageId}`
            );

        }


        try {

            const result =
                await page.evaluate(() => {


                    const normalize = (value) => {

                        return (value || "")
                            .replace(/\s+/g, " ")
                            .trim();

                    };


                    const isHidden = (element) => {

                        const style =
                            window.getComputedStyle(
                                element
                            );


                        return (

                            style.display === "none" ||

                            style.visibility === "hidden" ||

                            element.classList.contains(
                                "hidden"
                            )

                        );

                    };


const extractHeaders = (table) => {

    let headers = [];


    /*
    ---------------------------------
    Try thead first
    ---------------------------------
    */

    const headerCells =
        table.querySelectorAll(
            "thead th, thead td"
        );


    headerCells.forEach(cell => {

        if (!isHidden(cell)) {

            const text =
                normalize(
                    cell.innerText
                );

            if (text) {

                headers.push(text);

            }

        }

    });



    /*
    ---------------------------------
    Find real header row
    when thead missing
    ---------------------------------
    */

    if (!headers.length) {


        const rows =
            [
                ...table.querySelectorAll("tr")
            ];


        for (const row of rows) {


            const cells =
                [
                    ...row.querySelectorAll(
                        "th,td"
                    )
                ]
                .filter(
                    cell =>
                        !isHidden(cell)
                );


            const values =
                cells
                .map(
                    cell =>
                        normalize(
                            cell.innerText
                        )
                )
                .filter(Boolean);



            /*
            Ignore empty rows
            Ignore pagination rows
            Ignore select rows
            */

            const isPagination =
                values.join(" ")
                .match(
                    /page|select|size|items/i
                );


            if (
                values.length >= 3 &&
                !isPagination
            ) {

                headers = values;

                break;

            }


        }

    }



    /*
    ---------------------------------
    Cleanup
    ---------------------------------
    */

    return headers.map(
        (header,index)=>

            header ||
            `Column_${index+1}`

    );

};



                    const extractRows = (
                        table,
                        headers,
                        tableIndex
                    ) => {


                        const rows = [];

                        const occupied = {};


                        const tableRows =
                            [
                                ...table.querySelectorAll(
                                    "tr"
                                )
                            ];


                        let dataRowIndex = 0;


                        tableRows.forEach(
                            (tr, rowIndex) => {


                                const cells =
                                    [
                                        ...tr.querySelectorAll(
                                            "td,th"
                                        )
                                    ];


                                if (!cells.length)
                                    return;


                                const row = {};


                                let columnIndex = 0;


                                cells.forEach(cell => {


                                    if (
                                        isHidden(cell)
                                    )
                                        return;


                                    while (
                                        occupied[
                                            `${rowIndex}_${columnIndex}`
                                        ]
                                    ) {

                                        columnIndex++;

                                    }


                                    const value =
                                        normalize(
                                            cell.innerText
                                        );


                                    const colspan =
                                        parseInt(
                                            cell.getAttribute(
                                                "colspan"
                                            )
                                        ) || 1;


                                    const rowspan =
                                        parseInt(
                                            cell.getAttribute(
                                                "rowspan"
                                            )
                                        ) || 1;


                                    for (
                                        let c = 0;
                                        c < colspan;
                                        c++
                                    ) {


                                        const key =
                                            headers[
                                                columnIndex + c
                                            ] ||

                                            `Column_${columnIndex + c + 1}`;


                                        row[key] =
                                            value;


                                        for (
                                            let r = 1;
                                            r < rowspan;
                                            r++
                                        ) {


                                            occupied[
                                                `${rowIndex + r}_${columnIndex + c}`
                                            ] =
                                                value;


                                        }


                                    }


                                    columnIndex += colspan;


                                });


                                Object.keys(
                                    row
                                ).forEach(key => {


                                    if (
                                        row[key] === ""
                                    ) {

                                        delete row[key];

                                    }


                                });


                                if (
                                    Object.keys(row)
                                        .length
                                ) {

                                    dataRowIndex++;

                                    rows.push({

                                        ...row,

                                        _tableIndex:
                                            tableIndex,

                                        _rowIndex:
                                            dataRowIndex,

                                        _headers:
                                            [...headers]

                                    });

                                }


                            }

                        );


                        return rows;

                    };



                    const tables = [];



                    document
                        .querySelectorAll(
                            "table"
                        )
                        .forEach(
                            (
                                table,
                                index
                            ) => {


                                const tableIndex =
                                    index + 1;


const headers =
                                    extractHeaders(
                                        table
                                    );


                                const rows =
                                    extractRows(
                                        table,
                                        headers,
                                        tableIndex
                                    );



                                if (
                                    rows.length
                                ) {

                                    tables.push({

                                        tableIndex,

                                        headers,

                                        totalRows:
                                            rows.length,

                                        totalColumns:
                                            headers.length,

                                        rows

                                    });

                                }


                            }

                        );



                    return {

                        totalTables:
                            tables.length,

                        tables

                    };


                });



            logger.success(

                `${result.totalTables} table(s) extracted.`

            );


            return result;


        }

        catch (error) {


            logger.error(

                `Table extraction failed: ${error.message}`

            );


            throw error;


        }

    }


}
export default TableExtractor;