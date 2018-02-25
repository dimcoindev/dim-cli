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
import DIMSearch from "./dim-search";
import NEM from "nem-sdk";

/**
 * The DIMExplorer class provides an easy step into the DIM Ecosystem's
 * shared informations.
 * 
 * The explorer can be used to retrieve important information when working
 * with DIM.
 * 
 * All methods in the DIMExplorer return Promises. This means that you will
 * use then-chains rather than callbacks when working with the Explorer class.
 * 
 * @example Instantiate the DIMExplorer class
 * 
 * ```javascript
 *     import NIS from "./core/nis-wrapper"; 
 *     let api = new NIS();
 *     api.connect();
 * 
 *     let explorer = new DIMExplorer(api);
 * 
 *     // Now use the explorer..
 *     this.getCurrency("dim:coin").then((parameters) => { console.log(parameters); });
 * 
 *     // OR..
 *     this.getTotalHoldersShareLevyAmount()
 *         .then((amount) => { console.log(amount); })
 *         .catch((err) => console.error(err));
 * ```
 *
 */
class DIMExplorer {

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
         * The DIM Ecosystem Finder.
         *
         * @var {DIMSearch}
         */
        this.finder = new DIMSearch(NIS);

        /**
         * The NIS API Wrapper instance.
         *
         * @var {Object}
         */
        this.api = NIS;

        /**
         * Store for retrieved data.
         *
         * @var {Object}
         */
        this.storage = { "transactions": {} };

        /**
         * The timeout instance.
         *
         * @var {Integer}
         */
        this.timeout = undefined;

