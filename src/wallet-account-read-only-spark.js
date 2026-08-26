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

import { WalletAccountReadOnly, NoSuchElementError } from '@tetherto/wdk-wallet'

import { secp256k1 as curvesSecp256k1 } from '@noble/curves/secp256k1'
import { hexToBytes } from '@noble/curves/utils'
import { sha256 } from '@noble/hashes/sha2.js'

import { SparkReadonlyClient, decodeSparkAddress } from '#libs/spark-sdk'
import { SparkScanClient } from '#libs/sparkscan-client'

/** @typedef {import('@buildonspark/spark-sdk').NetworkType} NetworkType */
/** @typedef {import('@buildonspark/spark-sdk').SparkReadonlyClient} SparkReadonlyClient */
/** @typedef {import('@buildonspark/spark-sdk/proto/spark').Transfer} SparkTransfer */
/** @typedef {import('@buildonspark/spark-sdk/proto/spark').DepositAddressQueryResult} DepositAddressQueryResult */
/** @typedef {import('@buildonspark/spark-sdk/proto/spark').InvoiceResponse} InvoiceResponse */
/** @typedef {import('@buildonspark/spark-sdk').QueryDepositAddressesParams} QueryDepositAddressesParams */
/** @typedef {import('@buildonspark/spark-sdk').GetUtxosParams} GetUtxosParams */
/** @typedef {import('@buildonspark/spark-sdk').QuerySparkInvoicesParams} QuerySparkInvoicesParams */

/** @typedef {import('@tetherto/wdk-wallet').TransactionResult} TransactionResult */
/** @typedef {import('@tetherto/wdk-wallet').TransferOptions} TransferOptions */
/** @typedef {import('@tetherto/wdk-wallet').TransferResult} TransferResult */
/** @typedef {import('@tetherto/wdk-wallet').TransactionReceipt} TransactionReceipt */
/** @typedef {import('@tetherto/wdk-wallet').WaitForTransactionOptions} WaitForTransactionOptions */

/** @typedef {import('./libs/sparkscan-client.js').SparkScanConfig} SparkScanConfig */

/**
 * The Spark-specific fields added to a normalized transaction receipt.
 *
 * @typedef {Object} SparkTransactionDetails
 * @property {SparkTransfer} transfer - The native Spark transfer.
 */

const TRANSFER_STATUS_COMPLETED = 5
const TRANSFER_STATUS_EXPIRED = 6
const TRANSFER_STATUS_RETURNED = 7

/**
 * @typedef {Object} SparkTransaction
 * @property {string} to - The transaction's recipient.
 * @property {number | bigint} value - The amount of bitcoins to send to the recipient (in satoshis).
 */

/**
 * @typedef {Object} SparkWalletConfig
 * @property {NetworkType} [network] - The network (default: "MAINNET").
 * @property {SparkScanConfig} [sparkscan] - Optional sparkscan client config
 * @property {boolean} [syncAndRetry] - When true, failed sends and Lightning payments will automatically sync wallet state and retry once (default: false).
 * @property {boolean} [enableLogging] - When true, enable logging from within spark sdk (default: false).
 */

