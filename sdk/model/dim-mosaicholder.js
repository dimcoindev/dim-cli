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

class DIMMosaicHolder extends DIMModel {

    /**
     * Configure this model instance.
     */
    constructor(data = {}) {
        super(data);

        /**
         * The relation's table name
         * 
         * @var {String}
         */
        this.tableName = "MosaicHolder";

        /**
         * The mongoose Model.
         *
         * @var {mongoose.model}
         */
        this.model = this.schema.getTable(this.tableName);
    }
}

exports.DIMMosaicHolder = DIMMosaicHolder;
export default DIMMosaicHolder;
