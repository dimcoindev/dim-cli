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

class Network {
    /**
     * Helper function to return the network name
     * for a given NEM Wallet Address `address`.
     * 
     * @param {String} address 
     * @return {String} 
     */
    static getNetworkForAddress(address)
    {
        let char = address.substr(0, 1);
        let nets = {
            "N": "mainnet",
            "T": "testnet"
        };

        if (nets.hasOwnProperty(char))
            return nets[char];

        // for non-recognized starting letter, use Mijin network
        return "mijin";
    }

    /**
     * Helper function to return the network ID
     * for a given NEM Wallet Address `address`
     * or a network name (testnet, mainnet, mijin)
     * 
     * @param {String} addressOrNetwork 
     * @return {String} 
     */
    static getNetworkId(addressOrNetwork) {
        switch (addressOrNetwork) {
            case 'mainnet':
            case 'testnet':
            case 'mijin' :
                return NEM.model.network.data[addressOrNetwork].id;

            default :
                break;
        }

        return Network.getNetworkId(Network.getNetworkForAddress(addressOrNetwork));
    }
}

exports.Network = Network;
export default Network;