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
import DIMParameters from "../core/dim-parameters";
import DIMExplorer from "../core/dim-explorer";
import NIS from "./api";
import NEM from "nem-sdk";

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

        this.signature = "explorer";
        this.description = ("    " + "This tool lets you explore DIM ecosystem informations.\n"
                    + "    " + "Examples:\n\n"
                    + "    " + "  $ dim-cli explorer --networkFee"
                    + "    " + "  $ dim-cli explorer --payoutFee"
                    + "    " + "  $ dim-cli explorer --totalSupply dim:coin");

        this.options = [{
            "signature": "-h, --help",
            "description": "Print help message about the `dim-cli.js finder` command."
        }, {
            "signature": "-R, --raw",
            "description": "Get RAW JSON data displayed instead of the default beautified Display (Headless state)."
        }, {
            "signature": "--networkFee",
            "description": "Get the total available Levy amount (100 % of network fee)."
        }, {
            "signature": "--payoutFee",
            "description": "Get the total token holder share amount (30 % of network fee)."
        }, {
            "signature": "--totalSupply <currency>",
            "description": "Get the total circulating supply of a said currency ('dim:coin', 'dim:token', etc.)."
        }, {
            "signature": "--search <term>",
            "description": "Search for Wallets (by address or public key) or for Transactions (by hash or Id)."
        }, {
            "signature": "--account <account>",
            "description": "Search for Transactions in an Account and export."
        }, {
            "signature": "--filter <transactionTypes>",
            "description": "Filter only given transaction types for the export. This argument can contain either of 'incoming', 'outgoing' and 'all' OR and integer in case you wish to filter by NEM transaction type (transaction.type property)."
        }, {
            "signature": "-E, --export",
            "description": "Whether to export a file or display result in Terminal."
        }, {
            "signature": "-F, --format <format>",
            "description": "Set the export format (defaults to xlsx)."
        }];

        this.examples = [
            "dim-cli explorer --networkFee",
            "dim-cli explorer --payoutFee",
            "dim-cli explorer --totalSupply --raw",
            "dim-cli explorer --search TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ",
            "dim-cli explorer --search 7d0cb42402413ede9e710d87c5a28bd728bbdcfb322ba8eaa9ac16ead3daad06",
        ];

        /**
         * The DIM Ecosystem parameters.
         *
         * @var {DIMParameters}
         */
        this.parameters = new DIMParameters();

        /**
         * The DIM Ecosystem exploring helper class.
         *
         * @var {DIMExplorer}
         */
        this.explorer = undefined;

        /**
         * Whether to display raw JSON or beautified display.
         *
         * @var {Boolean}
         */
        this.isRawMode = false;
    }

    /**
     * This method will run the DIM Payout Export subcommand.
     *
     * @param   {object}    env
     * @return  void
     */
    async run(env) {

        this.isRawMode = env.raw ? true : false;

        this.log("");
        this.log("DIM Explorer v" + this.npmPackage.version);
        this.log("");

        // now check format to export
        let networkFee  = env.networkFee;
        let payoutFee = env.payoutFee;
        let hasCommand = networkFee || payoutFee;
        let filter = env.filter || "all";

        if (this.argv == 'help') {
            // invalid format or help asked
            this.help();
            return this.end();
        }

        if (!this.argv.network)
            this.argv.network = "mainnet"; // DIM Network ID 104 = NEM Mainnet

        this.api.argv = this.argv;
        this.api.connect();

        this.explorer = new DIMExplorer(this.api);

        if (env.search) {
            // Print the EXPLORER SEARCH RESULTS
            // -----------------------------------------------------
            // This command will search for Wallets or Transactions.

            let searchTerm = env.search;
            let result = await this.explorer.searchByTerm(searchTerm);

            this.outputSearchResults("DIM Ecosystem Search Results", result, searchTerm);
            return this.end();
        }

        if (env.account) {
            // Print the EXPLORER TRANSACTIONS
            // -------------------------------------------------------
            // This command will search for Transactions of an Account

            let whichAccount = env.account;
            let result = await this.explorer.getAccountTransactions(whichAccount, null, filter);
            let utc = new Date().toJSON().slice(0,10).replace(/-/g, ''); // 2018-01-11 to 20180111

            let filePath = require("path").basename(__dirname + "/../resources");
            filePath = filePath + "/account-transactions-" + utc + "-" + whichAccount + "." + (env.format || 'xlsx');

            // check for --export flag to tell whether we create a file.
            if (env.export) {
                this.exportToFile(filePath, result);
            }
            else {
                this.outputSearchResults("Account Transactions", result, whichAccount);
            }

            return this.end();
        }

        if (env.networkFee) {
            // Print the TOTAL AVAILABLE NETWORK FEE
            // -------------------------------------
            // This amount represents 100% of the available dim:coin Network Levy.

            let totalLevy = await this.explorer.getTotalAvailableLevyAmount();
            this.outputResponse("Total Network Fee ", totalLevy, "dim:coin");
        }

        if (env.payoutFee) {
            // Print the TOTAL TOKEN HOLDER FEE SHARE
            // --------------------------------------
            // This amount represents 30% of the available dim:coin Token Holder Levy Share.
            // This is the amount that must be *paid out* weekly.

            let holdersShareLevy = await this.explorer.getTotalHoldersShareLevyAmount();
            this.outputResponse("Token Holder Fee Share: ", holdersShareLevy, "dim:coin")
        }

        if (env.totalSupply) {
            // Print the TOTAL CIRCULATING SUPPLY OF CURRENCY
            // ----------------------------------------------
            // The returned amount represents the TOTAL available supply
            // of a said currency. This is the total of coins that have
            // been created by the mosaic creator.

            let currency = env.totalSupply;
            if (! currency.match(/(.*):(.*)/)) {
                // currency format error
                this.help();
                return this.end();
            }

            let totalSupply = await this.explorer.getTotalCirculatingSupply(currency);
            this.outputResponse("Total supply of '" + currency + "' is ", totalSupply, currency);
        }

        return this.end();
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
     * Helper to log only to console if raw mode is not enabled.
     *
     * @param {String} m 
     * @return {Object}
     */
    log(m) {
        if (! this.isRawMode)
            console.log(m);

        return this;
    }

    /**
     * Helper to correctly output a response (in raw mode or not)
     *
     * @param   {String}    resultTitle
     * @param   {mixed}     resultValue
     * @return  {Object}
     */
    outputResponse(resultTitle, resultValue, currencySlug) {

        let formatted = (resultValue / Math.pow(10, 6)).toFixed(6);

        if (this.isRawMode) {
            // --raw flag enabled
            let obj = {"integer": resultValue, "float": formatted, "currency": currencySlug};
            let rawJSON = JSON.stringify(obj);
            console.log(rawJSON);
            return this;
        }

        console.log(resultTitle, formatted + " " + currencySlug);
        return this;
    }

    /**
     * Helper to correctly output a list of search results with a menu
     * for selection of the most interesting result (if more than one).
     * 
     * @param {String} resultTitle 
     * @param {Array} results 
     */
    outputSearchResults(resultTitle, results, term) {

        if (this.isRawMode) {
            // --raw flag enabled
            let obj = results;
            let rawJSON = JSON.stringify(obj);
            console.log(rawJSON);
            return this;
        }

        console.log(resultTitle);
        console.log(('-').repeat(resultTitle.length));
        console.log("");

        if (! results) {
            console.log("We couldn't find any Wallet or Transaction matching your search term '" + term + "'");
            console.log("");
            console.log("  Following are usage examples for the DIMExplorer command line interface, you can");
            console.log("  search for any Wallet Address (Testnet/Mainnet) or any Transaction Hash.");
            console.log("");
            console.log("    dim-cli explorer --search TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ");
            console.log("    dim-cli explorer --search 7d0cb42402413ede9e710d87c5a28bd728bbdcfb322ba8eaa9ac16ead3daad06");
            console.log("");
        }
        else {
            // remove mongodb specific data
            delete results["_id"], results["createdAt"], results["updatedAt"], results["__v"];

            console.log("Following beautified JSON corresponds to an EXACT MATCH of your search term '" + term + "'");
            console.log("");
            console.log(this.beautifyJSON(JSON.stringify(results)));
            console.log("");
        }

        return this;
    }

}

exports.Command = Command;
export default Command;
