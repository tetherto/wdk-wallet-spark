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

import WalletAccountReadOnlySpark from './wallet-account-read-only-spark.js'

import { SparkWallet, Network } from './libs/spark-sdk.js'

import Bip44SparkSigner from './bip-44/spark-signer.js'

import { BIP_44_LBTC_DERIVATION_PATH_PREFIX } from './bip-44/hd-keys-generator.js'

/** @typedef {import('@buildonspark/spark-sdk/types').WalletLeaf} WalletLeaf */
/** @typedef {import('@buildonspark/spark-sdk/types').CoopExitRequest} CoopExitRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningReceiveRequest} LightningReceiveRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningSendRequest} LightningSendRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').WalletTransfer} SparkTransfer */
/** @typedef {import('@buildonspark/spark-sdk/types').CoopExitFeeQuote} CoopExitFeeQuote */
/** @typedef {import('@buildonspark/spark-sdk').WithdrawParams} WithdrawParams */
/** @typedef {import('@buildonspark/spark-sdk').CreateLightningInvoiceParams} CreateLightningInvoiceParams */

/** @typedef {import('@sparkscan/api-node-sdk-client').TxV1Response} SparkTransactionReceipt */

/** @typedef {import('@tetherto/wdk-wallet').IWalletAccount} IWalletAccount */

/** @typedef {import('@tetherto/wdk-wallet').KeyPair} KeyPair */
/** @typedef {import('@tetherto/wdk-wallet').TransactionResult} TransactionResult */
/** @typedef {import('@tetherto/wdk-wallet').TransferOptions} TransferOptions */
/** @typedef {import('@tetherto/wdk-wallet').TransferResult} TransferResult */

/** @typedef {import('./wallet-account-read-only-spark.js').SparkTransaction} SparkTransaction */
/** @typedef {import('./wallet-account-read-only-spark.js').SparkWalletConfig} SparkWalletConfig */

/** @typedef {Omit<WithdrawParams, 'feeQuote'>} WithdrawOptions */

/**
 * @typedef {Object} QuoteWithdrawOptions
 * @property {string} to - The Bitcoin address where the funds should be sent.
 * @property {number} value - The amount in satoshis to withdraw.
 */

/**
 * @typedef {Object} PayLightningInvoiceOptions
 * @property {string} invoice - The BOLT11-encoded Lightning invoice to pay.
 * @property {number} maxFeeSats - The maximum fee in satoshis to pay.
 */

/**
 * @typedef {Object} GetLightningSendFeeEstimateOptions
 * @property {string} invoice - The BOLT11-encoded Lightning invoice to estimate fees for.
 */

/**
 * @typedef {Object} GetTransfersOptions
 * @property {"incoming" | "outgoing" | "all"} [direction] - If set, only returns transfers with the given direction (default: "all").
 * @property {number} [limit] - The number of transfers to return (default: 10).
 * @property {number} [skip] - The number of transfers to skip (default: 0).
 */

/**
 * @typedef {Object} RefundStaticDepositOptions
 * @property {string} depositTxId - The transaction ID of the original deposit.
 * @property {string} destinationAddress - The Bitcoin address to send the refund to.
 * @property {number} feeSats - The fee to pay for the refund transaction (minimum 300 sats).
 */

const DEFAULT_NETWORK = 'MAINNET'

/** @implements {IWalletAccount} */
export default class WalletAccountSpark extends WalletAccountReadOnlySpark {
  /**
   * Creates a new WalletAccountSpark instance.
   *
   * @param {SparkWallet} wallet - The underlying Spark wallet instance.
   * @param {SparkWalletConfig} [config] - The configuration object.
   */
  constructor (wallet, config = {}) {
    super(undefined, config)

    /** @private */
    this._wallet = wallet

    /** @private */
    this._signer = wallet.config.signer
  }

  /**
   * Creates a new spark wallet account.
   *
   * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
   * @param {number} index - The index of the account.
   * @param {SparkWalletConfig} [config] - The configuration object.
   * @returns {Promise<WalletAccountSpark>} The wallet account.
   */
  static async at (seed, index, config = {}) {
    const { wallet } = await SparkWallet.initialize({
      signer: new Bip44SparkSigner(index),
      mnemonicOrSeed: seed,
      options: {
        network: config.network || DEFAULT_NETWORK
      }
    })

    const account = new WalletAccountSpark(wallet, config)

    return account
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
   * @type {string}
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

    return { hash: id, fee: 0n }
  }

