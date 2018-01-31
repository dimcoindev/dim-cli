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

import ConsoleInput from "./console-input";
import NISWrapper from "./nis-wrapper";
import FormatterXLSX from "./formatter-xlsx";
import FormatterCSV from "./formatter-csv";
import FormatterJSON from "./formatter-json";

import * as JSONBeautifier from "prettyjson";

var Menu = require("simple-terminal-menu");
var Table = require("easy-table");
var chalk = require("chalk");

/**
 * The BaseCommand class will be extended by all scripts/*.js 
 * JS Command classes.
 *
 * This class is responsible for handling *command line arguments*
 * passed to the CLI as well as hold a *connection object*, an SDK
 * instance and a *node object*, which can all be used directly
 * in child classes.
 */
class BaseCommand {

    /**
     * Construct the BaseCommand object
     *
     * Default properties will be initialized with this 
     * constructor.
     *
     * @param {object} _package 
     */
    constructor(_package) {

        /**
         * The terminal utility to ask for user input.
         * 
         * @var {ConsoleInput}
         */
        this.io = new ConsoleInput();

        /**
         * The NPM package of the NEM-CLI. This is used
         * for the --help command.
         * 
         * @var {object}
         */
        this.npmPackage = _package;

        /**
         * The command signature (Example: "wallet", "api" or "export")
         * 
         * @var {string}
         */
        this.signature = "";

        /**
         * The command description
         * 
         * @var {string}
         */
        this.description = "";

        /**
         * The available command line arguments for
         * this command.
         *
         * Each option object must contain a `signature` and
         * `description` key.
         * 
         * @var {array}
         */
        this.options = [];

        /**
         * This is an array of examples for the said command.
         * 
         * @var {array}
         */
        this.examples = [];

        /**
         * This will contain the command line arguments
         * passed to the command.
         * 
         * @var {object}
         */
        this.argv = {};

        /**
         * The NIS API Wrapper.
         * 
         * @var {NISWrapper}
         */
        this.api = undefined;
    }

    /**
     * This method outputs the help message corresponding to
     * the `./nem-cli <command> --help` command.
     *
     * It will display a list of examples use cases of this API wrapper.
     * 
     * @return void
     */
    help() {

        const warning = chalk.red;
        const keyword = chalk.yellow;
        const label = chalk.green;
        const normal = chalk.reset;
        const log = console.log;

        log("")
        log("  " + label("Usage: ") + keyword("dim-cli " + this.signature + " [options]"));
        log("");
        log("  " + label("Description:"));
        log("");
        log(normal(this.description));
        log("");

        log("");
        log("  " + label("Options: "));

        log("");
        log("    " + keyword("-n, --node [node]") + normal("\t\tSet custom [node] for NIS API"));
        log("    " + keyword("-p, --port [port]") + normal("\t\tSet custom [port] for NIS API"));
        log("    " + keyword("-N, --network [network]") + normal("\t\tSet network (Mainnet|Testnet|Mijin)"));
        log("    " + keyword("-S, --force-ssl") + normal("\t\tUse SSL (HTTPS)"));
        log("    " + keyword("-d, --verbose") + normal("\t\tSet verbose command execution (more logs)"));
        log("");

        for (let i = 0; i < this.options.length; i++) {
            let opt = this.options[i];
            log("    " + keyword(opt.signature) + normal("\t\t" + opt.description));
        }
        log("");

        if (this.examples.length) {
            log("");
            log("  " + label("Examples: "));
            log("");
            for (let j = 0; j < this.examples.length; j++) {
                let example = this.examples[j];
                log("    $ " + example);
            }
        }
    }

    /**
     * This method should *execute* the action proper to the subcommand.
     *
     * Example:
     * 
     *     run(env) { console.log("Command running!"); }
     *
     * @param   {string}    subcommand
     * @param   {object}    opts
     * @return  {void}
     */
    run(subcommand, opts) {
        throw new Error("Please specify a run(env) method in your subclass of BaseCommand.");
    }

    /**
     * This method should end the command execution process.
     * 
     * Example:
     * 
     *     end() { return process.exit(); }
     * 
     * @return void
     */
    end() {
        throw new Error("Please specify a end() method in your subclass of BaseCommand.");
    }

    /**
     * This method will initialize the *connection* object and
     * the SDK object as well as the node object (SDK endpoint).
     *
     * After this method has been called, the command can fully
     * interact with the NEM blockchain node.
     *
     * @param {object} options  Can contain keys "network", "node", "port", "forceSsl"
     */
    init(options) {
        this.argv = options;
        this.api  = new NISWrapper(this.argv);
    }

    /**
     * Helper to create and connect the NIS API Wrapper
     * with set command line arguments.
     * 
     * @return {NISWrapper}
     */
    getNISClient() {
        if (! this.api) {
            this.api = new NISWrapper(this.argv);
        }

        return this.api;
    }

