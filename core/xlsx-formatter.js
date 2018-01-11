/**
 * Part of the dimcoin/dim-cli package.
 *
 * NOTICE OF LICENSE
 *
 * Licensed under MIT License.
 *
 * This source file is subject to the MIT License that is
 * bundled with this package in the LICENSE file.
 *
 * @package    dimcoin/dim-cli
 * @author     DIMCoin Developers
 * @license    MIT License
 * @copyright  (c) 2018, DIMCoin Developers
 * @link       https://bitbucket.org/dimcoin/dim-cli
 */
"use strict";

import * as Excel from "xlsx";

/**
 * The Formatter class will provide with different data
 * formatting techniques such as XLSX, JSON and CSV as 
 * a first.
 */
class XLSXFormatter {

    /**
     * Construct the Formatter object
     */
    constructor() {

        let utc = new Date().toJSON().slice(0,10).replace(/-/g, ''); // 2018-01-11 to 20180111

        /**
         * The produced absolute file path
         *
         * @var {string}
         */
        this.filepath = "";

        /**
         * The excel worksheet name
         *
         * @var {string}
         */
        this.sheetName = "dimtoken-holders-" + utc;

        /**
         * The error excel sheet name
         *
         * @var {string}
         */
        this.errorSheetName = "error";

        /**
         * The Excel workbook
         *
         * @var {object}
         */
        this.workbook = undefined;

        /**
         * The rows array
         *
         * @var {Array}
         */
        this.rows = [];
    }

    init(filepath) {
        this.filepath = filepath;
        this.workbook = { SheetNames: [], Sheets: {} };
        if (fs.existsSync(this.filepath)) {
            // read already available workbook.
            this.workbook = Excel.readFile(this.filepath);
            this.rows     = Excel.utils.sheet_to_json(ws);
        }

        return this;
    }

    write(data) {
        this.rows.push(data);
        return this;
    }

    save() {
        var sheet = Excel.utils.json_to_sheet(this.rows);

        this.workbook.SheetNames.push(this.sheetName);
        this.workbook.Sheets[wsName[sheetVar]] = sheet;

        Excel.writeFile(this.workbook, this.filepath);
        return this.filepath;
    }

}

exports.XLSXFormatter = XLSXFormatter;
export default XLSXFormatter;
