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

import { WalletAccountReadOnly } from '@wdk/wallet'

import { addressSummaryV1AddressAddressGet, getTransactionDetailsByIdV1TxTxidGet } from '@sparkscan/api-node-sdk-client'

/** @typedef {import('@buildonspark/spark-sdk').NetworkType} NetworkType */

/** @typedef {import('@sparkscan/api-node-sdk-client').TxV1Response} SparkTransactionReceipt */

/** @typedef {import('@wdk/wallet').TransactionResult} TransactionResult */
/** @typedef {import('@wdk/wallet').TransferOptions} TransferOptions */
/** @typedef {import('@wdk/wallet').TransferResult} TransferResult */

/**
 * @typedef {Object} SparkTransaction
 * @property {string} to - The transaction's recipient.
 * @property {number} value - The amount of bitcoins to send to the recipient (in satoshis).
 */

/**
 * @typedef {Object} SparkWalletConfig
 * @property {NetworkType} [network] - The network (default: "MAINNET").
 * @property {string} [sparkScanApiKey] - The spark scan api-key.
 */

export default class WalletAccountReadOnlySpark extends WalletAccountReadOnly {
  /**
   * Creates a new spark read-only wallet account.
   *
   * @param {string} address - The account's address.
   * @param {SparkWalletConfig} [config] - The configuration object.
   */
  constructor (address, config = {}) {
    super(address)

    /**
     * The read-only wallet account configuration.
     *
     * @protected
     * @type {SparkWalletConfig}
     */
    this._config = config
  }

  /**
   * Returns the account's bitcoin balance.
   *
   * @returns {Promise<bigint>} The bitcoin balance (in satoshis).
   */
  async getBalance () {
    const address = await this.getAddress()

    const { balance } = await addressSummaryV1AddressAddressGet(address, { network: this._config.network }, {
      headers: {
        'Authorization': this._config.sparkScanApiKey ? `Bearer ${this._config.sparkScanApiKey}` : undefined
      }
    })

    const btcHardBalanceSats = balance.btcHardBalanceSats

    return BigInt(btcHardBalanceSats)
  }

  /**
   * Returns the account balance for a specific token.
   *
   * @param {string} tokenAddress - The smart contract address of the token.
   * @returns {Promise<bigint>} The token balance (in base unit).
   */
  async getTokenBalance (tokenAddress) {
    throw new Error('Method not supported on the spark blockchain.')
  }

  /**
   * Quotes the costs of a send transaction operation.
   *
   * @param {SparkTransaction} tx - The transaction.
   * @returns {Promise<Omit<TransactionResult, 'hash'>>} The transaction's quotes.
   */
  async quoteSendTransaction (tx) {
    return { fee: 0n }
  }

  /**
   * Quotes the costs of a transfer operation.
   *
   * @param {TransferOptions} options - The transfer's options.
   * @returns {Promise<Omit<TransferResult, 'hash'>>} The transfer's quotes.
   */
  async quoteTransfer (options) {
    throw new Error('Method not supported on the spark blockchain.')
  }

  /**
   * Returns a transaction's receipt.
   *
   * @param {string} hash - The transaction's hash.
   * @returns {Promise<SparkTransactionReceipt | null>} The receipt, or null if the transaction has not been included in a block yet.
   */
  async getTransactionReceipt (hash) {
    try {
      const receipt = await getTransactionDetailsByIdV1TxTxidGet(hash, { network: this._config.network }, {
        headers: {
          'Authorization': this._config.sparkScanApiKey ? `Bearer ${this._config.sparkScanApiKey}` : undefined
        }
      })

      return receipt
    } catch (error) {
      if (error.status === 404) {
        return null
      }

      throw error
    }
  }
}
