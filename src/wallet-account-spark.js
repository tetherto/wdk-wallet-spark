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

import { getNetwork } from './utils.js'

import { BIP_44_LBTC_DERIVATION_PATH_PREFIX } from './bip-44/hd-keys-generator.js'

const Network = await getNetwork()

/** @typedef {import('./utils.js').SparkWallet} SparkWallet */
/** @typedef {import('@wdk/wallet').IWalletAccount} IWalletAccount */

/** @typedef {import('@wdk/wallet').KeyPair} KeyPair */
/** @typedef {import('@wdk/wallet').TransactionResult} TransactionResult */
/** @typedef {import('@wdk/wallet').TransferOptions} TransferOptions */
/** @typedef {import('@wdk/wallet').TransferResult} TransferResult */

/** @typedef {import('@buildonspark/spark-sdk/types').WalletLeaf} WalletLeaf */
/** @typedef {import('@buildonspark/spark-sdk/types').CoopExitRequest} CoopExitRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningReceiveRequest} LightningReceiveRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningSendRequest} LightningSendRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').WalletTransfer} SparkTransactionReceipt */

/**
 * @typedef {Object} SparkTransaction
 * @property {string} to - The transaction's recipient.
 * @property {number} value - The amount of bitcoins to send to the recipient (in satoshis).
 */

/** @implements {IWalletAccount} */
export default class WalletAccountSpark {
  /**
   * @package
   * @param {SparkWallet} wallet
   * */
  constructor (wallet) {
    /**
     * @private
     * @type {SparkWallet}
     * */
    this._wallet = wallet

    /** @private */
    this._signer = wallet.config.signer

    /** @private */
    this._disposed = false
  }

  /**
   * The derivation path's index of this account.
   *
   * @type {number}
   */
  get index () {
    return this._signer.index
  }

  /**
   * The derivation path of this account (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
   *
   * @returns {string} The derivation path.
   */
  get path () {
    const accountNumber = Network[this._wallet.config.config.network]

    return `${BIP_44_LBTC_DERIVATION_PATH_PREFIX}/${accountNumber}'/0/${this.index}`
  }

  /**
   * The account's key pair.
   *
   * @type {KeyPair}
   */
  get keyPair () {
    return {
      publicKey: this._signer.identityKey.publicKey,
      privateKey: this._signer.identityKey.privateKey
    }
  }

  /**
   * Returns the account's address.
   *
   * @returns {Promise<string>} The account's address.
   */
  async getAddress () {
    return await this._wallet.getSparkAddress()
  }

  /**
   * Signs a message.
   *
   * @param {string} message - The message to sign.
   * @returns {Promise<string>} The message's signature.
   */
  async sign (message) {
    return await this._wallet.signMessageWithIdentityKey(message)
  }

  /**
   * Verifies a message's signature.
   *
   * @param {string} message - The original message.
   * @param {string} signature - The signature to verify.
   * @returns {Promise<boolean>} True if the signature is valid.
   */
  async verify (message, signature) {
    return await this._wallet.validateMessageWithIdentityKey(message, signature)
  }

