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
         * Object containing table by names
         * 
         * @var {Object}
         */
        this.tables = {};
    }

    /**
     * Instance creator
     * 
     * @return {DIMSchema}
     */
    static getInstance() {
        if (! this[instance_])
            this[instance_] = new DIMSchema(instance_);

        return this[instance_];
    }

    getTable(table) {
        if (! this.tables[table])
            return false;

        return this.tables[table];
    }

    getTables() {
        return this.tables;
    }

    /**
     * Initialize the ORM tables.
     * 
     * @return {DIMSchema}
     */
    async initTables() {

        try {
            let conn = await this.storage.connect();
        }
        catch (e) {
            throw new Error("Impossible to open connection to MongoDB: " + e);
        }

        /**
         * MongoDb collection `DIMTokenHolders`
         */
        let tokenHolderSchema = new this.adapter.Schema({
            address: String,
            tokenAmount: { type: Number, min: 0 },
            holderPercentage: { type: Number, min: 0 },
            holderImportance: { type: Number, min: 0 },
            createdAt: { type: Number, min: 0 },
            updatedAt: { type: Number, min: 0 }
        });
        this.tables["TokenHolder"] = this.adapter.model("DIMTokenHolder", tokenHolderSchema);

        /**
         * MongoDb collection `DIMTransactions`
         */
        let transactionSchema = new this.adapter.Schema({
            nemId: { type: Number, min: 0 },
            nemHash: String,
            nemObject: { type: Object },
            dimCurrencies: { type: Object },
            createdAt: { type: Number, min: 0 }
        });
        this.tables["Transaction"] = this.adapter.model("DIMTransaction", transactionSchema);

        /**
         * MongoDb collection `DIMWallet`
         */
        let walletSchema = new this.adapter.Schema({
            address: String,
            dimCurrencies: { type: Object },
            otherCurrencies: { type: Object },
            dimHolderAt: { type: Number, min: 0 },
            createdAt: { type: Number, min: 0 },
            updatedAt: { type: Number, min: 0 }
        });
        this.tables["Wallet"] = this.adapter.model("DIMWallet", walletSchema);

        /**
         * MongoDb collection `DIMTokenHolders`
         */
        let mosaicHolderSchema = new this.adapter.Schema({
            address: String,
            tokenAmount: { type: Number, min: 0 },
            currency: String,
            holderPercentage: { type: Number, min: 0 },
            holderImportance: { type: Number, min: 0 },
            createdAt: { type: Number, min: 0 },
            updatedAt: { type: Number, min: 0 }
        });
        this.tables["MosaicHolder"] = this.adapter.model("DIMMosaicHolder", mosaicHolderSchema);

        return this;
    }
}

exports.DIMSchema = DIMSchema;
export default DIMSchema;