  /**
 * Transfers a token to another address.
 *
 * @param {TransferOptions} options - The transfer's options.
 * @returns {Promise<TransferResult>} The transfer's result.
 */
  async transfer (options) {
    const txId = await this._wallet.transferTokens({
      tokenIdentifier: options.tokenAddress,
      tokenAmount: BigInt(options.value),
      receiverSparkAddress: options.to
    })

    return { hash: txId, fee: 0n }
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
   * Gets static deposit address for bitcoin deposits from layer 1.
   * This address can be reused.
   *
   * @returns {Promise<string>} The static deposit address.
   */
  async getStaticDepositAddress () {
    return await this._wallet.getStaticDepositAddress()
  }

  /**
   * Gets all unused single-use deposit addresses.
   *
   * @returns {Promise<string[]>} List of unused deposit addresses.
   */
  async getUnusedDepositAddresses () {
    return await this._wallet.getUnusedDepositAddresses()
  }

  /**
   * Claims a deposit to the wallet.
   *
   * @param {string} txId - The transaction id of the deposit.
   * @returns {Promise<WalletLeaf[] | undefined>} The nodes resulting from the deposit.
   */
  async claimDeposit (txId) {
    return await this._wallet.claimDeposit(txId)
  }

  /**
   * Claims a static deposit to the wallet.
   *
   * @param {string} txId - The transaction id of the deposit.
   * @returns {Promise<WalletLeaf[] | undefined>} The nodes resulting from the deposit.
   */
  async claimStaticDeposit (txId) {
    const quote = await this._wallet.getClaimStaticDepositQuote(txId)

    return await this._wallet.claimStaticDeposit({
      transactionId: txId,
      creditAmountSats: quote.creditAmountSats,
      sspSignature: quote.signature
    })
  }

  /**
     * Refunds a deposit made to a static deposit address back to a specified Bitcoin address.
     * The minimum fee is 300 satoshis.
     *
     * @param {RefundStaticDepositOptions} options - The refund options.
     * @returns {Promise<string>} The refund transaction as a hex string that needs to be broadcast.
     */
  async refundStaticDeposit ({ depositTxId, destinationAddress, feeSats }) {
    return await this._wallet.refundStaticDeposit(depositTxId, destinationAddress, feeSats)
  }

  /**
   * Gets a fee quote for withdrawing funds from Spark to an on-chain Bitcoin address.
   *
   * @param {QuoteWithdrawOptions} options - The withdrawal's options.
   * @returns {Promise<CoopExitFeeQuote>} The withdrawal fee quote.
   */
  async quoteWithdraw ({ to, value }) {
    return await this._wallet.getWithdrawalFeeQuote({
      withdrawalAddress: to,
      amountSats: value
    })
  }

  /**
   * Initiates a withdrawal to move funds from the Spark network to an on-chain Bitcoin address.
   *
   * @param {WithdrawOptions} options - The withdrawal's options.
   * @returns {Promise<CoopExitRequest | null | undefined>} The withdrawal request details, or null/undefined if the request cannot be completed.
   */
  async withdraw ({ to, value }) {
    const exitFeeQuote = await this.quoteWithdraw({
      withdrawalAddress: to,
      amountSats: value
    })

    return await this._wallet.withdraw({
      onchainAddress: to,
      amountSats: value,
      feeQuote: exitFeeQuote,
      exitSpeed: 'MEDIUM'
    })
  }

  /**
   * Creates a Lightning invoice for receiving payments.
   *
   * @param {CreateLightningInvoiceParams} options - The invoice options.
   * @returns {Promise<LightningReceiveRequest>} BOLT11 encoded invoice.
   */
  async createLightningInvoice (options) {
    return await this._wallet.createLightningInvoice(options)
  }

  /**
   * Gets a Lightning receive request by id.
   *
   * @param {string} invoiceId - The id of the Lightning receive request.
   * @returns {Promise<LightningReceiveRequest | null>} The Lightning receive request.
   */
  async getLightningReceiveRequest (invoiceId) {
    return await this._wallet.getLightningReceiveRequest(invoiceId)
  }

  /**
   * Gets a Lightning send request by id.
   *
   * @param {string} requestId - The id of the Lightning send request.
   * @returns {Promise<LightningSendRequest | null>} The Lightning send request.
   */
  async getLightningSendRequest (requestId) {
    return await this._wallet.getLightningSendRequest(requestId)
  }

  /**
   * Pays a Lightning invoice.
   *
   * @param {PayLightningInvoiceOptions} options - The payment options.
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
   * @param {GetLightningSendFeeEstimateOptions} options - The fee estimation options.
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
   * @param {GetTransfersOptions} [options] - The options.
   * @returns {Promise<SparkTransfer[]>} The bitcoin transfers.
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
   * @returns {Promise<WalletAccountReadOnlySpark>} The read-only account.
   */
  async toReadOnlyAccount () {
    const address = await this.getAddress()

    const sparkReadOnlyAccount = new WalletAccountReadOnlySpark(address, this._config)

    return sparkReadOnlyAccount
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
   *
   * @returns {void}
   */
  dispose () {
    this.cleanupConnections().catch(console.error)

    this._signer.dispose()
  }
}
