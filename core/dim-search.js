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

import DIMParameters from "./dim-parameters";
import NEM from "nem-sdk";
import DIM from "../sdk/index.js";

class DIMSearch {

    /**
     * Construct the Formatter object
     */
    constructor(NIS) {
        /**
         * The DIM Ecosystem Parameters.
         *
         * @var {DIMParameters}
         */
        this.parameters = new DIMParameters();

        /**
         * The NIS API Wrapper instance.
         *
         * @var {Object}
         */
        this.api = NIS;
    }

    /**
    /**
     * This helper method lets you lookup the NEM Blockchain for either of those:
     *
     * - A Wallet Address
     * - A Wallet Public Key
     * - A Transaction Hash
     *
     * @param {*} term 
     */
    async searchByTerm(term) {
        if (typeof term == undefined) {
            throw new Error("Missing mandatory 'term' parameter in call to DIMExplorer.searchByTerm().");
        }

        // Search Term - Type Discovery

        let results = null;
        if (/^[a-f0-9]{64}$/.test(term.toString())) {
            // Hexadecimal Transaction Hash provided (or Wallet Public Key)
            results = await this.searchTransaction(term.toString());

            if (results !== null) {
                // found a transaction with given hash
                return results;
            }
            else if (this.api.SDK.utils.helpers.isPublicKeyValid(term.toString())) {
                // Hexadecimal Wallet Public Key provided
                let address = this.api.SDK.model.address.toAddress(term.toString(), this.api.networkId);
                return await this.searchWallet(address);
            }
        }
        else if (this.api.SDK.model.address.isValid(term.toString())) {
            // BASE32 Wallet Address provided
            return await this.searchWallet(term.toString());
        }

        throw new Error("Search term '" + term.toString() + "' is not a valid Wallet (Address/Public Key) or Transaction (Hash) identifier.");
    }

    /**
     * This helper method will look for a given transaction in the 
     * DIM Ecosystem. Transactions are searched for by *hash*.
     * 
     * @param {String} hash 
     * @return {DIMTransaction}
     */
    async searchTransaction(hash) {
        if (typeof hash == undefined) {
            throw new Error("Missing mandatory 'hash' parameter in call to DIMExplorer.searchTransaction().");
        }
        else if (! /[a-f0-9]{64}/.test(hash.toString())) {
            throw new Error("Invalid 'hash' parameters size. Should be 32 bytes (64 characters in hexadecimal)");
        }

        let tx = new DIM.Transaction({});
        tx = await tx.findByField("nemHash", hash.toString());

        // query for transaction, then cache.
        let nemTx = await this.api.SDK.com.requests
                                  .transaction.byHash(this.api.node, hash.toString());

        if (! nemTx || ! nemTx.meta || ! nemTx.transaction) {
            // transaction not found
            return null;
        }

        tx = new DIM.Transaction({
            nemId: nemTx.meta.id,
            nemHash: nemTx.meta.hash.data,
            nemObject: nemTx,
            createdAt: (new Date).valueOf()
        });

        // read potential dim currencies
        tx.setAttribute("dimCurrencies", this.extractDimCurrencies(nemTx));

        // cache in database
        tx = await tx.save();
        return this.formatTransactionForOutput(tx);
    }

    /**
     * Helper to transform a transaction database object such that only
     * network data is printed out and no database specific fields.
     * 
     * @param {DIM.Transaction} tx 
     */
    formatTransactionForOutput(tx) {
        return {
            "nemId": tx.nemId,
            "nemHash": tx.nemHash,
            "nemTransaction": tx.nemObject,
            "dimCurrencies": tx.dimCurrencies
        };
    }

    /**
     * This helper method retrieves potential dim currencies present
     * in a NEM blockchain transaction.
     * 
     * @param {Object} transaction 
     * @return {Object}
     */
    extractDimCurrencies(transaction) {
        if (! transaction.meta || ! transaction.transaction) {
            throw new Error("Invalid TransactionMetaDataPair paramater in call to DIMSearch.extractDimCurrencies().");
        }

        let meta = transaction.meta;
        let content = transaction.transaction;
        let data = content.type === 4100 ? content.otherTrans : content;

        if (data.type !== 257 || ! data.mosaics || ! data.mosaics.length) { // mosaic transfer only
            return {};
        }

        // iterate through transaction mosaics to find any dim:* mosaics.
        let currencies = {};
        for (let i = 0, m = data.mosaics.length; i < m; i++) {
            let mosaic = data.mosaics[i];
            let name = this.api.SDK.utils.format.mosaicIdToName(mosaic.mosaicId);
            if (! /^dim:(.*)+/.test(name)) continue;

            currencies[name] = mosaic.quantity;
        }

        return currencies;
    }

