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

import NEM from "nem-sdk";
import Network from "./network";

class Wallets {
    /**
     * Load AccountInfo meta data pair for said NEM wallet
     * `address`.
     * 
     * @param {Object} endpoint     NEM Node Connection Information
     * @param {String} address      
     * @return {Object}
     */
    async loadWalletInfo(endpoint, address) {
        let info = await NEM.com.requests
                            .account
                            .data(endpoint, address);

        return info;
    }

    /**
     * Helper function to check for Cosignatory co-relation with
     * a said Multisig Account.
     *
     * The `multisigInfo` can be either of [NEM AccountMetaData View Model](https://nemproject.github.io/#accountMetaData)
     * or a address for which this method will first fetch the data.
     *
     * @param {String}        key               Either a DIM Wallet Address or Public Key
     * @param {String|Object} multisigInfo      Either of AccountMetaData object or DIM Wallet Address (should related to a multisig account)
     * @return {Boolean}
     */
    async isCosignerKey(key, multisigInfo) {
        if (typeof multisigInfo == "string") {
            multisigInfo = await this.loadWalletInfo(multisigInfo);
        }

        let data = multisigInfo.meta && multisigInfo.meta.cosignatories ? multisigInfo.meta.cosignatories : [];
        if (! data.length) {
            // no multisig info found
            return false;
        }

        for (let i = 0; i < data.length; i++) {
            if (key == data[i].address || key == data[i].publicKey) {
                return true;
            }
        }

        return false;
    }
}

exports.Wallets = Wallets;
export default Wallets;