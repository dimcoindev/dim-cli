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

import DIMDatabaseCache from "./dim-dbcache";

let instance_ = Symbol();

class DIMSchema {

    /**
     * Configure the DIM Schema
     */
    constructor(token) {
        if (instance_ !== token)
            throw new Error("DIMSchema cannot be instanciated multiple times.");

        /**
         * The DIM Database Cache adapter
         * 
         * This will also start the MongoDB connection.
         * 
         * @see {DIMDatabaseCache}
         * @var {DIMDatabaseCache}
         */
        this.storage = new DIMDatabaseCache();

        /**
         * The mongoose Builder for the current DIM model instance.
         * 
         * @var {mongoose}
         */
        this.adapter = this.storage.getDb();

        /**
         * Initialize the DIM ORM Tables.
         * 
         * @return {DIMSchema}
         */
        this.initTables();
    }

    /**
     * Instance creator
     * 
     * @return {DIMSchema}
     */
    static get instance() {
        if (! this[instance_])
            this[instance_] = new DIMSchema(instance_);

        return this[instance_];
    }

    /**
     * Initialize the ORM tables.
     * 
     * @return {DIMSchema}
     */
    initTables() {
        /**
         * MongoDb collection `DIMTokenHolders`
         */
        let tokenHolderSchema = new this.adapter.Schema({
            address: String,
            tokenAmount: { type: Number, min: 0 },
            createdAt: { type: Number, min: 0 },
            updatedAt: { type: Number, min: 0 }
        });
        this.TokenHolder = this.adapter.model("DIMTokenHolder", tokenHolderSchema);

        /**
         * MongoDb collection `DIMTransactions`
         */
        let transactionSchema = new this.adapter.Schema({
            nemId: { type: Number, min: 0 },
            nemHash: String,
            dimCurrencies: { type: Array },
            createdAt: { type: Number, min: 0 }
        });
        this.Transaction = this.adapter.model("DIMTransaction", transactionSchema);

        /**
         * MongoDb collection `DIMWallet`
         */
        let walletSchema = new this.adapter.Schema({
            address: String,
            dimCurrencies: { type: Array },
            dimHolderAt: { type: Number, min: 0 },
            createdAt: { type: Number, min: 0 },
            updatedAt: { type: Number, min: 0 }
        });
        this.Wallet = this.adapter.model("DIMWallet", walletSchema);

        return this;
    }
}

exports.DIMSchema = DIMSchema;
export default DIMSchema;
