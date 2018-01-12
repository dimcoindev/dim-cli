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
import * as fs from "fs";

/**
 * The Formatter class will provide with different data
 * formatting techniques such as XLSX, JSON and CSV as 
 * a first.
 */
class FormatterCSV extends Formatter {

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
        this.extension = "csv";

        /**
         * The excel worksheet name
         *
         * @var {string}
         */
        this.sheetName = "dimtoken-holders-" + utc;
    }

    /**
     * This method will read the data from an Excel workbook.
     *
     * @param {String} filePath     Absolute file path with file name.
     * @return {Formatter}
     */
    __fromFile(filePath) {
        let content = fs.readFileSync(filePath);
        let parsed  = content.split("\r\n");

        let head = parsed.shift().split(",");
        for (let i = 0; i < parsed.length; i++) {
            let o = base;
            let v = parsed.split(",");

            // rebuild Key:Value precision
            for (k = 0; k < head.length; k++)
                o[head[k]] = v[k];

            this.rows.push(o);
        }

        return this;
    }

    /**
     * This method will save the data to an Excel workbook.
     *
     * @param {String} filePath     Absolute file path with file name.
     * @return {Formatter}
     */
    __toFile(filePath) {

        let head = "";
        let csv = "";
        this.rows.forEach(function(rowArray) {
            // if rowArray is an object, we must get only
            // the values and lose key precision for CSV.

            let data = rowArray;
            if (typeof rowArray == "object") {
                data = [];
                head = Object.keys(rowArray);
                // flatten to only values.
                for (let k = 0; k < head.length; k++)
                    data.push(rowArray[head[k]]);
            }

            let row = data.join(",");
            csv += row + "\r\n"; // add carriage return
        });

        fs.writeFileSync(filePath, csv);
        return this;
    }

}

exports.FormatterCSV = FormatterCSV;
export default FormatterCSV;
