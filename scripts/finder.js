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

import BaseCommand from "../core/command";
import FormatterXLSX from "../core/formatter-xlsx";
import FormatterJSON from "../core/formatter-json";
import DIMParameters from "../core/dim-parameters";
import DIM from "../sdk/index.js";
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
        }, {
            "signature": "-t, --trxlog <filename>",
            "description": "Set the file name to export *the transaction log* to (must also contain the extension). Will be saved to the resources/ folder."
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
            "transactions": {},
            "tokenHolders": {},
            "levels": {"level-1": []}
        };

        /**
         * The NIS API Wrapper client
         * 
         * @var {NIS}
         */
        this.api = undefined;

        /**
         * The current level being crawled.
         *
         * @var {Integer}
         */
        this.current = 1;

        /**
         * The index of the current processed token holder.
         *
         * @var {Integer}
         */
        this.index = 0;

        /**
         * The timeout instance.
         *
         * @var {Integer}
         */
        this.timeout = undefined;

        /**
         * The Accounts formatter instance.
         *
         * @var {Formatter}
         */
        this.formatterAccts = undefined;

        /**
         * The Transactions formatter instance.
         *
         * @var {Formatter}
         */
        this.formatterTrxes = undefined;
    }

    /**
     * This method will run the DIM Payout Export subcommand.
     *
     * @param   {object}    env
     * @return  void
     */
    async run(env) {

        this.log("");
        this.log("DIM Finder (Token Holders Crawler) v" + this.npmPackage.version);
        this.log("");

        let utc = new Date().toJSON().slice(0,10).replace(/-/g, ''); // 2018-01-11 to 20180111

        // interpret command line arguments
        let app_path = process.cwd();
        let path = require("path").basename(__dirname + "/../resources");
        let name = env.file || "dim-token-holders-" + utc;
        let trx_name = env.trxlog || "dim-token-transactions-" + utc;

        // build absolute export file path (fully qualified file path)
        let filePath = app_path + "/" + path + "/" + name;
        let filePathTrx = app_path + "/" + path + "/" + trx_name;

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

        // add correct extension for export files
        let ext = new RegExp("\\." + format.toLowerCase() + "$");
        if (! ext.test(filePath))
            filePath = filePath + "." + format;

        if (! /\.json$/.test(filePathTrx))
            filePathTrx = filePathTrx + ".json";

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

        // --format interpretation
        switch(format) {
            default:
            case 'xslx': this.formatterAccts = new FormatterXLSX(); break;
            case 'json': this.formatterAccts = new FormatterJSON(); break;
            case 'csv':  this.formatterAccts = new FormatterCSV(); break;
        }
        
        // open logging resources
        this.formatterAccts.init(filePath);

        this.formatterTrxes = new FormatterJSON();
        this.formatterTrxes.init(filePathTrx);

        // ----
        // ---- PREPARATION DONE - NOW START CRAWLING
        // ----
        this.log("Now starting dim:token crawler with address: " + startAddress);
        // ----
        // ----
        // ----

        try {

            // fetch first batch of token holders (starting from mosaic creator)
            let totalTokenHolders = await this.startCrawler(startAddress);

            // DONE CRAWLING blockchain transactions
            this.formatterTrxes.save();

            // this is the total number of people *who once 
            // had dim:tokens* but maybe don't have them anymore.
            let unfilteredTokenHoldersCount = Object.keys(this.storage.accounts).length;

            // FILTER all holders (token holders must have more than 50 dim:token)
            let [elligibleTokenHoldersCount, 
                dimTokenHolders] = await this.filterByTokenHolderElligibility(Object.keys(this.storage.accounts), this.storage.tokenHolders);

            // DONE FILTERING HOLDERS
            this.formatterAccts.save();

            console.log("");
            console.log("Total DIM Network Depth: " + this.current);
            console.log("All Token Holders: " + unfilteredTokenHoldersCount + " accounts");
            console.log("Payout Elligible Token Holders: " + elligibleTokenHoldersCount + " token holders");
            console.log("");

            console.log("Now exporting to: " + filePath);

            return this.end();
        }
        catch (e) {
            console.error("CRAWLER ABORTED: ", e);

            // errors should not abort logs
            if (this.formatterTrxes.getRows().length)
                this.formatterTrxes.save();

            console.error(err);
            return this.end();
        }
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
    async startCrawler(forAddress, lvl) {
        let level = lvl || 1;
        let totalTokenHolders = 0;
        let beforeThisLevel = Object.keys(this.storage.accounts).length;
        //console.log("[READ " + (parseInt(level)) + "] (" + forAddress + ")");

        // prepare storage
        let nextLevel = parseInt(level) + 1;
        let currLvlKey = "level-" + parseInt(level);
        let nextLvlKey = "level-" + (nextLevel);
        if (! this.storage.levels.hasOwnProperty(nextLvlKey)) {
            this.storage.levels[nextLvlKey] = [];
        }

        return new Promise(async function(resolve, reject) {
            // crawl the first address, then crawl all found holders.
            let tokenHolders = await this.crawlAddress(forAddress, null);
            let levelHolders = Object.keys(tokenHolders).slice(beforeThisLevel);

            // update storage
            totalTokenHolders += levelHolders.length;
            this.storage.levels[nextLvlKey] = this.storage.levels[nextLvlKey].concat(levelHolders);

            // check whether there is more token holder on the current level.
            let nextLvl = parseInt(this.current);
            if (! this.storage.levels[currLvlKey].length) {
                // done with level, move to next.
                this.clearTimeout();
                nextLvl = ++this.current;

                let cntNextLvl = this.storage.levels["level-" + nextLvl] ? this.storage.levels["level-" + nextLvl].length : 0;
                if (0 === cntNextLvl) {
                    // no entries in next level - DONE (BREAK RECURSION)
                    return resolve(levelHolders.length);
                }

                this.log("Now handling Level " + this.current + " with " + cntNextLvl + " potential token holders.");

                // starting new level, may take some time.
                this.addTimeout();
            }

            // move to next level if available
            currLvlKey = "level-" + parseInt(nextLvl);
            if (!this.storage.levels.hasOwnProperty(currLvlKey)) {
                // no more levels - DONE (BREAK RECURSION).
                return resolve(levelHolders.length);
            }

            let next = this.storage.levels[currLvlKey].shift();
            this.index++;
            if (!next || !next.length) {
                // no more entries - DONE (BREAK RECURSION).
                return resolve(levelHolders.length);
            }

            // RECURSION: crawl next token holder
            return await this.startCrawler(next, nextLvl);

        }.bind(this));
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
     */
    addTimeout() {
        var self = this;

        this.timeout = setInterval(() => {
            console.log("Still processing (Level " + self.current + ", Holder #" + self.index + ") ..");
        }, 3 * 60 * 1000);

        return self;
    }

    /**
     * This method crawls *all* transactions containing dim:token
     * to determine a *full and exhaustive* list of *dim:token holders*.
     *
     * @return {Promise}
     */
    async crawlAddress(cAddress, beforeTrxId) {
        let pageSize = 25;

        return new Promise(async function(resolve, reject) 
        {
            let response = await this.readTransactions(cAddress, beforeTrxId);
            let transactions = response.data;
            if (!transactions || !transactions.length) {
                // account empty
                return resolve(this.storage.accounts);
            }

            // save the read transactions to avoid re-processing
            let res = this.processTransactions(transactions, pageSize);

            if (false === res.status) {
                // done reading transactions
                return resolve(this.storage.accounts);
            }

            // continue crawling current address (there is more transactions).
            return await this.crawlAddress(cAddress, res.lastId);

        }.bind(this));
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
        return new Promise(async function(resolve, reject) 
        {
            let transactions = await this.api.SDK.com.requests
                                         .account.transactions
                                         .outgoing(this.api.node, address, null, beforeTrxId);
            return resolve(transactions);
        }.bind(this));
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
            let sender    = this.api.SDK.model.address.toAddress(realData.signer, this.api.networkId);

            // find dim:token in mosaics array.
            for (let j = 0, n = realData.mosaics.length; j < n; j++) {
                let s = this.api.SDK.utils.format.mosaicIdToName(realData.mosaics[j].mosaicId);
                if ("dim:token" != s) continue;

                // found dim:token OUTPUT: store holder for further crawling.
                if (! this.storage.accounts.hasOwnProperty(recipient))
                    this.storage.accounts[recipient] = {"sender": null, "quantity": 0};

                // transaction log may contain more than one entry GOING TO `recipient`.
                this.storage.accounts[recipient]['sender'] = sender;
                this.storage.accounts[recipient]['quantity'] += parseInt(realData.mosaics[j].quantity);

                // transaction log will print each of those entries (not-aggregated)
                this.formatterTrxes.write({
                    "quantity": parseInt(realData.mosaics[j].quantity),
                    "holder": recipient,
                    "sender": sender
                });
                result['holders'].push(recipient);
                break;
            }
        }

        if (total % pageSize !== 0) {
            // did not return max number of entries, means no more entries available.
            result['status'] = false; // done
        }

        return result;
    }

    /**
     * This method processes all *retrieved* `accounts` and checks
     * their *current mosaic balance for dim:token*.
     * 
     * This step is important to ensure token holders *still own* more
     * than 50 tokens when the payout data is exported.
     *
     * @param {Array} transactions 
     * @return {Object}
     */
    async filterByTokenHolderElligibility(addresses, holders) {
        let remaining = addresses || [];
        let dimTokenHolders = holders;

        //console.log("Filtering holders out of " + remaining.length + " accounts.");

        // promise request result
        return new Promise(async function(resolve, reject) 
        {
            let address = remaining.shift();
            let response = await this.api.SDK.com.requests
                                     .account.mosaics
                                     .owned(this.api.node, address);
            // update store amount for token holder OR remove
            let balances = !response || !response.data ? response.data : [];

            for (let b = 0; b < balances.length; b++) {
                let s = this.api.SDK.utils.format.mosaicIdToName(balances[b].mosaicId);
                if (s !== "dim:token") continue;

                console.log("Found tokens for " + address + ": " + balances[b].quantity + " dim:coin");

                if (balances[b].quantity < this.parameters.minTokenHolderShare) {
                    // token holder DOES NOT meet requirement.
                    continue;
                }

                // token holder MEETS requirements
                dimTokenHolders[address] = balances[b].quantity;

                this.formatterAccts.writeRows([{
                    "holderAddress": address,
                    "stakeQuantity": balances[b].quantity
                }]);

                let holder = new DIM.TokenHolder({
                    address: address,
                    tokenAmount: balances[b].quantity,
                    createdAt: (new Date).valueOf(),
                    updatedAt: 0
                });
                holder.save();
            }

            // In case we still have accounts to iterate over, RECURSION.
            if (remaining.length) {
                return await this.filterByTokenHolderElligibility(remaining, dimTokenHolders);
            }

            // RECURSION DONE
            return resolve(Object.keys(dimTokenHolders).length, dimTokenHolders);

        }.bind(this));
    }

}

exports.Command = Command;
export default Command;
