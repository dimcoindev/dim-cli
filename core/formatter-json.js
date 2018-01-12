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
class FormatterJSON extends Formatter {

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
        this.extension = "json";

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
        this.rows  = JSON.parse(content);

        return this;
    }

    /**
     * This method will save the data to an Excel workbook.
     *
     * @param {String} filePath     Absolute file path with file name.
     * @return {Formatter}
     */
    __toFile(filePath) {
        let json = JSON.stringify(this.rows);
        fs.writeFileSync(filePath, json);

        return this;
    }

}

exports.FormatterJSON = FormatterJSON;
export default FormatterJSON;
