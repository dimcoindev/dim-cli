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
import mongoose from "mongoose";
import increment from "mongoose-increment";

host = process.env['MONGODB_URI'] || process.env['MONGOLAB_URI'] || "mongodb://localhost/db_dimcoin";
mongoose.connect(host, function(err, res) {
    if (err)
        console.log("ERROR with DIM-cli MongoDB database (" + host + "): " + err);
    else
        console.log("DIM-cli Database connection is now up with " + host);
});

class DIMModel {

    /**
     * Configure this model instance.
     * 
     * This will connect to the database in case it is not done yet.
     */
    constructor(data) {
        /**
         * The mongoose Builder for the current DIM model instance.
         * 
         * @var {mongoose}
         */
        this.builder = mongoose;

        /**
         * The mongoose Schema for the current DIM model instance.
         *
         * @var {mongoose.Schema}
         */
        this.schema = undefined;

        /**
         * The mongoose Model for the current DIM model instance.
         *
         * @var {mongoose.model}
         */
        this.model = undefined;

        /**
         * The data of the current model instance.
         *
         * @var {Array}
         */
        this.data = data || undefined;
    }

    /**
     * Helper method to *create a model instance* of the 
     * underlying Model class (extending this).
     * 
     * @return {DIMModel}
     */
    createModel() {

    }
}

exports.DIMModel = DIMModel;
export default DIMModel;
