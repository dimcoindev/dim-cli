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
import Request from "request";

import * as JSONBeautifier from "prettyjson";
import * as fs from "fs";

var chalk = require("chalk");

class Command extends BaseCommand {

    /**
     * Configure this API client instance.
     *
     * We also configure options for this command.
     *
     * @param {object}  npmPack
     */
    constructor(npmPack) {
        super(npmPack);

        this.signature = "wallet";
        this.description = ("    " + "This tool lets you read data of DIM wallets.\n"
                    + "    " + "Specify the address of the wallet with --address to get started.\n\n"
                    + "    " + "Examples:\n\n"
                    + "    " + "  $ dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ\n"
                    + "    " + "  $ dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --balances\n"
                    + "    " + "  $ dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --balances --raw\n"
                    + "    " + "  $ dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --overview");

        this.options = [{
            "signature": "-h, --help",
            "description": "Print help message about the `dim-cli.js wallet` command."
        }, {
            "signature": "-a, --address <address>",
            "description": "Set the current wallet by address."
        }, {
            "signature": "-w, --watch",
            "description": "Watch a wallet's transactions and balances."
        }, {
            "signature": "-o, --overview",
            "description": "Get the overview of a given wallet."
        }, {
            "signature": "-b, --balances",
            "description": "Get the account balances of a given wallet."
        }, {
            "signature": "-l, --latest",
            "description": "Get the latest transactions of a given wallet."
        }, {
            "signature": "-R, --raw",
            "description": "Get RAW JSON data displayed instead of the default beautified Display."
        }, {
            "signature": "-B, --beautify",
            "description": "Only applies with --raw. This will print the output beautified instead of raw JSON."
        }, {
            "signature": "-e, --export [flags]",
            "description": "Create a .wlt file export of the said wallet (This will need a private key or password)."
        }, {
            "signature": "-f, --file <wltfile>",
            "description": "Open a wallet through a .wlt file backup (This will need a password)."
        }];

        this.examples = [
            "dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --overview",
            "dim-cli wallet --file /home/alice/Downloads/alices_wallet.wlt --overview",
            "dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --watch",
            "dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --export",
        ];

        this.wallet = undefined;
        this.addresses = {};
    }

    /**
     * This method will run the NIS API Wrapper subcommand.
     *
     * The HTTP request will first be prepared and can be *displayed* with
     * the `--verbose` command line argument.
     *
     * There is currently *no confirmation* for the execution of HTTP Requests.
     *
     * @param   {object}    env
     * @return  void
     */
    run(env) {

        let address  = env.address;
        let hasFile = env.file !== undefined;

        this.wallet = this.loadWallet(env);

        if (!this.wallet) {
            this.help();
            return this.end();
        }

        // Wallet now loaded, should provide with a Menu or Table content

        if (env.overview)
            // --overview
            return this.accountOverview(env, this.wallet.accounts["0"].address);
        else if (env.balances)
            // --balances
            return this.accountBalances(env, this.wallet.accounts["0"].address);
        else if (env.latest)
            // --latest
            return this.latestTransactions(env, this.wallet.accounts["0"].address);

        // the end-user has not specified `--overview`, `--balances` or 
        // `--latest` command line arguments.

        // we will now display a menu so that the user can pick which 
        // wallet address should be selected and which sub command must
        // be executed.
        if (Object.keys(this.wallet.accounts).length === 1) {
            // only one account available, show menu directly.

            this.addressMenu(env, this.wallet.accounts["0"].address);
        }
        else {
            // show an account selector for multiple accounts wallet

            this.showAccountSelector(function(response)
            {
                //let idx = response.selectedIndex;
                let addr = response.replace(/^([^:]+:\s?)/, '');
                this.addressMenu(env, addr);
            }.bind(this));
        }
    }

    /**
     * This method will display the Wallet command's Main Menu.
     * 
     * This lets the user choose between different Actions related
     * to the currently loaded Wallet.
     */
    addressMenu(env, address) {
        var ov = function() { this.accountOverview(env, address); }.bind(this);
        var ba = function() { this.accountBalances(env, address); }.bind(this);
        var tx = function() { this.recentTransactions(env, address); }.bind(this);

        this.displayMenu("Wallet Utilities", {
            "0": {title: "Account Overview", callback: ov},
            "1": {title: "Account Balances", callback: ba},
            "2": {title: "Recent Transactions", callback: tx}
        }, function() { this.end(); }.bind(this), true);
    }

