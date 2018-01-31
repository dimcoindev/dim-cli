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

class ConsoleInput {
    constructor() {}

    ask(question, format, callback, allowEmpty) {
        if (!allowEmpty) allowEmpty = false;

        var stdin = process.stdin,
            stdout = process.stdout;

        stdout.write(question + ": ");
        stdin.once('data', function(data) {
            data = data.toString().trim();

            if ((format && format.test(data)) || (allowEmpty && !data.length)) {
                // Input Valid
                callback(data);
            }
            else if (format) {
                stdout.write("Input should match: " + format + "\n");
                self.ask(question, format, callback);
            }
        });
    }

    //XXX menu()
}

exports.ConsoleInput = ConsoleInput;
export default ConsoleInput;
