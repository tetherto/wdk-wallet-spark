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

import WalletManager, { DisposalError, UnsupportedOperationError } from '@tetherto/wdk-wallet'
import WalletAccountSpark from './wallet-account-spark.js'

/** @typedef {import('@buildonspark/spark-sdk').SparkReadonlyClient} SparkReadonlyClient */

/** @typedef {import('@tetherto/wdk-wallet').FeeRates} FeeRates */

/** @typedef {import('./wallet-account-read-only-spark.js').SparkWalletConfig} SparkWalletConfig */

export default class WalletManagerSpark extends WalletManager {
  /**
   * Creates a new wallet manager for the Spark blockchain.
   *
   * @param {string | Uint8Array} seed - A [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) mnemonic seed phrase, or a raw BIP-32 master seed (16-64 bytes).
   * @param {SparkWalletConfig} [config] - The configuration object.
   */
  constructor (seed, config = {}) {
    super(seed, config)

    /**
     * A read-only Spark client shared with every account this manager creates, so two accounts
     * never open two clients for the same network.
     *
     * @protected
     * @type {SparkReadonlyClient}
     */
    this._client = WalletAccountSpark._buildClient(config)
  }

  /**
   * Returns the wallet account at a specific index (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
   *
   * @example
   * // Returns the account with derivation path m/44'/998'/0'/0/1
   * const account = await wallet.getAccount(1);
   * @param {number} index - The index of the account to get (default: 0).
   * @returns {Promise<WalletAccountSpark>} The account.
   * @throws {DisposalError} If the wallet manager has been disposed.
   */
  async getAccount (index = 0) {
    if (this.disposed) {
      throw new DisposalError('The wallet manager has been disposed.')
    }

    if (!this._accounts[index]) {
      const account = await WalletAccountSpark.at(this.seed, index, this._accountConfig())

      this._accounts[index] = account
    }

    return this._accounts[index]
  }

  /**
   * Builds the account config, injecting the manager's shared read-only client so accounts
   * reuse it instead of opening their own.
   *
   * @private
   * @returns {SparkWalletConfig} The account configuration.
   */
  _accountConfig () {
    return { ...this._config, client: this._client }
  }

  /**
   * Returns the wallet account at a specific BIP-44 derivation path.
   *
   * Not supported on spark: accounts are addressed by index only.
   *
   * @param {string} path - The derivation path (e.g. "0'/0/0").
   * @returns {Promise<WalletAccountSpark>} The account.
   * @throws {DisposalError} If the wallet manager has been disposed.
   * @throws {UnsupportedOperationError} Always (when not disposed) — the spark blockchain doesn't support derivation paths.
   */
  async getAccountByPath (path) {
    if (this.disposed) {
      throw new DisposalError('The wallet manager has been disposed.')
    }

    throw new UnsupportedOperationError('getAccountByPath(path)')
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
