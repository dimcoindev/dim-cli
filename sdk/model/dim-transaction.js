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

import DIMModel from "./base";
import NEM from "nem-sdk";

class DIMTransaction extends DIMModel {

    /**
     * Configure this model instance.
     */
    constructor(data) {
        super(data);

        /**
         * The relation's table name
         * 
         * @var {String}
         */
        this.tableName = "Transaction";

        /**
         * The mongoose Model.
         *
         * @var {mongoose.model}
         */
        this.model = this.schema.getTable(this.tableName);
    }

    /**
     * Helper method to find a given currency by its slug in a given
     * transaction.
     *
     * @param {String} currency 
     * @return {false|Integer}
     */
    hasCurrency(currency) {
        if (! this.dimCurrencies || ! this.dimCurrencies.length)
            return false;

        for (let i = 0; i < this.dimCurrencies.length; i++)
            if (currency === NEM.utils.format.mosaicIdToName(this.dimCurrencies[i].mosaicId))
                return i;

        return false;
    }

    /**
     * Helper method to read the amount of a transaction in a specific
     * currency if any given. If the currency given can not be found in
     * the transaction, 0 will be returned instead.
     * 
     * @param {String} currency 
     * @return {Integer}    Always a MICRO Amount!
     */
    getAmount(currency) {
        if (false === (pos = this.hasCurrency(currency)))
            return 0;

        return parseInt(this.dimCurrencies[pos].quantity);
    }
}

exports.DIMTransaction = DIMTransaction;
export default DIMTransaction;