    /**
     * This helper method retrieves potential currencies present
     * in a NEM blockchain transaction.
     * 
     * The `filter` argument should be an array of mosaics FQMN
     * filters. For example:
     * 
     * ["dim:*", "test:hello"]
     * 
     * OR 
     * 
     * ["dim:coin"]
     * 
     * @param {Object}  transaction 
     * @param {Array}   filter
     * @return {Object}
     */
    extractCurrencies(transaction, filter) {
        if (! transaction.meta || ! transaction.transaction) {
            throw new Error("Invalid TransactionMetaDataPair paramater in call to DIMSearch.extractCurrencies().");
        }

        let meta = transaction.meta;
        let content = transaction.transaction;
        let data = content.type === 4100 ? content.otherTrans : content;

        if (data.type !== 257 || ! data.mosaics || ! data.mosaics.length) { // mosaic transfer only
            return {};
        }

        // iterate through transaction mosaics to find any dim:* mosaics.
        let currencies = {};
        for (let i = 0, m = data.mosaics.length; i < m; i++) {
            let mosaic = data.mosaics[i];
            let name = this.api.SDK.utils.format.mosaicIdToName(mosaic.mosaicId);

            if (! this.filterMosaic(filter, mosaic)) {
                continue;
            }

            currencies[name] = mosaic.quantity;
        }

        return currencies;
    }

    /**
     * Helper method to extract only a `filter` filtered mosaics.
     * 
     * Filters can contain wildcards and are applied on Fully Qualified
     * Mosaic Names. 
     * 
     * @param {Array} filter 
     * @param {Object} mosaicAttachment
     * @param {Boolean}
     */
    filterMosaic(filter, mosaicAttachment) {
        let attachmentFqmn = this.api.SDK.utils.format.mosaicIdToName(mosaicAttachment.mosaicId);
        let filters = filter.split(",");

        for (let i = 0; i < filters.length; i++) {
            let selector = filters[i];
            if (selector.indexOf("*") !== -1) {
                // should only check before the wildcard.
                let sel = selector.substr(0, selector.indexOf("*")).replace(/([\:\-\/])/g, "\\$1");

                if (!sel || !sel.length) {
                    // wildcard mosaics
                    return true;
                }

                let reg = new RegExp("^" + sel + "(.*)+");
                return reg.test(attachmentFqmn);
            }
            else if (selector === attachmentFqmn) {
                return true;
            }
        }

        return false;
    }

    /**
     * This helper method will look for a given wallet in the 
     * DIM Ecosystem. Wallets are searched for by *address*.
     * 
     * @param {String} hash 
     * @return {DIMWallet}
     */
    async searchWallet(address) {
        if (typeof address == undefined) {
            throw new Error("Missing mandatory 'address' parameter in call to DIMExplorer.searchWallet().");
        }

        // query for wallet current data!, then cache.
        let nemWallet = await this.api.SDK.com.requests
                                  .account.mosaics.owned(this.api.node, address.toString());

        if (! nemWallet || ! nemWallet.data) {
            // transaction not found
            return null;
        }

        // check if we have a database object we might want to update.
        let wallet = new DIM.Wallet({});
        wallet = await wallet.findByField("address", address.toString());

        if (wallet == null) {
            wallet = new DIM.Wallet({
                address: address,
                createdAt: (new Date).valueOf(),
                updatedAt: 0
            });
        }
        else {
            wallet.setAttribute("updatedAt", (new Date).valueOf());
        }

        let currencies = {};
        let mosaics = {};
        for (let i = 0, m = nemWallet.data.length; i < m; i++) {
            let mosaic = nemWallet.data[i];
            let name = this.api.SDK.utils.format.mosaicIdToName(mosaic.mosaicId);
            if (/^dim:(.*)+/.test(name)) {
                // DIM currencies
                currencies[name] = mosaic.quantity;
            }
            else {
                // NEM mosaics
                mosaics[name] = mosaic.quantity;
            }
        }

        wallet.setAttribute("address", address);
        wallet.setAttribute("dimCurrencies", currencies);
        wallet.setAttribute("otherCurrencies", mosaics);

        // cache in database
        wallet = await wallet.save();
        return {
            "address": wallet.address,
            "dimCurrencies": wallet.dimCurrencies,
            "otherCurrencies": wallet.otherCurrencies
        };
    }

}

exports.DIMSearch = DIMSearch;
export default DIMSearch;
