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

## Exchange integration Guide

You can use this package to integrate DIM into your exchange! Following is an example of how an exchange can use the DIM toolsuite to manage end-users funds:

### Step 1: DIM Deposits

The `dim:coin` Mosaic (asset on the NEM blockchain) has a `divisibility of 6`. As a result, you will always be working with *micro amounts*. Micro amounts are *the smallest possible unit of `dim:coin`*. This makes sure that we never work with floating point numbers and instead, **always use integers to represent `dim:coin` amounts**.

Following example will let you **monitor DIM Wallet addresses** on the NEM Blockchain. There is two commands included, the first lets you monitor *unconfirmed* transactions, those transactions should not be trusted as they do not include a confirmation yet. The second command lets you **monitor Deposits** on given DIM Wallets.

```bash
$ dim-cli api --url /account/unconfirmedTransactions?address=TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ
$ dim-cli api --url /account/transfers/incoming?address=TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ
```

There is another option for this which lets you **monitor addresses using Websocket connections**. This will give you the same data as the above example, but using Websockets:

```bash
$ dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --watch
```

### Step 2: DIM Withdrawals

Sending money on the NEM Blockchain containing DIM Assets can be done quite easily with this package too. NEM proposes very advanced features such as Multi-Signature Wallets to secure your funds, please have a read about *hot wallets* and *cold wallets* and also about *multi signature NEM accounts* before you store the funds of your platform in an insecure wallet.

Following commands will let you send a transaction on the NEM Blockchain containing DIM Assets such as `dim:coin` for example.

```bash
$ dim-cli wallet --address TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ --txReceiver TD2PEY23Y6O3LNGAO4YJYNDRQS3IRTEC7PZUIWLT --txMosaic dim:coin --txAmount 15
```

The example above would create a transaction **from TDWZ55R5VIHSH5WWK6CEGAIP7D35XVFZ3RU2S5UQ**, sending `15 dim:coin` **to TD2PEY23Y6O3LNGAO4YJYNDRQS3IRTEC7PZUIWLT**. You can use multiple `--txMosaic`, multiple `--txAmount` and also multiple `--txRawAmount`, this is to provide with more flexibility when working with either of v1 or v2 transactions on the NEM blockchain.

### Step 3: Security

Securing your funds from hackers is made easy with NEM's Multisignature Accounts and Transactions. You can read more about Multisignature Features on the NEM Blockchain in[this article](https://docs.nem.io/en/nanowallet/multisignature-multiuser).

It is recommended that you use Multisignature Accounts to secure your funds with
multiple private keys. On the NEM network, this means that you need to create
multiple Wallets. Following scenario is *safe* from hackers on the NEM network 
and recommended to manage DIM funds:

#### Security: Multisignature Wallets

- Create a premium wallet named *your-business-funds*
- Create a premium wallet named *your-business-CFO*
- Create a premium wallet named *your-business-manager*
- Create a premium wallet named *your-business-backup-account*

Now that you have created the 4 wallets, we will defined that the *your-business-funds* account is going to hold our funds and so, will be converted to a Multisignature account on the NEM network.

With one of the three other Accounts, you must now send a `MultisigAggregateModification` transaction to convert the *your-business-funds* account into a Multisignature account. For example, use the *your-business-CFO* account to issue a transaction as explained here: [NEM - Convert an account to multisignature](https://nemproject.github.io/#converting-an-account-to-a-multisig-account).

Our **recommended setup** uses a **2-of-3** multisignature configuration. This means that *for any transaction that is published with the* **your-business-funds** account, it will need a signature from at least *2 of the listed cosignatories* for the transaction to be accepted by the network. This gives you more security because the private key of the *your-business-funds* account is made obsolete and responsibility for the funds is separated on three different accounts, one of which (*your-business-backup-account*) can be used in case one of the 2 other listed cosignatories private keys is lost.

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
