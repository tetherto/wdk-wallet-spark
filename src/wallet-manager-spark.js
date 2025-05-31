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
import sodium from 'sodium-universal'
import * as bip39 from 'bip39'

import WalletAccountSpark from './wallet-account-spark.js'
import WalletSparkSigner from './wallet-spark-signer.js'

/**
 * @typedef {Object} SparkWalletConfig
 * @property {string} [network] - The network type; available values: "MAINNET", "REGTEST", "TESTNET" (default: "MAINNET").
 */

export default class WalletManagerSpark {
  #seedBuffer
  #config
  #accounts

  /**
   * Creates a new wallet manager for the Spark blockchain.
   *
   * @param {Uint8Array} seedBuffer - Uint8Array seedBuffer buffer.
   * @param {SparkWalletConfig} [config] - The configuration object.
   */
  constructor (seedBuffer, config = {}) {
    this.#seedBuffer = seedBuffer
    this.#accounts = new Set()

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
  * The seed of the wallet.
  *
  * @type {Uint8Array}
  */
  get seedBuffer () {
    return this.#seedBuffer
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
      mnemonicOrSeed: this.#seedBuffer,
      options: {
        network: this.#config.network
      }
    })

    const account = new WalletAccountSpark({ index, signer, wallet })
    this.#accounts.add(account)

    return account
  }

  /**
   * Returns the wallet account at a specific BIP-44 derivation path.
   *
   * @param {string} path - The derivation path (e.g. "0'/0/0").
   * @returns {Promise<WalletAccountSpark>} The account.
   */
  async getAccountByPath (path) {
    throw new Error('Method not supported on the spark blockchain.')
  }

  /**
   * Returns the current fee rates.
   *
   * @returns {Promise<{ normal: number, fast: number }>} The fee rates (in satoshis).
   */
  async getFeeRates () {
    return { normal: 0, fast: 0 }
  }

  /**
   * Close the wallet manager and erase the seed buffer.
   */
  close () {
    for (const account of this.#accounts) account.close()
    this.#accounts.clear()

    sodium.sodium_memzero(this.#seedBuffer)
    this.#seedBuffer = null
    this.#config = null
  }
}
