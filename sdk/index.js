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

import DIMTransaction from './model/dim-transaction';
import DIMWallet from './model/dim-wallet';
import DIMTokenHolder from './model/dim-tokenholder';
import DIMUtils from './helpers';

export default {
    Transaction: DIMTransaction,
    Wallet: DIMWallet,
    TokenHolder: DIMTokenHolder,
    Utils: DIMUtils
};