    /**
     * Getter for the `options` property.
     *
     * This property holds the commands' specific argument
     * line options.
     *
     * @return  {array}
     */
    getOptions() {
        return this.options;
    }

    /**
     * Getter for the `signature` property.
     *
     * The signature property explained:
     *
     *     $ ./nem-cli api
     *     $ ./nem-cli list
     * 
     * In these 2 examples, signatures are *api* and *list*.
     *
     * The signature is used to register a subcommand to the commander
     * arguments helper.
     *
     * @return  {string}
     */
    getSignature() {
        return this.signature;
    }

    /**
     * Getter for the `description` property.
     *
     * @return  {string}
     */
    getDescription() {
        return this.description;
    }

    /**
     * Getter for the `io` property.
     *
     * This property holds a helper for class `ConsoleInput`
     * such that input can be asked for from the terminal.
     *
     * @see     {ConsoleInput}
     * @return  {array}
     */
    getInput() {
        return this.io;
    }

    /**
     * This method will display a terminal menu with
     * the given `items`. Items will be indexed, the
     * `items` parameter should be an array with choices
     * texts.
     * 
     * @param {Array} items 
     */
    displayMenu(menuTitle, items, quitCallback, addQuit, cbParams) {
        let self = this;

        let menu = new Menu({
            x: 3,
            y: 2
        });
        menu.writeTitle("DIM CLI v" + this.npmPackage.version);
        menu.writeSubtitle(menuTitle);
        menu.writeSeparator();

        for (let i = 0, m = Object.keys(items).length; i < m; i++) {
            let choice = items[i].title;
            let c = choice.substr(0, 1);

            // add menu item with callback
            menu.add(choice, items[i].callback);
        }

        if (addQuit === true) {
            menu.add("Quit", function() { 
                menu.close(); 
                return quitCallback ? quitCallback() : null; 
            });
        }
    }

    /**
     * This method will display a table in the terminal.
     * 
     * The arguments `headers` and `rows` are mandatory. The
     * `headers` array should have keys representing row field
     * names and values representing header titles.
     * 
     * @param {*} headers 
     * @param {*} rows 
     */
    displayTable(title, headers, data) {
        let self = this;
        let table = new Table();

        if (typeof data === 'object' && data.length) {
            // isArray
            data.forEach(function(row) {
                self.addRow(table, headers, row);
            });
        }
        else {
            self.addRow(table, headers, data);
        }
 
        console.log("");
        console.log(' ' + title + ' ');
        console.log("");
        console.log(table.toString());
    }

    /**
     * This method will check the type of data that is 
     * currently being added and will format (color) the
     * text accordingly.
     * 
     * @see chalk
     * @see easy-table
     * @param {Table} table 
     * @param {Array} fields 
     * @param {Object} data 
     */
    addRow(table, headers, data) {
        let fields = Object.keys(headers);
        for (let f in fields) {
            let field  = fields[f];
            let header = headers[field];

            let value = data[field];
            if (typeof value === 'boolean')
                // YES/NO flags
                value = value === true ? chalk.green("YES") : chalk.red("NO")
            else if (typeof value === 'number')
                // numbers
                value = chalk.yellow(value);
            else if (typeof value === 'string'
                    && (parseFloat(value) == value
                        || parseInt(value) == value)) {
                // numbers (but not typed right)
                value = chalk.yellow(value);
            }

            table.cell(header, value);
        }

        table.newRow();
        return table;
    }

    /**
     * This helper method will return a beautified JSON
     * to be outputted to the console.
     * 
     * @param   {string} json 
     * @return  {string}
     */
    beautifyJSON(json) {
        let parsed = JSON.parse(json);
        let beautified = JSONBeautifier.render(parsed, {
            keysColor: 'green',
            dashColor: 'green',
            stringColor: 'yellow'
        });

        return beautified;
    }

    /**
     * Helper command to export a data set to a given file.
     * 
     * The correct formatted will be determined with the file
     * extension.
     * 
     * @param {String} filePath 
     * @param {Array|Object} results 
     */
    exportToFile(filePath, results) {
        let formatter = null;
        let extension = filePath.replace(/(.*)+\.(.*)$/, '$2');

        console.log("Now exporting " + Object.keys(results).length + " entries..");

        switch(extension) {
            default:
            case 'xlsx':
                formatter = new FormatterXLSX();
                break;

            case 'json':
                formatter = new FormatterJSON();
                break;

            case 'csv':
                formatter = new FormatterCSV();
                break;
        }

        formatter.init(filePath);

        for (let txId in results) {
            formatter.write(results[txId]);
        }

        formatter.save();
        return this;
    }
}

exports.BaseCommand = BaseCommand;
export default BaseCommand;
