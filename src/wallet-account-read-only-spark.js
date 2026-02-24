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

import { WalletAccountReadOnly } from '@tetherto/wdk-wallet'

import { SparkReadonlyClient, decodeSparkAddress } from '#libs/spark-sdk'
import { secp256k1 as curvesSecp256k1 } from '@noble/curves/secp256k1'
import { hexToBytes } from '@noble/curves/utils'
import { sha256 } from '@noble/hashes/sha2.js'

/** @typedef {import('@buildonspark/spark-sdk').NetworkType} NetworkType */
/** @typedef {import('@buildonspark/spark-sdk').TokenBalanceMap} TokenBalanceMap */

/** @typedef {import('@tetherto/wdk-wallet').TransactionResult} TransactionResult */
/** @typedef {import('@tetherto/wdk-wallet').TransferOptions} TransferOptions */
/** @typedef {import('@tetherto/wdk-wallet').TransferResult} TransferResult */

/**
 * @typedef {Object} SparkTransaction
 * @property {string} to - The transaction's recipient.
 * @property {number | bigint} value - The amount of bitcoins to send to the recipient (in satoshis).
 */

/**
 * @typedef {Object} SparkWalletConfig
 * @property {NetworkType} [network] - The network (default: "MAINNET").
 */

/**
 * @typedef {Object} GetTransfersOptions
 * @property {"incoming" | "outgoing" | "all"} [direction] - If set, only returns transfers with the given direction (default: "all").
 * @property {number} [limit] - The number of transfers to return (default: 10).
 * @property {number} [skip] - The number of transfers to skip (default: 0).
 */

/**
 * @typedef {Object} GetUnusedDepositAddressesOptions
 * @property {number} [limit] - The maximum number of addresses to return (default: 100).
 * @property {number} [offset] - The pagination offset (default: 0).
 */

/**
 * @typedef {Object} GetUtxosForDepositAddressOptions
 * @property {string} depositAddress - The Bitcoin deposit address to query.
 * @property {number} [limit] - The maximum number of UTXOs to return (default: 100).
 * @property {number} [offset] - The pagination offset (default: 0).
 * @property {boolean} [excludeClaimed] - If true, excludes already-claimed UTXOs.
 */

/**
 * @typedef {Object} GetSparkInvoicesOptions
 * @property {string[]} invoices - Array of Spark invoice strings to query.
 * @property {number} [limit] - The maximum number of results to return (default: 100).
 * @property {number} [offset] - The pagination offset (default: 0).
 */

export const DEFAULT_NETWORK = 'MAINNET'

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
    this._config = {
      ...config,
      network: config.network || DEFAULT_NETWORK
    }

    /**
     * The readonly client for querying wallet data.
     *
     * @protected
     */
    this._client = SparkReadonlyClient.createPublic({
      network: this._config.network
    })
  }

  /**
   * Returns the account's bitcoin balance.
   *
   * @returns {Promise<bigint>} The bitcoin balance (in satoshis).
   */
  async getBalance () {
    const address = await this.getAddress()
    return await this._client.getAvailableBalance(address)
  }

  /**
   * Returns the account balance for a specific token.
   *
   * @param {string} tokenAddress - The token identifier (Bech32m token identifier, e.g., `btkn1...`).
   * @returns {Promise<bigint>} The token balance (in base unit).
   */
  async getTokenBalance (tokenAddress) {
    const address = await this.getAddress()
    const balanceMap = await this._client.getTokenBalance(address, [tokenAddress])

    const entry = balanceMap.get(tokenAddress)
    return entry ? entry.availableToSendBalance : 0n
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
    return { fee: 0n }
  }

  /**
   * Returns a Spark transfer by its ID. Only returns Spark transfers, not on-chain Bitcoin transactions.
   *
   * @param {string} hash - The Spark transfer's ID.
   * @returns {Promise<Object | null>} The Spark transfer, or null if not found.
   */
  async getTransactionReceipt (hash) {
    const transfers = await this._client.getTransfersByIds([hash])
    return transfers.length > 0 ? transfers[0] : null
  }

  /**
   * Returns the account's identity public key.
   *
   * @returns {Promise<string>} The identity public key (hex-encoded).
   */
  async getIdentityKey () {
    const address = await this.getAddress()
    const { identityPublicKey } = decodeSparkAddress(address, this._config.network)

    return identityPublicKey
  }

  /**
   * Verifies a message's signature.
   *
   * @param {string} message - The original message.
   * @param {string} signature - The signature to verify (hex-encoded, DER or compact).
   * @returns {Promise<boolean>} True if the signature is valid.
   */
  async verify (message, signature) {
    const identityPublicKey = await this.getIdentityKey()

    const hash = sha256(Buffer.from(message, 'utf8'))
    const sigBytes = hexToBytes(signature)
    const pubKeyBytes = hexToBytes(identityPublicKey)

    return curvesSecp256k1.verify(sigBytes, hash, pubKeyBytes)
  }

  /**
   * Returns the Spark transfer history of the account. Only returns Spark transfers, not on-chain Bitcoin transactions.
   *
   * @param {GetTransfersOptions} [options] - The options.
   * @returns {Promise<Array>} The Spark transfers.
   */
  async getTransfers (options = {}) {
    const { direction = 'all', limit = 10, skip = 0 } = options
    const address = await this.getAddress()

    const batchSize = limit + skip
    const transfers = []
    let offset = 0

    while (transfers.length < batchSize) {
      const { transfers: batch } = await this._client.getTransfers({
        sparkAddress: address,
        limit: batchSize,
        offset
      })

      if (batch.length === 0) break

      const filtered = direction === 'all'
        ? batch
        : batch.filter(({ transferDirection }) => direction === transferDirection.toLowerCase())

      transfers.push(...filtered)
      offset += batchSize
    }

    return transfers.slice(skip, skip + limit)
  }

  /**
   * Returns unused single-use deposit addresses for the account.
   *
   * @param {GetUnusedDepositAddressesOptions} [options] - The options.
   * @returns {Promise<{ depositAddresses: Array, offset: number }>} The unused deposit addresses.
   */
  async getUnusedDepositAddresses (options = {}) {
    const address = await this.getAddress()
    return await this._client.getUnusedDepositAddresses({
      sparkAddress: address,
      ...options
    })
  }

  /**
   * Returns all static deposit addresses for the account.
   *
   * @returns {Promise<Array>} The static deposit addresses.
   */
  async getStaticDepositAddresses () {
    const address = await this.getAddress()
    return await this._client.getStaticDepositAddresses(address)
  }

  /**
   * Returns confirmed UTXOs for a specific deposit address.
   *
   * @param {GetUtxosForDepositAddressOptions} options - The options.
   * @returns {Promise<{ utxos: Array<{ txid: string, vout: number }>, offset: number }>} The UTXOs.
   */
  async getUtxosForDepositAddress (options) {
    return await this._client.getUtxosForDepositAddress(options)
  }

  /**
   * Queries the status of Spark invoices.
   *
   * @param {GetSparkInvoicesOptions} params - The query parameters.
   * @returns {Promise<{ invoiceStatuses: Array, offset: number }>} The invoice statuses.
   */
  async getSparkInvoices (params) {
    return await this._client.getSparkInvoices(params)
  }
}
