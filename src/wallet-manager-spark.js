// Copyright 2024 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict'

import { SparkWallet } from '@buildonspark/spark-sdk'
import bip39 from 'bip39'

import WalletAccountSpark from './wallet-account-spark.js'
import WalletSparkSigner from './wallet-spark-signer.js'

/**
 * @typedef {Object} SparkWalletConfig
 * @property {string} [network] - The network type; available values: "MAINNET", "REGTEST", "TESTNET" (default: "MAINNET").
 */

export default class WalletManagerSpark {
  #seedPhrase
  #config

  /**
   * Creates a new wallet manager for the Spark blockchain.
   *
   * @param {string} seedPhrase - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   * @param {SparkWalletConfig} [config] - The configuration object.
   */
  constructor (seedPhrase, config = {}) {
    if (!WalletManagerSpark.isValidSeedPhrase(seedPhrase)) {
      throw new Error('The seed phrase is invalid.')
    }

    this.#seedPhrase = seedPhrase

    this.#config = {
      network: 'MAINNET',
      ...config
    }
  }

  /**
   * Returns a random [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   *
   * @returns {string} The seed phrase.
   */
  static getRandomSeedPhrase () {
    return bip39.generateMnemonic()
  }

  /**
   * Checks if a seed phrase is valid.
   *
   * @param {string} seedPhrase - The seed phrase.
   * @returns {boolean} True if the seed phrase is valid.
   */
  static isValidSeedPhrase (seedPhrase) {
    return bip39.validateMnemonic(seedPhrase)
  }

  /**
  * The seed phrase of the wallet.
  *
  * @type {string}
  */
  get seedPhrase () {
    return this.#seedPhrase
  }

  /**
   * Returns the wallet account at a specific index.
   *
   * @param {number} index - The index of the account to get (default: 0).
   * @returns {Promise<WalletAccountSpark>} The account.
   */
  async getAccount (index = 0) {
    const signer = new WalletSparkSigner(index)

    const { wallet } = await SparkWallet.initialize({
      signer,
      mnemonicOrSeed: this.#seedPhrase,
      options: {
        network: this.#config.network
      }
    })

    const account = new WalletAccountSpark({ index, signer, wallet })

    return account
  }
}