    /**
     * This method will show a list of address from which the end-user 
     * has to select the wanted wallet.
     */
    showAccountSelector(selectedCallback) {
        for (let i = 0, m = Object.keys(this.wallet.accounts).length; i < m; i++) {
            this.addresses[i] = {
                title: this.wallet.accounts[i].label + ": " + this.wallet.accounts[i].address,
                callback: selectedCallback
            };
        }

        this.displayMenu("Select an Address", this.addresses, function() { this.end(); }.bind(this), false);
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
     * Load a DIM Wallet READ-ONLY Data using the given
     * command line arguments (--address and --file)
     * 
     * @return {Wallet|false}
     */
    loadWallet(argv) {
        let params = argv;
        let wallet = false;
        if (params.address && params.address.length) {
            wallet = {
                privateKey: undefined,
                name: "Default",
                accounts: {
                    "0": {
                        address: params.address.replace(/[\-\s]+/, ''),
                        network: this.networkId,
                        label: "Default"
                    }
                }
            };
        }

        if (params.file && params.file.length) {
            // should read .wlt and provide multiple choice if available
            let b64 = fs.readFileSync(params.file);
            let words = this.api.SDK.crypto.js.enc.Base64.parse(b64.toString());
            let plain = words.toString(this.api.SDK.crypto.js.enc.Utf8);

            wallet = JSON.parse(plain);
        }

        if (wallet) this.wallet = wallet;
        return wallet;
    }

    initAPI() {
        this.api.argv = this.argv;
        if (this.wallet && this.wallet.accounts && Object.keys(this.wallet.accounts).length) {
            // use wallet for network identification
            let addr = this.wallet.accounts[0].address.replace(/[\-\s]+/, '');
            this.api.switchNetworkByAddress(addr);
        }
        else {
            // use default parameters
            this.api.connect();
        }
    }

    /**
     * This method will display an account overview for the 
     * currently loaded wallet.
     * 
     * The overview includes wallet balances (mosaics), harvesting
     * status, latest transactions and other wallet informations
     */
    async accountOverview(argv, address) {

        this.initAPI();

        let url = "/account/get?address=" + address;
        let body = undefined;
        let headers = {};

        let nisResp = await this.api.get(url, body, headers);
        let parsed = JSON.parse(nisResp);

        if (parsed.error) {
            console.error("NIS API Request Error: " + parsed.error + " - " + parsed.message + " - Status: " + parsed.status);
            return false;
        }

        let acctMeta = parsed.meta;
        let acctData = parsed.account;

        let multisigData = {
            isMultisig: acctMeta.cosignatories.length > 0 && acctData.multisigInfo.cosignatoriesCount > 0,
            isCosig: acctMeta.cosignatoryOf.length > 0,
            cntTimesCosig: acctMeta.cosignatoryOf.length,
            cntCosigs: acctMeta.cosignatories.length,
            minCosigs: acctData.multisigInfo.minCosignatories ? acctData.multisigInfo.minCosignatories : 0,
            maxCosigs: acctData.multisigInfo.cosignatoriesCount ? acctData.multisigInfo.cosignatoriesCount : 0,
            cosignatories: {},
            cosignatoryOf: {}
        };

        if (acctMeta.cosignatories.length) {
            for (let i in acctMeta.cosignatories) {
                let cosig = acctMeta.cosignatories[i];
                multisigData["cosignatories"][cosig.address] = cosig;
            }
        }

        if (acctMeta.cosignatoryOf.length) {
            for (let i in acctMeta.cosignatoryOf) {
                let cosig = acctMeta.cosignatoryOf[i];
                multisigData["cosignatoryOf"][cosig.address] = cosig;
            }
        }

        let hasEnoughXem = acctData.vestedBalance > 10000 * Math.pow(10, 6);
        let harvestData = {
            hasMinimum: hasEnoughXem,
            canDelegateHarvest: hasEnoughXem && acctMeta.remoteStatus == "ACTIVE",
            isHarvesting: hasEnoughXem && acctMeta.remoteStatus == "ACTIVE" && acctMeta.status == "LOCKED",
            poiScore: parseFloat(parseFloat(acctData.importance).toFixed(10)),
            countBlocks: acctData.harvestedBlocks,
            totalXEM: acctData.balance * Math.pow(10, -6),
            vestedXEM: acctData.vestedBalance * Math.pow(10, -6),
            harvestedXEM: 0.000000
        };

        let rawData = {
            data: {
                "general": harvestData,
                "multisig": multisigData
            }
        };

        if (argv.raw) {
            // --raw flag enabled
            // --beautify would beautify output.
            let rawJSON = JSON.stringify(rawData);
            let j = argv.beautify ? this.beautifyJSON(rawJSON) : rawJSON;
            console.log(j);
            return false;
        }
        else {
            // table display (no JSON)

            this.displayTable("Harvesting Informations", {
                "canDelegateHarvest": "Allowed",
                "isHarvesting": "Status",
                "poiScore": "PoI Score",
                "countBlocks": "# Blocks",
                "vestedXEM": "Vested XEM",
                "harvestedXEM": "Harvested XEM",
                "totalXEM": "Total XEM",
            }, harvestData);
        }

        if (multisigData.isMultisig || multisigData.isCosig) {

            // table display (no JSON)

            this.displayTable("Multi Signature Informations", {
                "isMultisig": "MultiSig",
                "minCosigs": "Min. Co-Sig",
                "cntCosigs": "# of Co-Sig",
                "cntTimesCosig": "Co-Sig of",
            }, multisigData);

            if (multisigData.isMultisig) {
                let cosigs = [];
                let addresses = Object.keys(multisigData.cosignatories);
                for (let i = 0, m = addresses.length; i < m; i++) {
                    let addr = addresses[i];
                    let cosig = multisigData.cosignatories[addr];
                    cosigs.push({
                        number: i+1,
                        address: cosig.address, 
                        balance: cosig.balance * Math.pow(10, -6)
                    });
                }

                this.displayTable("Cosignatories List", {
                    "number": "#",
                    "address": "Address",
                    "balance": "Total XEM"
                }, cosigs);
            }

            if (multisigData.isCosig) {
                let msigs = [];
                let addresses = Object.keys(multisigData.cosignatoryOf);
                for (let i = 0, m = addresses.length; i < m; i++) {
                    let addr = addresses[i];
                    let msig = multisigData.cosignatoryOf[addr];
                    msigs.push({
                        number: i+1,
                        address: msig.address, 
                        balance: msig.balance * Math.pow(10, -6)
                    });
                }

                this.displayTable("Multisignature Accounts", {
                    "number": "#",
                    "address": "Address",
                    "balance": "Total XEM",
                }, msigs);
            }
        }
    }

    /**
     * This method will display an account balances summary.
     * 
     * This should include all mosaics available for the given
     * account.
     */
    async accountBalances(argv, address) {

        this.initAPI();

        let url = "/account/mosaic/owned?address=" + address;
        let body = undefined;
        let headers = {};
        let nisResp = await this.api.get(url, body, headers);
        let parsed = JSON.parse(nisResp);

        if (parsed.error) {
            console.error("NIS API Request Error: " + parsed.error + " - " + parsed.message + " - Status: " + parsed.status);
            return false;
        }

        let tblHead = {
            "balance": "Balance",
            "slug": "Mosaic"
        };

        let balances = [];
        for (let i = 0; i < parsed.data.length; i++) {
            let balance = parsed.data[i];
            let slug = balance.mosaicId.namespaceId + ":" + balance.mosaicId.name;

            let mosaic = await this.api.getMosaic(slug);

            let div = mosaic.properties[0].value;
            balances.push({
                balance: (balance.quantity * Math.pow(10, -div)).toFixed(div),
                slug: slug
            });

            if (balances.length === parsed.data.length) {
                // done retrieving mosaic informations for 
                // the account's balances
                if (argv.raw) {
                    let rawJSON = JSON.stringify({data: balances});
                    let j = argv.beautify ? this.beautifyJSON(rawJSON) : rawJSON;
                    console.log(j);
                    return false;
                }
                else {
                    this.displayTable("Wallet Balances", tblHead, balances);
                }
            }
        }
    }

    /**
     * This method will display a list of latest transactions
     * for the currently loaded Wallet.
     */
    latestTransactions(argv, address) {
        console.log("LATEST");
    }

    accountOverview_printGeneralData(parsed) {

    }
}

exports.Command = Command;
export default Command;
