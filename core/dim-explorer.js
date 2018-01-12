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

import DIMParameters from "./dim-parameters";
import NEM from "nem-sdk";

/**
 * The DIMExplorer class provides an easy step into the DIM Ecosystem's
 * shared informations.
 * 
 * The explorer can be used to retrieve important information when working
 * with DIM.
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
     * This helper method lets you retireve the *Total Available Levy*
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

                let mosaics = response.data;
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

}

exports.DIMExplorer = DIMExplorer;
export default DIMExplorer;
