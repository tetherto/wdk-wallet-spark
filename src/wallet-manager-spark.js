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

import WalletManager from '@wdk/wallet'

import WalletAccountSpark from './wallet-account-spark.js'

/** @typedef {import('@wdk/wallet').FeeRates} FeeRates */

/** @typedef {import('./wallet-account-read-only-spark.js').SparkWalletConfig} SparkWalletConfig */

export default class WalletManagerSpark extends WalletManager {
  /**
   * Creates a new wallet manager for the Spark blockchain.
   *
   * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   * @param {SparkWalletConfig} [config] - The configuration object.
   */
  constructor (seed, config = {}) {
    super(seed, config)
  }

  /**
   * Returns the wallet account at a specific index (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
   *
   * @example
   * // Returns the account with derivation path m/44'/998'/0'/0/1
   * const account = await wallet.getAccount(1);
   * @param {number} index - The index of the account to get (default: 0).
   * @returns {Promise<WalletAccountSpark>} The account.
   */
  async getAccount (index = 0) {
    if (!this._accounts[index]) {
      const account = await WalletAccountSpark.at(this.seed, index, this._config)

      this._accounts[index] = account
    }

    return this._accounts[index]
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
   * @returns {Promise<FeeRates>} The fee rates (in satoshis).
   */
  async getFeeRates () {
    return { normal: 0n, fast: 0n }
  }
}