        /**
         * The index of the current processed token holder.
         *
         * @var {Integer}
         */
        this.index = 0;
    }

    /**
     * This helper method retrieves dim currencies data on the NEM
     * blockchain network.
     *
     * @param {String} currency     Fully qualified mosaic name (dim:coin, dim:token, etc.)
     * @return {Object|null}
     */
    async getCurrency(currency) {

        if (this.parameters.mosaicParameters.hasOwnProperty(currency)) {
            return this.parameters.mosaicParameters[currency];
        }

        let ns = currency.replace(/(.*):(.*)/, "$1");
        let mos = currency.replace(/(.*):(.*)/, "$2");

        // request MosaicDefinition from NIS
        let response = await this.api.SDK.com.requests
                                 .namespace.mosaicDefinitions(this.api.node, ns);

        let definitions = response.data || [];

        for (let d = 0; d < definitions.length; d++) {
            let s = this.api.SDK.utils.format.mosaicIdToName(definitions[d].mosaic.id);
            if (s !== currency) continue;

            let params = this.parameters.fromMosaicDefinition(definitions[d]);
            return (this.parameters.mosaicParameters[currency] = params);
        }

        return null;
    }

    /**
     * This helper method lets you retireve the *Total Available Levy*
     * amount from the Levy recipient account.
     *
     * The Total Available Levy represents 30% of the available network
     * fees.
     *
     * @return {Integer}
     */
    async getTotalHoldersShareLevyAmount() {
        let self = this;

        // get 100% of network fees
        let hundredPercentLevyAmount = await this.getTotalAvailableLevyAmount();

        // now calculate 30 %
        let thirtyPercentLevyAmount = Math.ceil(0.3 * hundredPercentLevyAmount);
        return thirtyPercentLevyAmount;
    }

    /**
     * This helper method lets you retrieve the *Total Available Levy*
     * amount from the Levy recipient account.
     *
     * The Total Available Levy represents 100% of the available network
     * fees.
     *
     * @return {Integer}
     */
    async getTotalAvailableLevyAmount() {
        let self = this;
        let address = self.parameters.mosaicParameters["dim:coin"].levy.recipient;

        // fetch Total balance from Levy Account
        let response = await this.api.SDK.com.requests
                                 .account.mosaics.owned(self.api.node, address);

        let mosaics = response.data || [];
        for (let b = 0; b < mosaics.length; b++) {
            let s = NEM.utils.format.mosaicIdToName(mosaics[b].mosaicId);
            if (s !== "dim:coin") continue;

            return mosaics[b].quantity;
        }

        return 0;
    }

    /**
     * This helper method lets you retrieve the *Total Circulating Supply*
     * of the said dim currency.
     * 
     * @param   {String}    currency    Mosaic name (dim:coin, dim:token, dim:eur, etc..)
     * @return  {Integer}   The first argument to the promise is the total circulating supply.
     */
    async getTotalCirculatingSupply(currency) {
        let self = this;
        let creator = self.parameters.getCoin().creator;
        let address = self.api.SDK.model.address.toAddress(creator, self.api.networkId);

        let parameters = await this.getCurrency(currency);
        if (!parameters)
            return 0;

        return parameters.totalSupply;
    }

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
        return await this.finder.searchByTerm(term);
    }

    /**
     * This helper method will read *all* transactions of a given
     * account and return an array with rows being transactions.
     * 
     * @param {String} address 
     * @param {Integer} beforeTrxId 
     * @return {Object}
     */
    async getAccountTransactions(address, beforeTrxId) {

        if (!this.timeout) {
            this.addTimeout();
        }

        let response = await this.readTransactions(address, beforeTrxId);
        let transactions = response.data;
        if (!transactions || !transactions.length) {
            this.clearTimeout();
            return []; // empty account
        }

        // save the read transactions to avoid re-processing
        let res = this.processTransactions(address, transactions, 25);

        if (false === res.status) {
            this.clearTimeout();

            // done reading transactions
            return this.storage.transactions;
        }

        // continue crawling current address (there is more transactions).
        return await this.getAccountTransactions(address, res.lastId);
    }

    /**
     * This method will read a chunk  transactions for the 
     * said account with address `address`.
     * 
     * @param {String} address 
     * @param {null|Integer} beforeTrxId 
     * @return {Promise}
     */
    async readTransactions(address, beforeTrxId) {
        // promise request result
        let transactions = await this.api.SDK.com.requests
                                         .account.transactions
                                         .all(this.api.node, address, null, beforeTrxId);
        return transactions;
    }

    /**
     * This method processes a batch of transaction and saves
     * transactions data in storage to avoid re-processing read
     * transactions.
     *
     * @param {Array} transactions 
     * @return {Object}
     */
    processTransactions(address, transactions, pageSize) {
        let total = transactions.length;
        let lastId = null;
        let sdk = this.api.SDK;
        let result = {
            "status": true, 
            "lastId": null
        };

        for (let i = 0; i < total; i++) {
            let meta = transactions[i].meta;
            let content = transactions[i].transaction;
            let transactionId = meta.id;
            let transactionHash = meta.hash.data;
            result['lastId'] = transactionId;

            // identify and process multisig transactions.
            let realData = content.type === 4100 ? content.otherTrans : content;

            // read specialized transaction data
            let realSender = sdk.model.address.toAddress(realData.signer, this.api.networkId);
            let multiplier = realData.amount;
            let allAmounts = this.extractAmounts_(realData.mosaics, multiplier);
            let xemAmount  = (allAmounts["nem:xem"] / Math.pow(10, 6)).toFixed(6);
            let otherCurrencies = "";

            if (realData.mosaics && realData.mosaics.length) {
                let currencies = Object.keys(allAmounts).length;
                for (let i = 0, m = currencies.length; i < m; i++) {
                    let currency = currenies[i];
                    let amount = allAmounts[currency] / Math.pow(10, 6);

                    if ("nem:xem" !== currency) {
                        otherCurrencies = (otherCurrencies.length ? " | " : "")
                                        + amount + " " + currency;
                    }
                }
            }

            let aggregate = {
                "txId": transactionId,
                "txHash": transactionHash,
                "operator": realData.recipient === address ? "INCOMING" : "OUTGOING",
                "multiSig": content.type === 4100 ? "YES" : "NO",
                "signatures": content.type === 4100 ? JSON.stringify(content.signatures) : [],
                "sender": realSender,
                "recipient": realData.recipient,
                "xemAmount": xemAmount,
                "otherCurrencies": otherCurrencies.length ? otherCurrencies : "N/A",
                "data": JSON.stringify(realData)
            };

            if (this.storage.transactions.hasOwnProperty(transactionId)) {
                // transaction already processed, terminate.
                result['status'] = false; // done
                return result;
            }

            this.index++;

            // set transaction as processed (do not reprocess)
            this.storage.transactions[transactionId] = aggregate;
        }

        if (total % pageSize !== 0) {
            // did not return max number of entries, means no more entries available.
            result['status'] = false; // done
        }

        return result;
    }

    /**
     * Clear the process timeout.
     *
     * @return {Object}
     */
    clearTimeout() {
        if (this.timeout)
            clearInterval(this.timeout);

        return this;
    }

    /**
     * Add a console message whenever a process is longer than 3 minutes.
     * 
     * @return {Object}
     */
    addTimeout() {
        this.timeout = setInterval(function () {
            console.log("Still processing Transactions (Transaction #" + this.index + ") ..");
        }.bind(this), 3 * 60 * 1000);

        return this;
    }

    /**
     * Helper method to extract mosaic amounts from mosaics arrays.
     * 
     * @param {Array} mosaics 
     * @param {Integer} multiplier 
     */
    extractAmounts_(mosaics, multiplier) {
        let amountByCurrencies = {};

        if (!mosaics || !mosaics.length) {
            return {"nem:xem": multiplier};
        }

        for (let i = 0, m = mosaics.length; i < m; i++) {
            let name = this.api.SDK.utils.format.mosaicIdToName(mosaics[i].mosaicId);
            let amt  = mosaics[i].quantity;

            amountByCurrencies[name] = multiplier * amt;
        }

        return amountByCurrencies;
    }

}

exports.DIMExplorer = DIMExplorer;
export default DIMExplorer;
