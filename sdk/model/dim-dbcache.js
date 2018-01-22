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

import mongoose from "mongoose";
import increment from "mongoose-increment";

class DIMDatabaseCache {

    /**
     * Configure this model instance.
     */
    constructor(config) {
        /**
         * The MongoDB database hostname.
         *
         * @var {String}
         */
        this.host = (config && config.host) || process.env['MONGODB_URI'] 
                                            || process.env['MONGOLAB_URI'] 
                                            || "mongodb://localhost/db_dimcoin";

        /**
         * The mongoose DBMS adapter.
         * 
         * @var {Object}
         */
        this.adapter = mongoose;

        // Connect to MongoDB
        this.adapter.connect(this.host, function(err, res) {
            if (err)
                console.log("ERROR with DIM-cli MongoDB database (" + host + "): " + err);
            else
                console.log("DIM-cli Database connection is now up with " + host);
        });
    }
}

exports.DIMDatabaseCache = DIMDatabaseCache;
export default DIMDatabaseCache;
