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
                    + "    " + "  $ dim-cli explorer --total-network-fee"
                    + "    " + "  $ dim-cli explorer --total-holder-fee-share");

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
        }];

        this.examples = [
            "dim-cli explorer --networkFee",
            "dim-cli explorer --payoutFee",
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
    run(env) {

        this.isRawMode = env.raw ? true : false;

        this.log("");
        this.log("DIM Explorer v" + this.npmPackage.version);
        this.log("");

        // now check format to export
        let networkFee  = env.networkFee;
        let payoutFee = env.payoutFee;
        let hasCommand = networkFee || payoutFee;

        if (this.argv == 'help') {
            // invalid format or help asked
            this.help();
            return this.end();
        }

        let options = this.argv;
        if (!options.network)
            options.network = "mainnet"; // DIM Network ID 104 = NEM Mainnet

        this.api = new NIS(this.npmPackage);
        this.api.init(options);

        this.explorer = new DIMExplorer(this.api);

        if (env.networkFee) {
            // Print the TOTAL AVAILABLE NETWORK FEE
            // -------------------------------------
            // This amount represents 100% of the available dim:coin Network Levy.

            this.explorer.getTotalAvailableLevyAmount()
                .then((totalLevy) => { 

                return this.outputResponse("Total Network Fee ", totalLevy, "dim:coin")
                           .end();
            });
        }
        else if (env.payoutFee) {
            // Print the TOTAL TOKEN HOLDER FEE SHARE
            // --------------------------------------
            // This amount represents 30% of the available dim:coin Token Holder Levy Share.
            // This is the amount that must be *paid out* weekly.

            this.explorer.getTotalHoldersShareLevyAmount()
                .then((holdersShareLevy) => { 

                return this.outputResponse("Token Holder Fee Share: ", holdersShareLevy, "dim:coin")
                           .end();
            });
        }
        else {
            this.help();
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

}

exports.Command = Command;
export default Command;
