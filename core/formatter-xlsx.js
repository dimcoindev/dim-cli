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
 * @link       https://github.com/dimcoin/dim-cli
 */
"use strict";

import Formatter from "./formatter";
import * as Excel from "xlsx";

/**
 * The Formatter class will provide with different data
 * formatting techniques such as XLSX, JSON and CSV as 
 * a first.
 */
class FormatterXLSX extends Formatter {

    /**
     * Construct the Formatter object
     */
    constructor() {
        super();

        let utc = new Date().toJSON().slice(0,10).replace(/-/g, ''); // 2018-01-11 to 20180111

        /**
         * The default filename extension.
         *
         * @var {String}
         */
        this.extension = "xlsx";

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
         * The Excel worksheet
         *
         * @var {object}
         */
        this.worksheet = undefined;
    }

    /**
     * This method will read the data from an Excel workbook.
     *
     * @param {String} filePath     Absolute file path with file name.
     * @return {Formatter}
     */
    __fromFile(filePath) {
        this.workbook  = Excel.readFile(filePath);
        this.worksheet = this.workbook.Sheets[this.workbook.SheetNames[0]];
        this.rows      = Excel.utils.sheet_to_json(this.worksheet);

        return this;
    }

    /**
     * This method will save the data to an Excel workbook.
     *
     * @param {String} filePath     Absolute file path with file name.
     * @return {Formatter}
     */
    __toFile(filePath) {
        var sheet = Excel.utils.json_to_sheet(this.rows);

        this.workbook.SheetNames.push(this.sheetName);
        this.workbook.Sheets[wsName[sheetVar]] = sheet;

        Excel.writeFile(this.workbook, filePath);
        return this;
    }

}

exports.FormatterXLSX = FormatterXLSX;
export default FormatterXLSX;
