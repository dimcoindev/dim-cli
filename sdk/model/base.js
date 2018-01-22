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

import DIMSchema from "./dim-schema";

class DIMModel {

    /**
     * Configure this model instance.
     * 
     * This will connect to the database in case it is not done yet.
     */
    constructor(data) {

        /**
         * The mongoose Schema for the current DIM model instance.
         *
         * @var {mongoose.Schema}
         */
        this.schema = DIMSchema.instance();

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
     * @param  {Array}  data
     * @return {DIMModel}
     */
    createModel(data) {
        return this.model(data);
    }

    /**
     * Helper method to quickly fetch an entry by a field
     * value.
     * 
     * @param {String} field 
     * @param {Mixed} value 
     * @return {DIMModel}
     */
    async findByField(field, value) {
        let query = {};
        query[field] = value;

        return await this.findOne(query);
    }

    /**
     * Helper method to quickly fetch one entry by a given
     * MongoDB Query.
     * 
     * @param {Object} query 
     * @return {Promise}
     */
    findOne(query) {
        return new Promise(function(resolve, reject) {
            this.model.findOne(query, function(err, result) {

                Object.assign(this, result);

                if (!err && result) {
                    return resolve(this);
                }

                return resolve(null);
            }.bind(this));
        }.bind(this));
    }
}

exports.DIMModel = DIMModel;
export default DIMModel;
