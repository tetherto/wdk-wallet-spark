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

import WalletManager, { WalletAccountReadOnly } from '@wdk/wallet'
import { SparkWallet } from '@buildonspark/spark-sdk'
import { addressSummaryV1AddressAddressGet, getLatestTransactionsV1TxLatestGet, getTransactionDetailsByIdV1TxTxidGet } from '@sparkscan/api-node-sdk-client'

/** @typedef {import('@buildonspark/spark-sdk').NetworkType} NetworkType */

/** @typedef {import('@sparkscan/api-node-sdk-client').GetTransactionDetailsByIdV1TxTxidGet200} SparkTransactionReceipt */

/** @typedef {import('@wdk/wallet').TransactionResult} TransactionResult */
/** @typedef {import('@wdk/wallet').TransferOptions} TransferOptions */
/** @typedef {import('@wdk/wallet').TransferResult} TransferResult */

/**
 * @typedef {Object} SparkWalletConfig
 * @property {NetworkType} [network] - The network (default: "MAINNET").
 * @property {string} [sparkScanApiKey] - The SparkScan API key.
 */

/**
 * @typedef {Object} SparkTransaction
 * @property {string} to - The transaction's recipient.
 * @property {number} value - The amount of bitcoins to send to the recipient (in satoshis).
 */

const SUPPORTED_TRANSACTION_TYPES = ['bitcoin_deposit', 'bitcoin_withdrawal', 'spark_transfer', 'lightning_payment']

class WalletAccountReadOnlySpark extends WalletAccountReadOnly {
  /**
    * Creates a new spark read-only wallet account.
    *
    * @param {string} address - The account's address.
    * @param {SparkWalletConfig} [config] - The configuration object.
    */
  constructor (address, config = {}) {
    super(address)

    /** @protected
     * @type {SparkWalletConfig}
     */
    this._config = config

    /** @private
     * @type {Promise<SparkWallet>}
     */
    this._wallet = SparkWallet.initialize({
      mnemonicOrSeed: WalletManager.getRandomSeedPhrase(),
      options: {
        network: config?.network || 'MAINNET'
      }
    }).then(({ wallet }) => wallet)
  }

  /**
   * Quotes the costs of a send transaction operation.
   *
   * @see {sendTransaction}
   * @param {SparkTransaction} tx - The transaction.
   * @returns {Promise<Omit<TransactionResult, 'hash'>>} The transaction's quotes.
   */
  async quoteSendTransaction ({ to, value }) {
    return { fee: 0 }
  }

  /**
   * Quotes the costs of a transfer operation.
   *
   * @see {transfer}
   * @param {TransferOptions} options - The transfer's options.
   * @returns {Promise<Omit<TransferResult, 'hash'>>} The transfer's quotes.
   */
  async quoteTransfer (options) {
    throw new Error('Method not supported on the spark blockchain.')
  }

  /**
   * Returns the account's bitcoin balance.
   *
   * @returns {Promise<number>} The bitcoin balance (in satoshis).
   */
  async getBalance () {
    try {
      const { balance } = await addressSummaryV1AddressAddressGet(this._address, {
        network: this._config.network
      }, {
        headers: {
          Authorization: this._config.sparkScanApiKey ? `Bearer ${this._config.sparkScanApiKey}` : undefined
        }
      })

      return balance.btcHardBalanceSats
    } catch (error) {
      throw new Error('Get balance failed.')
    }
  }

  /**
   * Returns the account balance for a specific token.
   *
   * @param {string} tokenAddress - The smart contract address of the token.
   * @returns {Promise<number>} The token balance.
   */
  async getTokenBalance (tokenAddress) {
    throw new Error('Method not supported on the spark blockchain.')
  }

  /**
   * Gets fee estimate for sending Lightning payments.
   *
   * @param {Object} options - The fee estimation options.
   * @param {string} options.invoice - The BOLT11-encoded Lightning invoice to estimate fees for.
   * @returns {Promise<number>} Fee estimate for sending Lightning payments.
   */
  async getLightningSendFeeEstimate ({ invoice }) {
    const wallet = await this._wallet

    return await wallet.getLightningSendFeeEstimate({ encodedInvoice: invoice })
  }

  /**
   * Generates a single-use deposit address for bitcoin deposits from layer 1.
   * Once you deposit funds to this address, it cannot be used again.
   *
   * @returns {Promise<string>} The single-use deposit address.
   */
  async getSingleUseDepositAddress () {
    throw new Error('Get single use deposit address is not supported in read-only account')
  }

  /**
   * Returns a transaction's receipt.
   *
   * @param {string} hash - The transaction's hash.
   * @returns {Promise<SparkTransactionReceipt | null>} The receipt, or null if the transaction has not been included in a block yet.
   */
  async getTransactionReceipt (hash) {
    try {
      return await getTransactionDetailsByIdV1TxTxidGet(hash, {
        network: this._config.network
      }, {
        headers: {
          Authorization: this._config.sparkScanApiKey ? `Bearer ${this._config.sparkScanApiKey}` : undefined
        }
      })
    } catch (error) {
      throw new Error('Get transaction receipt failed.')
    }
  }

  /**
   * Returns confirmed UTXOs for a given Spark deposit address.
   *
   * @param {string} depositAddress - The deposit address to query.
   * @param {number} limit - Maximum number of UTXOs to return (default 100).
   * @param {number} offset - Pagination offset (default 0).
   * @returns {Promise<string[]>} List of confirmed UTXOs.
   */
  async getUtxosForDepositAddress (depositAddress, limit, offset) {
    throw new Error('Get utxos for deposit address is not supported in read-only account')
  }

  /**
   * Get a Lightning receive request by id.
   *
   * @param {string} invoiceId - The id of the Lightning receive request.
   * @returns {Promise<LightningReceiveRequest | null>} The Lightning receive request.
   */
  async getLightningReceiveRequest (invoiceId) {
    throw new Error('Get Lightning receive request is not supported in read-only account')
  }

  /**
   * Returns the bitcoin transfer history of the account.
   *
   * @param {Object} [options] - The options.
   * @param {"incoming" | "outgoing" | "all"} [options.direction] - If set, only returns transfers with the given direction (default: "all").
   * @param {number} [options.limit] - The number of transfers to return (default: 10).
   * @param {number} [options.skip] - The number of transfers to skip (default: 0).
   * @returns {Promise<SparkTransactionReceipt[]>} The bitcoin transfers.
   */
  async getTransfers (options = {}) {
    const { direction = 'all', limit = 10, skip = 0 } = options

    const transfers = []

    for (let i = 0; transfers.length < limit + skip; i++) {
      const offset = i * (limit + skip)

      let batch = await getLatestTransactionsV1TxLatestGet({
        limit: limit + skip,
        offset,
        network: this._config.network
      }, {
        headers: {
          Authorization: this._config.sparkScanApiKey ? `Bearer ${this._config.sparkScanApiKey}` : undefined
        }
      })

      if (batch.length === 0) {
        break
      }

      batch = batch.filter(({ type }) => SUPPORTED_TRANSACTION_TYPES.includes(type))

      if (direction !== 'all') {
        batch = batch.filter(({ from, to }) => {
          const isOutgoing = direction === 'outgoing'
          return isOutgoing ? from.identifier === this._address : to.identifier === this._address
        })
      }

      transfers.push(...batch)
    }

    return transfers.slice(skip, limit + skip)
  }
}

export default WalletAccountReadOnlySpark
