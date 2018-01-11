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
            "signature": "-F, --format <format>",
            "description": "Set the export format (defaults to xlsx)."
        }, {
            "signature": "-f, --file <filename>",
            "description": "Set the file name to export to (must also contain the extension). Will be saved to the resources/ folder."
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

        /**
         * Store the Per-Level Holders information.
         *
         * @var {Object}
         */
        this.levels = {"level-1": []};

        /**
         * The current level being crawled.
         *
         * @var {Integer}
         */
        this.current = 1;
    }

    /**
     * This method will run the DIM Payout Export subcommand.
     *
     * @param   {object}    env
     * @return  void
     */
    run(env) {

        this.log("");
        this.log("DIM Finder (Token Holders Crawler) v" + this.npmPackage.version);
        this.log("");

        let utc = new Date().toJSON().slice(0,10).replace(/-/g, ''); // 2018-01-11 to 20180111

        // interpret command line arguments
        let app_path = process.cwd();
        let path = require("path").basename(__dirname + "/../resources");
        let name = env.file || "dim-token-holders-" + utc;

        // build absolute export file path (fully qualified file path)
        let filePath = app_path + "/" + path + "/" + name;

        // now check format to export
        let format  = env.format;
        let formats = {"xlsx": true, "json": true, "csv": true};
        if (!format) {
            format = "xlsx";
        }

        if (!formats.hasOwnProperty(format) || this.argv == 'help') {
            // invalid format or help asked
            this.help();
            return this.end();
        }

        // add correct extension for export
        let ext = new RegExp("\\." + format.toLowerCase() + "$");
        if (! ext.test(filePath))
            filePath = filePath + "." + format;

        // `filePath` is now a fully qualified export file name (self-contained path)
        // Crawler command will now start processing.

        let options = this.argv;
        if (!options.network)
            options.network = "mainnet"; // DIM Network ID 104 = NEM Mainnet

        this.api = new NIS(this.npmPackage);
        this.api.init(options);

        // get necessary DIM parameters
        let tokenCreator = this.parameters.getToken().creator;
        let startAddress = this.api.SDK.model.address.toAddress(tokenCreator, this.parameters.dimNetworkId);

        this.log("Now starting dim:token crawler with address: " + startAddress, "label", true);

        // fetch first batch of token holders (starting from mosaic creator)
        this.startCrawler(startAddress)
            .then((totalTokenHolders) => {

            // DONE CRAWLING - pretty print
            let result = {
                "allTokenHolders": Object.keys(self.accounts).length,
                "totalDepth": this.current,
            };

            let beautified = JSONBeautifier.render(result, {
                keysColor: 'green',
                dashColor: 'green',
                stringColor: 'yellow'
            });

            // EXPORT to file
            let formatter = new XLSXFormatter();
            formatter.init(filePath)
                     .write(self.accounts)
                     .save();

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

    log(message) {
        console.log(message);
        return this;
    }

    /**
     * This method will start the dim:token crawler.
     * 
     * @return {Object}
     */
    startCrawler(forAddress, lvl) {
        let self = this;

        let level = lvl || 1;
        let totalTokenHolders = 0;
        let beforeThisLevel = Object.keys(self.storage.accounts).length;
        //console.log("[READ " + (parseInt(level)) + "] (" + forAddress + ")");

        // prepare storage
        let nextLevel = parseInt(level) + 1;
        let currLvlKey = "level-" + parseInt(level);
        let nextLvlKey = "level-" + (nextLevel);
        if (! self.levels.hasOwnProperty(nextLvlKey)) {
            self.levels[nextLvlKey] = [];
        }

        return new Promise(function(resolve, reject) {
            // crawl the first address, then crawl all found holders.
            self.crawlAddress(forAddress, null)
                .then((tokenHolders) => {

                let levelHolders = Object.keys(tokenHolders).slice(beforeThisLevel);

                // update storage
                totalTokenHolders += levelHolders.length;
                self.levels[nextLvlKey] = self.levels[nextLvlKey].concat(levelHolders);

                if (levelHolders.length) {
                    // found *potential* holders in next level.
                    self.log("Found " + levelHolders.length + " dim:token Holders (Level " + nextLevel + ")");
                }

                // check whether there is more token holder on the current level.
                let nextLvl = parseInt(self.current);
                if (! self.levels[currLvlKey].length) {
                    // done with level, move to next.
                    nextLvl = ++self.current;
                }

                // move to next level if available
                currLvlKey = "level-" + parseInt(nextLvl);
                if (!self.levels.hasOwnProperty(currLvlKey)) {
                    // no more levels - DONE (BREAK RECURSION).
                    return resolve(levelHolders.length);
                }

                let next = self.levels[currLvlKey].shift();
                if (!next || !next.length) {
                    // no more entries - DONE (BREAK RECURSION).
                    return resolve(levelHolders.length);
                }

                // RECURSION: crawl next token holder
                return self.startCrawler(next, nextLvl)
                           .then((holdersByLevel) => resolve(holdersByLevel))
                           .catch((err) => reject(err));
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
    crawlAddress(cAddress, beforeTrxId) {
        let pageSize = 25;
        let self = this;

        return new Promise(function(resolve, reject) 
        {
            self.readTransactions(cAddress, beforeTrxId)
                .then((response) => {

                // save the read transactions to avoid re-processing
                let transactions = response.data;
                if (!transactions || !transactions.length) {
                    // account empty
                    return resolve(self.storage.accounts);
                }

                let res = self.processTransactions(transactions, pageSize);

                if (false === res.status) {
                    // done reading transactions
                    return resolve(self.storage.accounts);
                }

                // continue crawling current address.
                return self.crawlAddress(cAddress, res.lastId)
                           .then((acct) => { resolve(acct); })
                           .catch((err) => { reject(err); });
            })
            .catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * This method will read a chunk  transactions for the 
     * said account with address `address`.
     * 
     * @param {String} address 
     * @param {null|Integer} beforeTrxId 
     * @return {Promise}
     */
    readTransactions(address, beforeTrxId) {
        let self = this;

        // promise request result
        return new Promise(function(resolve, reject) 
        {
            self.api.SDK.com.requests
                .account.transactions.outgoing(self.api.node, address, null, beforeTrxId)
                .then((transactions) => {
                return resolve(transactions);
            })
            .catch((err) => {
                return reject(err);
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

            let recipient = realData.recipient;

            // find dim:token in mosaics array.
            for (let j = 0, n = realData.mosaics.length; j < n; j++) {
                let s = NEM.utils.format.mosaicIdToName(realData.mosaics[j].mosaicId);
                if ("dim:token" == s) {
                    if (! this.storage.accounts.hasOwnProperty(recipient))
                        this.storage.accounts[recipient] = realData.mosaics[j].quantity;
                    else
                        this.storage.accounts[recipient] += realData.mosaics[j].quantity;

                    // found dim:token OUTPUT: store holder for further crawling.
                    result['holders'].push(recipient);
                    break;
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