  /**
   * Sends a transaction.
   *
   * @param {SparkTransaction} tx - The transaction.
   * @returns {Promise<TransactionResult>} The transaction's result.
   */
  async sendTransaction ({ to, value }) {
    const { id } = await this._wallet.transfer({
      receiverSparkAddress: to,
      amountSats: value
    })

    return { hash: id, fee: 0 }
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
   * Transfers a token to another address.
   *
   * @param {TransferOptions} options - The transfer's options.
   * @returns {Promise<TransferResult>} The transfer's result.
   */
  async transfer (options) {
    throw new Error('Method not supported on the spark blockchain.')
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
    const { balance } = await this._wallet.getBalance()

    return Number(balance)
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
   * Returns a transaction's receipt.
   *
   * @param {string} hash - The transaction's hash.
   * @returns {Promise<SparkTransactionReceipt | null>} The receipt, or null if the transaction has not been included in a block yet.
   */
  async getTransactionReceipt (hash) {
    const transfer = await this._wallet.getTransfer(hash)

    return transfer ?? null
  }

  /**
   * Generates a single-use deposit address for bitcoin deposits from layer 1.
   * Once you deposit funds to this address, it cannot be used again.
   *
   * @returns {Promise<string>} The single-use deposit address.
   */
  async getSingleUseDepositAddress () {
    return await this._wallet.getSingleUseDepositAddress()
  }

  /**
   * Claims a deposit to the wallet.

   * @param {string} txId - The transaction id of the deposit.
   * @returns {Promise<WalletLeaf[] | undefined>} The nodes resulting from the deposit.
   */
  async claimDeposit (txId) {
    return await this._wallet.claimDeposit(txId)
  }

  /**
   * Checks for a confirmed deposit to the specified deposit address.
   *
   * @param {string} depositAddress - The deposit address to check.
   * @returns {Promise<string | null>} The transaction id if found, null otherwise.
   */
  async getLatestDepositTxId (depositAddress) {
    const utxos = await this._wallet.getUtxosForDepositAddress(depositAddress)

    if (utxos.length === 0) {
      return null
    }

    return utxos[0].txid
  }

  /**
   * Initiates a withdrawal to move funds from the Spark network to an on-chain Bitcoin address.
   *
   * @param {Object} options - The withdrawal's options.
   * @param {string} options.to - The Bitcoin address where the funds should be sent.
   * @param {number} options.value - The amount in satoshis to withdraw.
   * @returns {Promise<CoopExitRequest | null | undefined>} The withdrawal request details, or null/undefined if the request cannot be completed.
   */
  async withdraw ({ to, value }) {
    const exitFeeQuote = await this._wallet.getWithdrawalFeeQuote({
      amountSats: value,
      withdrawalAddress: to
    })
    return await this._wallet.withdraw({
      onchainAddress: to,
      feeQuote: exitFeeQuote,
      amountSats: value,
      exitSpeed: 'MEDIUM'
    })
  }

  /**
   * Creates a Lightning invoice for receiving payments.
   *
   * @param {Object} options - The invoice options.
   * @param {number} options.value - The amount in satoshis.
   * @param {string} [options.memo] - An optional description for the invoice.
   * @returns {Promise<LightningReceiveRequest>} BOLT11 encoded invoice.
   */
  async createLightningInvoice ({ value, memo }) {
    return await this._wallet.createLightningInvoice({
      amountSats: value,
      memo
    })
  }

  /**
   * Get a Lightning receive request by id.
   *
   * @param {string} invoiceId - The id of the Lightning receive request.
   * @returns {Promise<LightningReceiveRequest | null>} The Lightning receive request.
   */
  async getLightningReceiveRequest (invoiceId) {
    return await this._wallet.getLightningReceiveRequest(invoiceId)
  }

  /**
   * Pays a Lightning invoice.
   *
   * @param {Object} options - The payment options.
   * @param {string} options.invoice - The BOLT11-encoded Lightning invoice to pay.
   * @param {number} options.maxFeeSats - The maximum fee in satoshis to pay.
   * @returns {Promise<LightningSendRequest>} The Lightning payment request details.
   */
  async payLightningInvoice ({ invoice, maxFeeSats }) {
    return await this._wallet.payLightningInvoice({
      invoice,
      maxFeeSats
    })
  }

  /**
   * Gets fee estimate for sending Lightning payments.
   *
   * @param {Object} options - The fee estimation options.
   * @param {string} options.invoice - The BOLT11-encoded Lightning invoice to estimate fees for.
   * @returns {Promise<number>} Fee estimate for sending Lightning payments.
   */
  async getLightningSendFeeEstimate ({ invoice }) {
    return await this._wallet.getLightningSendFeeEstimate({
      encodedInvoice: invoice
    })
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

    let i = 0

    while (true) {
      const offset = i * (limit + skip)

      let { transfers: batch } = await this._wallet.getTransfers(limit + skip, offset)

      if (batch.length === 0) {
        break
      }

      if (direction !== 'all') {
        batch = batch.filter(({ transferDirection }) => direction === transferDirection.toLowerCase())
      }

      transfers.push(...batch)

      if (transfers.length >= limit + skip) {
        break
      }

      i++
    }

    const result = transfers.slice(skip, limit + skip)

    return result
  }

  /**
   * Returns a read-only copy of the account.
   *
   * @returns {Promise<never>} The read-only account.
   */
  async toReadOnlyAccount () {
    throw new Error('Read-only accounts not supported for the spark blockchain.')
  }

  /**
   * Cleans up and closes the connections with the spark blockchain.
   *
   * @returns {Promise<void>}
   */
  async cleanupConnections () {
    await this._wallet.cleanupConnections()
  }

  /**
   * Disposes the wallet account, erasing its private keys from the memory.
   */
  async dispose () {
    if (this._disposed) return // idempotent
    this._disposed = true

    // close network resources
    try { await this.cleanupConnections() } catch {}

    // zeroize key material if possible
    this._signer.dispose()

    // drop references
    this._wallet = undefined
    this._signer = undefined
  }
}
