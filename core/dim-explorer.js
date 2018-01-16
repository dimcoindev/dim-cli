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

import DIMParameters from "./dim-parameters";
import NEM from "nem-sdk";

/**
 * The DIMExplorer class provides an easy step into the DIM Ecosystem's
 * shared informations.
 * 
 * The explorer can be used to retrieve important information when working
 * with DIM.
 * 
 * All methods in the DIMExplorer return Promises. This means that you will
 * use then-chains rather than callbacks when working with the Explorer class.
 * 
 * @example Instantiate the DIMExplorer class
 * 
 * ```javascript
 *     import NIS from "./scripts/api"; 
 *     let api = new NIS();
 *     api.init({network: "mainnet"});
 * 
 *     let explorer = new DIMExplorer(api);
 * 
 *     // Now use the explorer..
 *     this.getCurrency("dim:coin").then((parameters) => { console.log(parameters); });
 * 
 *     // OR..
 *     this.getTotalHoldersShareLevyAmount()
 *         .then((amount) => { console.log(amount); })
 *         .catch((err) => console.error(err));
 * ```
 *
 */
class DIMExplorer {

    /**
     * Construct the Formatter object
     */
    constructor(NIS) {
        /**
         * The DIM Ecosystem Parameters.
         *
         * @var {DIMParameters}
         */
        this.parameters = new DIMParameters();

        /**
         * The NIS API Wrapper instance.
         *
         * @var {Object}
         */
        this.api = NIS;
    }

    /**
     * This helper method retrieves dim currencies data on the NEM
     * blockchain network.
     *
     * @param {String} currency     Fully qualified mosaic name (dim:coin, dim:token, etc.)
     * @return {Promise}
     */
    getCurrency(currency) {
        let self = this;

        return new Promise(function(resolve, reject) {
            if (self.mosaicParameters.hasOwnProperty(currency)) {
                return resolve(self.mosaicParameters[currency]);
            }

            let ns = currency.replace(/(.*):(.*)/, "$1");
            let mos = currency.replace(/(.*):(.*)/, "$2");

            self.api.SDK.com.requests
                .namespace.mosaicDefinitions(self.api.node, ns)
                .then((response) => {

                let definitions = response.data || []
                for (let d = 0; d < definitions.length; d++) {
                    let s = self.api.SDK.utils.format.mosaicIdToName(definitions[d].id);
                    if (s !== currency) continue;

                    let params = self.parameters.fromMosaicDefinition(definitions[d]);
                    return resolve((self.parameters.mosaicParameters[currency] = params));
                }

                return reject("Currency '" + currency + "' could not be identified on the NEM blockchain.");
            })
            .catch((err) => reject(err));
        });
    }

    /**
     * This helper method lets you retireve the *Total Available Levy*
     * amount from the Levy recipient account.
     *
     * The Total Available Levy represents 30% of the available network
     * fees.
     *
     * @return {Promise}
     */
    getTotalHoldersShareLevyAmount() {
        let self = this;

        return new Promise(function(resolve, reject) {
            self.getTotalAvailableLevyAmount()
                .then((hundredPercentLevyAmount) => {

                // now calculate 30 %
                let thirtyPercentLevyAmount = Math.ceil(0.3 * hundredPercentLevyAmount);
                return resolve(thirtyPercentLevyAmount);
            })
            .catch((err) => reject(err));
        });
    }

    /**
     * This helper method lets you retrieve the *Total Available Levy*
     * amount from the Levy recipient account.
     *
     * The Total Available Levy represents 100% of the available network
     * fees.
     *
     * @return {Promise}
     */
    getTotalAvailableLevyAmount() {
        let self = this;
        let address = self.parameters.mosaicParameters["dim:coin"].levy.recipient;

        // promise request result
        return new Promise(function(resolve, reject) 
        {
            self.api.SDK.com.requests
                .account.mosaics.owned(self.api.node, address)
                .then((response) => {

                let mosaics = response.data || [];
                for (let b = 0; b < mosaics.length; b++) {
                    let s = NEM.utils.format.mosaicIdToName(mosaics[b].mosaicId);
                    if (s !== "dim:coin") continue;

                    return resolve(mosaics[b].quantity);
                }

                return resolve(0);
            })
            .catch((err) => {
                return reject(err);
            });
        });
    }

    /**
     * This helper method lets you retrieve the *Total Circulating Supply*
     * of the said dim currency.
     * 
     * @param   {String}    currency    Mosaic name (dim:coin, dim:token, dim:eur, etc..)
     * @return  {Promise}   The first argument to the promise is the total circulating supply.
     */
    getTotalCirculatingSupply(currency) {
        let self = this;
        let creator = self.parameters.getCoin().creator;
        let address = self.api.SDK.model.address.toAddress(creator, self.api.networkId);

        return new Promise(function(resolve, reject) { 
            this.getCurrency(currency)
                .then((parameters) => { return resolve(parameters.totalSupply); })
                .catch((err) => reject(err));
        });
    }

}

exports.DIMExplorer = DIMExplorer;
export default DIMExplorer;