/**
 * @typedef {Object} GetTransfersOptions
 * @property {"incoming" | "outgoing" | "all"} [direction] - If set, only returns transfers with the given direction (default: "all").
 * @property {number} [limit] - The number of transfers to return (default: 10).
 * @property {number} [skip] - The number of transfers to skip (default: 0).
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
     * @type {SparkReadonlyClient}
     */
    this._client = SparkReadonlyClient.createPublic({
      network: this._config.network,
      log: this._config.enableLogging || false
    })

    /**
     * @protected
     * @type {SparkScanClient}
     */
    if (this._config.sparkscan) {
      this._sparkscan = new SparkScanClient({
        network: this._config.network,
        ...this._config.sparkscan
      })
    }
  }

  /**
   * Returns the account's available (non-pending) bitcoin balance.
   *
   * @returns {Promise<bigint>} The bitcoin balance (in satoshis).
   * @throws {ProviderError} If a sparkscan client is configured and sparkscan responds with an error status.
   */
  async getBalance () {
    const address = await this.getAddress()
    if (this._sparkscan) {
      const info = await this._sparkscan.getAddressInfo(address)
      return BigInt(info.balance.btcSoftBalanceSats)
    }
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
   * @deprecated Use {@link getTransaction} instead, which returns a normalized, finality-based receipt. The raw Spark transfer remains available on its `transfer` property.
   * @param {string} hash - The Spark transfer's ID.
   * @returns {Promise<SparkTransfer | null>} The Spark transfer, or null if not found.
   */
  async getTransactionReceipt (hash) {
    const transfers = await this._client.getTransfersByIds([hash])
    return transfers.length > 0 ? transfers[0] : null
  }

  /**
   * Returns a normalized, finality-based receipt for a Spark transfer. Only resolves Spark transfers, not on-chain Bitcoin transactions.
   *
   * Note: Spark has no `confirmed` step or executed-but-reverted result — a completed
   * transfer is `final` (success), while an expired or returned transfer is `dropped`.
   *
   * @param {string} hash - The Spark transfer's ID.
   * @returns {Promise<TransactionReceipt & SparkTransactionDetails>} The normalized receipt.
   * @throws {NoSuchElementError} If no transfer has been found for the given hash.
   */
  async getTransaction (hash) {
    const transfers = await this._client.getTransfersByIds([hash])

    if (transfers.length === 0) {
      throw new NoSuchElementError(`No transfer found for '${hash}'.`)
    }

    const transfer = transfers[0]

    let finality = 'pending'
    if (transfer.status === TRANSFER_STATUS_COMPLETED) {
      finality = 'final'
    } else if (transfer.status === TRANSFER_STATUS_EXPIRED || transfer.status === TRANSFER_STATUS_RETURNED) {
      finality = 'dropped'
    }

    return {
      hash,
      finality,
      success: finality === 'final' ? true : undefined,
      fee: 0n,
      transfer
    }
  }

  /**
   * Blocks until a transaction reaches a terminal state (the requested finality target or `dropped`), or times out.
   *
   * Note: an expired or returned transfer resolves to a `dropped` receipt; a genuinely
   * unknown transfer id stays not-found and results in a {@link TimeoutError}.
   *
   * @param {string} hash - The Spark transfer's ID.
   * @param {WaitForTransactionOptions} [options] - The wait options.
   * @returns {Promise<TransactionReceipt & SparkTransactionDetails>} The terminal receipt: the finality target reached (inspect `success` to tell success from revert), or `dropped`.
   * @throws {TimeoutError} If the target is not reached before the timeout.
   */
  async waitForTransaction (hash, options = {}) {
    return await super.waitForTransaction(hash, options)
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
   * @returns {Promise<SparkTransfer[]>} The Spark transfers.
   */
  async getTransfers (options = {}) {
    const { direction = 'all', limit = 10, skip = 0 } = options
    const address = await this.getAddress()
    const identityPubKey = direction !== 'all'
      ? hexToBytes(await this.getIdentityKey())
      : null

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
        : batch.filter(t => {
          const isIncoming = t.receiverIdentityPublicKey.equals(identityPubKey)
          return direction === 'incoming' ? isIncoming : !isIncoming
        })

      transfers.push(...filtered)
      offset += batchSize
    }

    return transfers.slice(skip, skip + limit)
  }

  /**
   * Returns unused single-use deposit addresses for the account.
   *
   * @param {Omit<QueryDepositAddressesParams, 'sparkAddress'>} [options] - The options.
   * @returns {Promise<{ depositAddresses: DepositAddressQueryResult[], offset: number }>} The unused deposit addresses.
   */
  async getUnusedDepositAddresses (options = {}) {
    const address = await this.getAddress()
    return await this._client.getUnusedDepositAddresses({
      sparkAddress: address,
      ...options
    })
  }

  /**
   * Returns all existing static deposit addresses for the account.
   *
   * @returns {Promise<DepositAddressQueryResult[]>} The static deposit addresses.
   */
  async getStaticDepositAddresses () {
    const address = await this.getAddress()
    return await this._client.getStaticDepositAddresses(address)
  }

  /**
   * Returns confirmed UTXOs for a specific deposit address.
   *
   * @param {GetUtxosParams} options - The options.
   * @returns {Promise<{ utxos: { txid: string, vout: number }[], offset: number }>} The UTXOs.
   */
  async getUtxosForDepositAddress (options) {
    return await this._client.getUtxosForDepositAddress(options)
  }

  /**
   * Queries the status of Spark invoices.
   *
   * @param {QuerySparkInvoicesParams} params - The query parameters.
   * @returns {Promise<{ invoiceStatuses: InvoiceResponse[], offset: number }>} The invoice statuses.
   */
  async getSparkInvoices (params) {
    return await this._client.getSparkInvoices(params)
  }
}
