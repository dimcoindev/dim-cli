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
import DIM from "../sdk/helpers";
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
            "signature": "-s, --send",
            "description": "Send a transaction from the given Wallet (see also -txR, -txM)."
        }, {
            "signature": "-R, --raw",
            "description": "Get RAW JSON data displayed instead of the default Wallet Display."
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
        else if (env.watch)
            // --watch
            return this.watchAddress(env, this.wallet.accounts["0"].address);

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
        var tx = function() { this.latestTransactions(env, address); }.bind(this);
        var wa = function() { this.watchAddress(env, address); }.bind(this);

        this.displayMenu("Wallet Utilities", {
            "0": {title: "Account Overview", callback: ov},
            "1": {title: "Account Balances", callback: ba},
            "2": {title: "Recent Transactions", callback: tx},
            "3": {title: "Watch Address", callback: wa},
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
            cosignatories: DIM.Utils.flattenArray(acctMeta.cosignatories, "address", "cosignatories"),
            cosignatoryOf: DIM.Utils.flattenArray(acctMeta.cosignatoryOf, "address", "cosignatoryOf")
        };

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
    async latestTransactions(argv, address) {

        this.initAPI();

        let url = "/account/transfers/all?address=" + address;
        let body = undefined;
        let headers = {};
        let nisResp = await this.api.get(url, body, headers);
        let parsed = JSON.parse(nisResp);

        if (parsed.error) {
            console.error("NIS API Request Error: " + parsed.error + " - " + parsed.message + " - Status: " + parsed.status);
            return false;
        }

        let tblHead = {
            "idx": "#",
            "id": "Tx Id",
            "height": "Block #",
            "type": "Type",
            "address": "Address",
            "fee": "Fee",
            "xem": "XEM",
        };

        let trxes = [];
        for (let i = 0; i < parsed.data.length; i++) {
            let trx = parsed.data[i].transaction;
            let meta = parsed.data[i].meta;
            let data = trx.type === 4100 ? trx.otherTrans : trx;
            let recipient = data.recipient;
            let height = meta.height;
            let id     = meta.id;
            let isReceive = recipient === address;

            let sender = this.api.SDK.model.address.toAddress(data.signer, this.api.networkId);
            if (trx.type === 4100) // use multisig account
                sender = this.api.SDK.model.address.toAddress(trx.signer, this.api.networkId);

            recipient = recipient.substr(0, 6) + "-...-" + recipient.substr(-4);
            sender    = sender.substr(0, 6) + "-...-" + sender.substr(-4);

            let type = chalk.red("(OUT)");
            let addresses = "";
            if (data.type === 257 && isReceive) {
                type = chalk.green("(IN)");
                addresses = "From: " + sender;
            }
            else if (data.type === 257) {
                type = chalk.red("(OUT)");
                addresses = "To: " + recipient;
            }

            let fees = 0;

            if (trx.type === 4100) {
                // Multisig handle multi fee
                fees = parseInt(trx.fee) + parseInt(data.fee);
            }
            else {
                fees = parseInt(data.fee);
            }

            let current = {
                idx: i+1,
                id: id,
                height: height,
                type: type,
                address: addresses,
                fee: fees / Math.pow(10, 6),
            }

            if (data.type === 257 && data.mosaics && data.mosaics.length) {
                for (let m = 0; m < data.mosaics.length; m++) {
                    let amt = data.mosaics[m].quantity;
                    let coin = this.api.SDK.utils.format.mosaicIdToName(data.mosaics[m].mosaicId);

                    if (!tblHead.hasOwnProperty(coin))
                        tblHead[coin] = coin;

                    current[coin] = parseInt(amt);
                }
            }

            current.xem = parseInt(data.amount) / Math.pow(10, 6);
            trxes.push(current);
        }

        if (argv.raw) {
            let rawJSON = JSON.stringify({data: trxes});
            let j = argv.beautify ? this.beautifyJSON(rawJSON) : rawJSON;
            console.log(j);
            return false;
        }
        else {
            this.displayTable("Wallet Latest Transactions", tblHead, trxes);
        }
    }

    /**
     * This method will ACTIVELY WATCH a given address.
     * 
     * Running multiple of --watch commands at the same time
     * can bring performance issues. Please use with care.
     * 
     * This will open Websocket connections 
     */
    async watchAddress(argv, address) {

        this.initAPI();

        console.log("[INFO] Now connecting to Node: " + JSON.stringify(this.api.conn.wsNode) + " for Address: " + address);

        try {
            let connector = this.api.SDK.com.websockets.connector.create(this.api.conn.wsNode, address);
            connector = await this.connectWebsocket_(connector);

            console.log("[INFO] Now watching Address: " + address + " on Node: " + this.api.conn.wsNode.host + ":" + this.api.conn.wsNode.port);

            // Subscribe to websockets for this address:
            // - Errors
            // - Chain Blocks
            // - Account Data
            // - Unconfirmed Transactions
            // - Confirmed Transactions

            this.api.SDK.com.websockets.subscribe.errors(connector, function(res) {
                console.error("Account Error received: ", JSON.stringify(res));
            });

            this.api.SDK.com.websockets.subscribe.chain.blocks(connector, function(res){
                console.log("\r\n[BLOCK] [" + (new Date()) + "] " + JSON.stringify(res));
            });

            this.api.SDK.com.websockets.subscribe.account.data(connector, function(res) {
                console.log("\r\n[ACCOUNT] [" + (new Date()) + "] " + JSON.stringify(res));
            });

            this.api.SDK.com.websockets.subscribe.account.transactions.unconfirmed(connector, function(res) {
                console.log("\r\n[UNCONFIRMED] [" + (new Date()) + "] " + JSON.stringify(res));
            });

            this.api.SDK.com.websockets.subscribe.account.transactions.confirmed(connector, function(res) {
                console.log("\r\n[CONFIRMED] [" + (new Date()) + "] " + JSON.stringify(res));
            });

            // data requests
            this.api.SDK.com.websockets.requests.account.data(connector);
            this.api.SDK.com.websockets.requests.account.transactions.recent(connector);

            return connector;
        }
        catch(e) {
            // re-issue connection
            console.error("\r\n[ERROR] [" + (new Date()) + "] " + JSON.stringify(e));
            return false;
        }
    }

    /**
     * This method will create a Transaction for a given DIM Wallet.
     * 
     * You should configure the call to this command using the command line
     * argument prefixed by "tx", that includes but is not limited to:
     * 
     * - txReceiver : NEM Address of the Transaction Receiver.
     * - txMessage : Content of the Transaction message (if any).
     * - txMosaic : Fully Qualified Mosaic Name
     * - txAmount : Set the amount for the last Mosaic *or XEM* in case no mosaic was defined
     * 
     * Currently, if you wish to send `dim:coin`, you will need to call the following:
     * 
     * @example Set dim:coin amount in transaction creation
     * $ dim-cli wallet --address ... --txReceiver ... --txMosaic dim:coin --txAmount 10
     * 
     * This example above will send `10 dim:coin`. Please be sure to *know about the Divisibility*
     * of NEM Mosaics. In fact, dim:coin is a mosaic with a divisibility of 6 which means if you
     * want to send out `15 dim:coin` units, you will need to effectively send 15 million. If you
     * want to pass a *raw amount* as an argument, you can do so as follows:
     * 
     * @example Set dim:coin amount in transaction creation
     * $ dim-cli wallet --address ... --txReceiver ... --txMosaic dim:coin --txRawAmount 15000
     * 
     * This example above will send `0.015000 dim:coin`.
     * 
     * *Transactions sent with this tool will always be signed before they are sent to a NIS
     * network node. This is to avoid any earsdropping during transactions creation.*
     * 
     * @param {*} argv 
     * @param {*} address 
     */
    async sendTransaction(argv, address) {
        this.initAPI();
    }

    /**
     * This method promisifies the Websocket connection 
     * process such that we can use `await` in watchAddress.
     * 
     * @param {Object} connector 
     * @return {Promise}
     */
    connectWebsocket_(connector) {
        return new Promise(function(resolve, reject) {
            connector.connect().then(() => {
                return resolve(connector);
            }).catch((err) => {
                return reject(err);  
            });
        });
    }
}

exports.Command = Command;
export default Command;
