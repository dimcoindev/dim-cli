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

import NEMNetworkConnection from "./nem-connection";
import NEM from "nem-sdk";
import Request from "request";
const { URLSearchParams } = require('url');

class NISWrapper {

    /**
     * Construct a NIS API Wrapper object.
     * 
     * @param   {Object}    options
     */
    constructor(options) {

        /**
         * Default Nodes by Network name.
         * 
         * @var {Object}
         */
        this.defaultNodes = {
            "mainnet": "hugealice.nem.ninja",
            "testnet": "bigalice2.nem.ninja"
        };

        /**
         * The API Wrapper initialization options.
         * 
         * @var {Object}
         */
        this.argv = options;

        /**
         * Whether the current instance is connected or not.
         * 
         * @var {Boolean}
         */
        this.connected = false;

        /**
         * This variable contains Discovered Namespaces.
         * This is to provide a caching mechanism for Mosaic
         * and Namespaces.
         * 
         * @var {object}
         */
        this.__ns_Discovery = {};
    }

    /**
     * Connect the NIS API Wrapper.
     * 
     * @return {NISWrapper}
     */
    connect() {

        let network = "testnet";
        let port = this.argv.port ? parseInt(this.argv.port) : 7890;
        let node = this.argv.node && this.argv.node.length ? this.argv.node : "bigalice2.nem.ninja";

        if (this.argv.network) {
            // --network has precedence over --node

            network = this.argv.network.toLowerCase();
            if (! this.defaultNodes.hasOwnProperty(network))
                network = "testnet";

            node = this.defaultNodes[network];
        }

        let nsch = node.match(/^http/) ? node.replace(/:\/\/.*/, '') : null;
        node     = node.replace(/https?:\/\//, '');

        let scheme = this.argv.forceSsl ? "https" : (nsch ? nsch : "http");

        // set connection object
        this.conn = new NEMNetworkConnection(network, scheme + "://" + node, port);
        this.SDK  = this.conn.SDK;
        this.node = this.SDK.model.objects.create("endpoint")(this.conn.getHost(), this.conn.getPort());
        this.network = network;
        this.networkId = this.SDK.model.network.data[network].id;
        this.connected = true;

        return this;
    }

    /**
     * Disconnect the NIS API Wrapper.
     * 
     * @return {NISWrapper}
     */
    disconnect() {
        delete this.conn,
               this.SDK,
               this.node,
               this.network,
               this.networkId;
    }

    /**
     * The switchNetworkByQS method will identify potential a `address`
     * parameter in the query string of the URL provided.
     *
     * @param {string} url 
     */
    switchNetworkByQS(url) {

        let hasQuery = url && url.length ? url.match(/\?[a-z0-9=_\-\+%]+$/i) : false;
        if (! hasQuery)
            return "testnet";

        // most common use case: endpoint?address=..
        let query = url.replace(/(.*)(\?[a-z0-9=_\-\+%]+)$/i, "$2");
        let urlParams = new URLSearchParams(query);

        if (urlParams.has("address")) {
            // address parameter found, we will determine the network by 
            // the address parameter whenever an address is identified.

            let addr = urlParams.get("address");
            return this.switchNetworkByAddress(addr);
        }

        return this;
    }

    /**
     * Switch the currently set NEM NETWORK to the one retrieved
     * from the given `address`.
     *  
     * @param {String} address  NEM Wallet Address
     */
    switchNetworkByAddress(address) {
        let network = NEMNetworkConnection.getNetworkForAddress(address);

        if (network != this.network) {
            // re-init with new network identified by address.
            this.argv = {"network": network};
            this.connect();
        }

        return this;
    }

    /**
     * This method is a NIS API Wrapper helper method that will
     * send a GET Request to the configured `this.node`.
     * 
     * @param   {string}    url         NIS API URI (/chain/height, /block/at/public, etc.)
     * @param   {string}    body        HTTP Request Body (JSON)
     * @param   {object}    headers     HTTP Headers
     * @return  {Promise}
     */
    get(url, body, headers) {
        if (this.argv.verbose)
            this.dumpRequest("GET", url, body, headers)

        var fullUrl  = this.node.host + ":" + this.node.port + url;
        var wrapData = {
            url: fullUrl,
            headers: headers,
            method: 'GET'
        };

        if (body && body.length)
            wrapData.json = JSON.parse(body);

        return new Promise(function(resolve, reject) {
            Request(wrapData, function(error, response, body) {
                let res = response.toJSON();
                return resolve(res.body);
            });
        });
    }

    /**
     * This method is a NIS API Wrapper helper method that will
     * send a POST Request to the configured `this.node`.
     *
     * @param   {string}    url         NIS API URI (/chain/height, /block/at/public, etc.)
     * @param   {string}    body        HTTP Request Body (JSON)
     * @param   {object}    headers     HTTP Headers
     * @return  {Promise}
     */
    post(url, body, headers,) {
        if (this.argv.verbose)
            this.dumpRequest("POST", url, body, headers)

        var fullUrl  = this.node.host + ":" + this.node.port + url;
        var wrapData = {
            url: fullUrl,
            headers: headers,
            method: 'POST'
        };

        if (body && body.length)
            wrapData.json = JSON.parse(body);

        return new Promise(function(resolve, reject) {
            Request(wrapData, function(error, response, body) {
                let res = response.toJSON();
                return resolve(res.body);
            });
        });
    }

    /**
     * This helper method will retrieve mosaic informations 
     * about the given `slug`. A mosaic slug for XEM is "nem:xem"
     * for example. For DIM COIN this would be "dim:coin", and so 
     * on..
     * 
     * @param {String} slug 
     * @return {Object}
     */
    async getMosaic(slug) {
        let ns = slug.replace(/:(.*)+$/, '');
        let mos = slug.replace(/^(.*)+:/, '');

        let ns_norm = ns.replace(/\./, '-');
        if (this.__ns_Discovery.hasOwnProperty(ns_norm))
            return this.__ns_Discovery[ns_norm];

        let url = "/namespace/mosaic/definition/page?namespace=" + ns;
        let body = undefined;
        let headers = {};

        let response = await this.get(url, body, headers);
        let parsed = JSON.parse(response);

        for (let i = 0; i < parsed.data.length; i++) {
            let row = parsed.data[i];

            if (row.mosaic.id.mosaicId === mos) {
                this.__ns_Discovery[ns_norm] = row;
                return row;
            }
        }

        // mosaic data NOT FOUND
        let data = {
            mosaic: {id: {namespaceId: ns, name: mos}},
            properties: [{name: "divisibility", value: 6}]
        };
        return data;
    }

    /**
     * Getter for the connected property.
     * 
     * @return {Boolean}
     */
    isConnected() {
        return this.connected;
    }

}

exports.NISWrapper = NISWrapper;
export default NISWrapper;
