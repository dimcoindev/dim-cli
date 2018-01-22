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

import DIMModel from "./base";

/**
 * The DIMTokenHolder class is *only for dim:token Mosaic*
 * and should not be used for the speculative coin: *dim:coin*
 * which is available on exchanges.
 * 
 * DIM Token Holders are people holding the *dim:token* mosaic,
 * this mosaic is not meant to be exchangeable anywhere else than
 * on the upcoming Hybse.
 */
class DIMTokenHolder extends DIMModel {

    /**
     * Configure this model instance.
     */
    constructor(data = {}) {
        super(data);

        this.model = this.schema.TokenHolder;
    }
}

exports.DIMTokenHolder = DIMTokenHolder;
export default DIMTokenHolder;
