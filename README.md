# DIM CLI - Command Line Interface - Open Source Tools for Developer and Exchanges

DIM CLI is a collection of command line tools for the DIM Ecosystem.

Exchanges and developers could easily use this package to watch/monitor addresses and create transactions on the NEM Blockchain for DIM assets such as DIM:COIN, it also includes a Command Line Blockchain Explorer.

This package aims to provide an easy to use Command Line Tools Suite for the DIM Ecosystem, suitable for exchanges to integrate DIM assets and developers that want to learn more about the NEM based DIM Ecosystem.

The command line tools suite is built as such that each script/command can be run in a single process using UNIX terminals. (A wrapper for MS Windows will be written soon)

Feel free to contribute wherever you think you can help! #DIMlovers much appreciated!

## Download & Installation

Run the following from the terminal:

```bash
$ git clone https://github.com/dimcoindev/dim-cli.git dim-cli/
$ cd dim-cli
$ npm install

# and to make it more comfortable
$ echo "alias dim-cli='./dim-cli'" >> ~/.bashrc 
$ source ~/.bashrc
```

You are now all set and you can use the dim-cli Package as described in the Usage section.

## Usage

There are multiple ways to interact with this command line tools suite. You can use `npm` to start the installation of the CLI Package and you can specify options, command and arguments to your command line call.

Here is a write-up of some examples for running the `dim-cli` command line tools suite:

```bash
$ dim-cli list
$ dim-cli api help
$ dim-cli wallet help
$ dim-cli explorer help
$ dim-cli finder help
$ dim-cli --help
```

or 

```bash
$ npm start list
$ npm start api  [arguments]
$ npm start wallet  [arguments]
```

## Examples

The following examples apply for the `dim-cli` command line tools suite:

```bash
$ dim-cli list
$ dim-cli api --help

# Simples use case (Current chain height)
$ dim-cli api --url /chain/height
$ dim-cli api --url /chain/height --network mainnet

# POST request example and GET with parameters
$ dim-cli api --url /block/at/public --post --json '{"height":1149971}'
$ dim-cli api --url /account/get?address=TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ

# Compare Chain Heights by switching Nodes:
$ dim-cli api --url /chain/height --node bigalice2.nem.ninja
$ dim-cli api --url /chain/height --node alice6.nem.ninja
$ dim-cli api --url /chain/height --node b1.nem.foundation --port 7895

# Use the headless wallet features
$ dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --balances --raw
$ dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --overview
$ dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --watch

# Use a simple terminal menu to interact with wallet
$ dim-cli wallet --file /home/you/Downloads/your.wlt
$ dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ

# Get dim:coin Network Levy informations
$ dim-cli explorer --networkFee
$ dim-cli explorer --payoutFee --raw

# Export token holders addresses and balances.
$ dim-cli finder
$ dim-cli finder --format csv
$ dim-cli finder --format xlsx

# Use API wrapper to read dim ecosystem origin transactions
$ dim-cli api --url /transaction/get?hash=dbe07d06b126196ee87d5bd7a10871caf3fd268d4db78eddac4ee309cae8b797 --network mainnet
```

in the love of DIM <3


## License

This software is released under the MIT License.

© 2018 DIM, All rights reserved.
