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

/**
 * Helper to extract only the Addresses out of an
 * account list.
 * 
 * @param {Array} that
 * @param {String} field
 */
let flattenArray = function(that, field) {
    let result = {};
    if (that && that.length) {
        for (let i = 0; i < that.length; i++) {
            let obj = that[i];
            result[obj[field]] = obj;
        }
    }

    return result;
}

export default {
    flattenArray
};
