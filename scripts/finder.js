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

import BaseCommand from "../core/command";
import XLSXFormatter from "../core/xlsx-formatter";
import DIMParameters from "../core/dim-parameters";
import NIS from "./api";
import NEM from "nem-sdk";
import Request from "request";

import * as JSONBeautifier from "prettyjson";
import * as fs from "fs";

class Command extends BaseCommand {

    /**
     * Configure this command.
     *
     * We also configure options for this command.
     *
     * @param {object}  npmPack
     */
    constructor(npmPack) {
        super(npmPack);

        this.signature = "finder";
        this.description = ("    " + "This tool lets you export data of dim:token holders.\n"
                    + "    " + "Examples:\n\n"
                    + "    " + "  $ dim-cli finder --format xlsx");

        this.options = [{
            "signature": "-h, --help",
            "description": "Print help message about the `dim-cli.js finder` command."
        }, {
            "signature": "-e, --export <format>",
            "description": "Set the export format (defaults to xlsx)."
        }];

        this.examples = [
            "dim-cli finder",
            "dim-cli finder --format xlsx",
        ];

        /**
         * The DIM Ecosystem parameters.
         * 
         * @var {DIMParameters}
         */
        this.parameters = new DIMParameters();

        /**
         * Store for retrieved data.
         *
         * @var {Object}
         */
        this.storage = {
            "accounts": {},
            "transactions": {}
        };

        /**
         * The NIS API Wrapper client
         * 
         * @var {NIS}
         */
        this.api = undefined;
    }

    /**
     * This method will run the DIM Payout Export subcommand.
     *
     * @param   {object}    env
     * @return  void
     */
    run(env) {

        let format  = env.format;
        let formats = {"xlsx": true, "json": true, "csv": true};
        if (!format) {
            format = "xlsx";
        }

        if (!formats.hasOwnProperty(format)) {
            this.help();
            return this.end();
        }

        let options = this.argv;
        if (!options.network)
            options.network = "mainnet"; // DIM Network ID 104 = NEM Mainnet

        this.api = new NIS(this.npmPackage);
        this.api.init(options);

        // fetch first batch of token holders (starting from mosaic creator)
        this.startCrawler()
            .then((totalTokenHolders) => {

            console.log("Done with crawler job..");
            console.log("");
            console.log("Total Token Holders found: " + totalTokenHolders);

            return this.end();
        })
        .catch((err) => {
            console.error(err);
            return this.end();
        });
    }

    /**
     * This method will end the current command process.
     *
     * @return void
     */
    end() {
        process.exit();
    }

    /**
     * This method will start the dim:token crawler.
     * 
     * @return {Object}
     */
    startCrawler(forAddress) {
        let self = this;

        let tokenCreator = this.parameters.getToken().creator;
        let startAddress = forAddress || NEM.model.address.toAddress(tokenCreator, this.parameters.dimNetworkId);
        let crawlHolders = [];
        let totalTokenHolders = 0;

        console.log("Now starting crawler with address: " + startAddress);

        return new Promise(function(resolve, reject) {
            // crawl the first address, then crawl all found holders.
            self.crawlAddress(startAddress, null)
                .then((tokenHolders) => {

                console.log("Done crawling " + startAddress + ", Found: " + tokenHolders.length + " Token Holders..");
                totalTokenHolders += tokenHolders.length;

                //while (tokenHolders.length) {
                //    let holder = tokenHolders.shift();
                //    this.startCrawler(holder);
                //}
                resolve(totalTokenHolders);
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * This method crawls *all* transactions containing dim:token
     * to determine a *full and exhaustive* list of *dim:token holders*.
     *
     * @return {Promise}
     */
    crawlAddress(address, beforeTrxId) {
        let pageSize = 100;
        let nextToCrawl = [];
        let self = this;

        return new Promise(function(resolve, reject) 
        {
            self.readTransactions(address, pageSize, beforeTrxId)
                .then((transactions) => {
                    let res = self.processTransactions(transactions, pageSize);

                    // store token holders found in the chunk of transactions
                    nextToCrawl = nextToCrawl.concat(res.holders);

                    if (false === res.status) {
                        // done reading transactions
                        resolve(nextToCrawl);
                    }

                    return self.crawlAddress(address, res.lastId);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    /**
     * This method will read a chunk of `pageSize` count of
     * transactions for the said account with address `address`.
     * 
     * @param {String} address 
     * @param {null|Integer} pageSize 
     * @param {null|Integer} beforeTrxId 
     * @return {Promise}
     */
    readTransactions(address, pageSize, beforeTrxId) {
        let self = this;

        // build http query to NIS
        let query = "address=" + address + "&pageSize=" + (pageSize || 100);
        if (beforeTrxId)
            query += "&id=" + beforeTrxId;

        // promise request result
        return new Promise(function(resolve, reject) 
        {
            self.api.apiGet("/account/transfers/outgoing?" + query, undefined, {}, function(nisResp)
            {
                let parsed = JSON.parse(nisResp);

                if (parsed.error) {
                    return reject(parsed);
                }

                return resolve(parsed);
            });
        });
    }

    /**
     * This method processes a batch of transaction and saves
     * potential token holders data.
     *
     * @param {Array} transactions 
     * @return {Object}
     */
    processTransactions(transactions, pageSize) {
        let total = transactions.length;
        let lastId = null;
        let result = {
            "status": true, 
            "lastId": null, 
            "holders": []
        };
        for (let i = 0; i < total; i++) {
            let meta = transactions[i].meta;
            let content = transactions[i].transaction;
            let transactionId = meta.id;
            result['lastId'] = transactionId;

            // identify and process multisig transactions.
            let realData = content.type === 4100 ? content.otherTrans : content;

            if (this.storage.transactions.hasOwnProperty(transactionId)) {
                // transaction already processed, terminate.
                result['status'] = false; // done
                return result;
            }

            // set transaction as processed (do not reprocess)
            this.storage.transactions[transactionId] = true;

            if (realData.type !== 257) {
                // we want to inspect only Transfer Transactions
                continue;
            }

            if (! realData.mosaics || ! realData.mosaics.length) {
                // no mosaics found in current transaction (can not contain dim:token)
                continue;
            }

            // find dim:token in mosaics array.
            for (let j = 0, n = realData.mosaics.length; j < n; j++) {
                let s = NEM.utils.format.mosaicIdToName(realData.mosaics[j].mosaicId);
                if ("dim:token" === s) {
                    // found dim:token OUTPUT: store holder for further crawling.
                    this.storage.accounts[realData.recipient] = realData.mosaics[j].quantity;
                    result['holders'].push(realData.recipient);
                }
            }
        }

        if (total % pageSize !== 0) {
            // did not return max number of entries, means no more entries available.
            result['status'] = false; // done
            return result;
        }

        return result;
    }

}

exports.Command = Command;
export default Command;
