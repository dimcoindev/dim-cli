# dimcoin/dim-cli

dim-cli is a collection of command line tools useful when working with the DIM Blockchain using the Terminal.

This package aims to provide an easy to use Command Line Tools Suite for the DIM Ecosystem.

The command line tools suite is built such that each script/command can be run in a single process using UNIX terminals. (A wrapper for MS Windows will be written soonish)

Feel free to contribute wherever you think you can help! DIMlovers much appreciated!

## Download & Installation

Run the following from the terminal:

```bash
$ git clone https://bitbucket.org/gregevs/dim-cli.git dim-cli/
$ cd dim-cli
$ npm install

# and to make it more comfortable
$ echo "alias dim-cli='./dim-cli'" >> ~/.bashrc 
$ source ~/.bashrc
```

You are now all set and you can use the dim-cli Package as described in the Usage section.

## Usage

There is multiple ways to interact with this command line tools suite. You can use `npm` to start your instance the CLI and you can specify options, command and arguments to your command line call.

Here is a write-up of some examples for running the `dim-cli` command line tools suite:

```bash
$ dim-cli list
$ dim-cli api [arguments]
$ dim-cli wallet [arguments]
$ dim-cli --help
```

or 

```bash
$ npm start list
$ npm start api  [arguments]
$ npm start wallet  [arguments]
```

.. or

```bash
$ ./babel-node dim-cli list
$ ./babel-node dim-cli api [arguments]
$ ./babel-node dim-cli wallet [arguments]
$ ./babel-node dim-cli --help
```

## Examples

Following examples apply for the `dim-cli` command line tools suite:

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
```

in the love of DIM <3

## License

This software is released under the MIT License.

© 2018 DIMCoin Developers, All rights reserved.
