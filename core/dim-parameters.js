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

/**
 * The DIMParameters class provides with an easy access to basic
 * informations about the DIM Ecosystem. This includes:
 *
 * - dimStartDate: The UTC timestamp of the DIM ecosystem genesis.
 * - dimNEMDate:  The NEM timestamp of the DIM ecosystem genesis.
 * - dimGenesisHeight: The NEM block height of the dim:coin mosaic creation transaction.
 * - dimGenesisTransactionId: The NEM transaction id of the dim:coin mosaic creation transaction.
 * - dimNetworkId: The NEM network id for the DIM Ecosystem.
 * - minTokenHolderShare: The minimum dim:token balance for the 30% levy token holder payouts.
 * - mosaicParameters["dim:coin"]: The dim:coin mosaic parameters (divisibility, supply, levy).
 * - mosaicParameters["dim:token"]: The dim:token mosaic parameters (divisibility, supply).
 * - mosaicParameters["dim:eur"]: The dim:eur mosaic parameters (divisibility, supply).
 *
 */
class DIMParameters {

    /**
     * Construct the Formatter object
     */
    constructor() {
        /**
         * DIM Genesis date is: Wed, 07 Jun 2017 12:30:05 GMT
         * 
         * @see [Transaction Log](http://hugealice.nem.ninja:7890/transaction/get?hash=dbe07d06b126196ee87d5bd7a10871caf3fd268d4db78eddac4ee309cae8b797)
         * @var {Integer}
         */
        this.dimStartDate = 69251020000 + (1427587585000); // DIM genesis (NEM genesis)

        /**
         * DIM Genesis date expressed as a NEM Timestamp.
         *
         * This is expressed *in seconds* since the NEM genesis.
         *
         * @var {Integer}
         */
        this.dimNEMDate = 69251020;

        /**
         * The dim:coin genesis block height.
         *
         * @see [Transaction Log](http://hugealice.nem.ninja:7890/transaction/get?hash=dbe07d06b126196ee87d5bd7a10871caf3fd268d4db78eddac4ee309cae8b797)
         * @var {Integer}
         */
        this.dimGenesisHeight = 1143525;

        /**
         * The dim:coin genesis transaction id.
         *
         * @see [Transaction Log](http://hugealice.nem.ninja:7890/transaction/get?hash=dbe07d06b126196ee87d5bd7a10871caf3fd268d4db78eddac4ee309cae8b797)
         * @var {Integer}
         */
        this.dimGenesisTransactionId = 810176;

        /**
         * The DIM Network ID.
         *
         * @var {Integer}
         */
        this.dimNetworkId = 104; // NEM Mainnet

        /**
         * Minimum MICRO TOKEN value to own in order to be accepted
         * in the 30 % Fee Payout.
         */
        this.minTokenHolderShare = 50 * Math.pow(10, 6);

        /**
         * This constitutes the base parameters of the said
         * mosaics of the DIM Ecosystem.
         */
        this.mosaicParameters = {
            "dim:coin": {
                "creator": "a1df5306355766bd2f9a64efdc089eb294be265987b3359093ae474c051d7d5a",
                "divisibility": 6,
                "totalSupply": 9000000000, // total of 9 billion dim:coin
                "levy": {
                    "type": 2, // 1 = Absolute, 2 = "Percentile"
                    "fee": 10, // for 1000 dim:coin, levy = 0.000001 dim:coin,
                    "recipient": "NCGGLVO2G3CUACVI5GNX2KRBJSQCN4RDL2ZWJ4DP"
                }
            },
            "dim:token": {
                "creator": "a1df5306355766bd2f9a64efdc089eb294be265987b3359093ae474c051d7d5a",
                "divisibility": 6, 
                "totalSupply": 10000000,  // total of 10 million dim:token
                "levy": null
            },
            "dim:eur": {
                "creator": "a1df5306355766bd2f9a64efdc089eb294be265987b3359093ae474c051d7d5a",
                "divisibility": 6, 
                "totalSupply": 10000000,  // total of 10 million dim:token
                "levy": null
            }
        };
    }

    getCoin() {
        return this.mosaicParameters["dim:coin"];
    }

    getToken() {
        return this.mosaicParameters["dim:token"];
    }

    getEur() {
        return this.mosaicParameters["dim:eur"];
    }

}

exports.DIMParameters = DIMParameters;
export default DIMParameters;
