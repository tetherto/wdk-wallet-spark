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

import { MaximumFeeExceededError, UnsupportedOperationError, ValueError } from '@tetherto/wdk-wallet'

import WalletAccountReadOnlySpark, { DEFAULT_NETWORK } from './wallet-account-read-only-spark.js'

import { SparkWallet, Network, SparkError, ValidationError, decodeSparkAddress, generateTransferId } from '#libs/spark-sdk'

import Bip44SparkSigner from './bip-44/spark-signer.js'

import { BIP_44_LBTC_DERIVATION_PATH_PREFIX } from './bip-44/hd-keys-generator.js'

import {
  LightningPaymentError,
  StaticDepositClaimOutcomeUnknownError,
  StaticDepositFeeExceededError
} from './errors.js'

/** @typedef {import('@buildonspark/spark-sdk/types').WalletLeaf} WalletLeaf */
/** @typedef {import('@buildonspark/spark-sdk/types').CoopExitRequest} CoopExitRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningReceiveRequest} LightningReceiveRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningSendRequest} LightningSendRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').CoopExitFeeQuote} CoopExitFeeQuote */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningSendFeeEstimateInput} LightningSendFeeEstimateInput */
/** @typedef {import('@buildonspark/spark-sdk').WithdrawParams} WithdrawParams */
/** @typedef {import('@buildonspark/spark-sdk').CreateLightningInvoiceParams} CreateLightningInvoiceParams */
/** @typedef {import('@buildonspark/spark-sdk').PayLightningInvoiceParams} PayLightningInvoiceParams */
/** @typedef {import('@buildonspark/spark-sdk').SparkAddressFormat} SparkAddressFormat */
/** @typedef {import('@buildonspark/spark-sdk').FulfillSparkInvoiceResponse} FulfillSparkInvoiceResponse */
/** @typedef {import('@buildonspark/spark-sdk').SparkValidationError} SparkValidationError */

/** @typedef {import('@tetherto/wdk-wallet').IWalletAccount} IWalletAccount */

/** @typedef {import('@tetherto/wdk-wallet').KeyPair} KeyPair */
/** @typedef {import('@tetherto/wdk-wallet').TransactionResult} TransactionResult */
/** @typedef {import('@tetherto/wdk-wallet').TransferOptions} TransferOptions */
/** @typedef {import('@tetherto/wdk-wallet').TransferResult} TransferResult */

/** @typedef {import('./wallet-account-read-only-spark.js').SparkTransaction} SparkTransaction */
/** @typedef {import('./wallet-account-read-only-spark.js').SparkWalletConfig} SparkWalletConfig */

/** @typedef {Omit<WithdrawParams, 'feeQuote'>} WithdrawOptions */

/**
 * @typedef {Object} ClaimStaticDepositResult
 * @property {string} transferId - The Spark transfer ID created by the claim.
 */

/**
 * @typedef {Object} ClaimStaticDepositQuoteOptions
 * @property {string} txId - The transaction ID of the deposit.
 * @property {number} depositAmountSats - The caller-provided amount of the Bitcoin deposit output.
 * @property {number} [outputIndex] - The output index of the deposit. The Spark SDK detects it when omitted.
 */

/**
 * @typedef {Object} ClaimStaticDepositQuote
 * @property {string} transactionId - The transaction ID returned by the SSP quote.
 * @property {number} outputIndex - The resolved output index returned by the SSP quote.
 * @property {number} depositAmountSats - The caller-provided amount of the Bitcoin deposit output.
 * @property {number} creditAmountSats - The amount the SSP quoted for credit to Spark.
 * @property {number} claimFeeSats - The difference between the caller-provided deposit amount and quoted credit.
 */

/**
 * @typedef {Object} ClaimStaticDepositWithMaxFeeOptions
 * @property {string} txId - The transaction ID of the deposit.
 * @property {number} maxFeeSats - The maximum claim fee approved by the caller.
 * @property {number} [outputIndex] - The output index of the deposit. The Spark SDK detects it when omitted.
 */

/**
 * @typedef {Object} QuoteWithdrawOptions
 * @property {string} withdrawalAddress - The Bitcoin address where the funds should be sent.
 * @property {number} amountSats - The amount in satoshis to withdraw.
 */

/**
 * @typedef {Object} RefundStaticDepositOptions
 * @property {string} depositTransactionId - The transaction ID of the original deposit.
 * @property {number} outputIndex - The output index of the deposit.
 * @property {string} destinationAddress - The Bitcoin address to send the refund to.
 * @property {number} satsPerVbyteFee - The fee rate in sats per vbyte for the refund transaction.
 */

/**
 * @typedef {Object} CreateSatsInvoiceOptions
 * @property {number} [amount] - The amount of sats to receive (optional for open invoices).
 * @property {string} [memo] - Optional memo/description for the payment.
 * @property {SparkAddressFormat} [senderSparkAddress] - Optional Spark address of the expected sender.
 * @property {Date} [expiryTime] - Optional expiry time for the invoice.
 */

/**
 * @typedef {Object} CreateTokensInvoiceOptions
 * @property {string} [tokenIdentifier] - The Bech32m token identifier (e.g., `btkn1...`).
 * @property {bigint} [amount] - The amount of tokens to receive.
 * @property {string} [memo] - Optional memo/description for the payment.
 * @property {SparkAddressFormat} [senderSparkAddress] - Optional Spark address of the expected sender.
 * @property {Date} [expiryTime] - Optional expiry time for the invoice.
 */

/**
 * @typedef {Object} SparkInvoice
 * @property {SparkAddressFormat} invoice - The Spark invoice to pay.
 * @property {bigint} [amount] - Amount to pay (required for invoices without encoded amount).
 */

const TRANSFER_LOOKUP_PAGE_SIZE = 20
const TRANSFER_LOOKUP_MAX_PAGES = 5

const STALE_LEAF_ERROR_FRAGMENTS = [
  'not available to transfer',
  'not owned by',
  'leaf is unavailable',
  'leaf is not available'
]

const WALLET_TRANSFER_STATUS_EXPIRED = 'TRANSFER_STATUS_EXPIRED'
const WALLET_TRANSFER_STATUS_RETURNED = 'TRANSFER_STATUS_RETURNED'

function isExpiredOrReturnedStatus (status) {
  return (
    status === WALLET_TRANSFER_STATUS_EXPIRED ||
    status === WALLET_TRANSFER_STATUS_RETURNED
  )
}

function isCreditAmountInSats (amount) {
  return Number.isSafeInteger(amount) && amount > 0
}

function isNonNegativeAmountInSats (amount) {
  return Number.isSafeInteger(amount) && amount >= 0
}

function isOutputIndex (outputIndex) {
  return Number.isSafeInteger(outputIndex) && outputIndex >= 0
}

function isClaimStaticDepositResult (result) {
  return typeof result?.transferId === 'string' && result.transferId.trim().length > 0
}

function getFeeChargedFromError (error) {
  if (!(error instanceof ValidationError)) {
    return undefined
  }

  const context = error.getContext()

  if (context.field !== 'feeCharged' || !isNonNegativeAmountInSats(context.value)) {
    return undefined
  }

  return context.value
}

function getWithdrawalFeeSats (feeQuote, exitSpeed) {
  switch (exitSpeed) {
    case 'FAST':
      return (feeQuote?.l1BroadcastFeeFast?.originalValue || 0) + (feeQuote?.userFeeFast?.originalValue || 0)
    case 'MEDIUM':
      return (feeQuote?.l1BroadcastFeeMedium?.originalValue || 0) + (feeQuote?.userFeeMedium?.originalValue || 0)
    case 'SLOW':
      return (feeQuote?.l1BroadcastFeeSlow?.originalValue || 0) + (feeQuote?.userFeeSlow?.originalValue || 0)
    default:
      throw new ValueError('Invalid exit speed.')
  }
}

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
   * @param {string | Uint8Array} seed - A [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) mnemonic seed phrase, or a raw BIP-32 master seed (16-64 bytes).
   * @param {number} index - The index of the account.
   * @param {SparkWalletConfig} [config] - The configuration object.
   * @returns {Promise<WalletAccountSpark>} The wallet account.
   */
  static async at (seed, index, config = {}) {
    const network = config.network || DEFAULT_NETWORK
    const options = {
      signer: new Bip44SparkSigner(index),
      mnemonicOrSeed: seed,
      options: {
        network,
        log: config.enableLogging || false
      }
    }
    const { wallet } = await SparkWallet.getOrCreateWallet(options)

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
    const networkId = Network[this._wallet.config.config.network]

    return `${BIP_44_LBTC_DERIVATION_PATH_PREFIX}/${networkId}'/0/${this.index}`
  }

  /**
   * The account's key pair.
   *
   * The uint8 arrays are bound to the wallet account, so any external change will reflect to the internal representation. For this reason,
   * it's strongly recommended to treat the key pair as a read-only view of the keys. While it's still technically possible to alter their
   * content, client code should never do so.
   *
   * @type {KeyPair}
   */
  get keyPair () {
    return {
      publicKey: this._signer.identityKey.publicKey,
      privateKey: this._signer.identityKey.privateKey ?? null
    }
  }

  /**
   * Returns the account's Spark address.
   *
   * @returns {Promise<SparkAddressFormat>} The account's Spark address.
   */
  async getAddress () {
    return await this._wallet.getSparkAddress()
  }

  /**
   * Returns the account's total (available + locked in outgoing transfer) bitcoin balance.
   *
   * @returns {Promise<bigint>} The bitcoin balance (in satoshis).
   * @throws {ProviderError} If a sparkscan client is configured and sparkscan responds with an error status.
   */
  async getBalance () {
    if (this._sparkscan) {
      const info = await this._sparkscan.getAddressInfo(await this.getAddress())
      return BigInt(info.balance.btcSoftBalanceSats)
    }
    const { satsBalance: { owned } } = await this._wallet.getBalance()

    return owned
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
   * Signs a transaction.
   *
   * Not supported on spark: transfers are signed collaboratively with the spark operators
   * via a FROST / Statechain protocol, so a signed payload cannot be produced locally and
   * broadcast independently. Use `sendTransaction` instead.
   *
   * @param {SparkTransaction} tx - The transaction.
   * @returns {Promise<never>} Never resolves; always throws.
   * @throws {UnsupportedOperationError} Always — spark transfers cannot be signed locally.
   */
  async signTransaction (tx) {
    throw new UnsupportedOperationError('signTransaction(tx)')
  }

  /**
   * Sends a transaction.
   *
   * When `syncAndRetry` is true, the transaction is submitted at most once: if the send
   * fails, the account reconciles against transfer history and returns the transfer that
   * reached the network, so a lost response is never paid twice. Concurrent identical
   * sends (same amount and recipient) from one wallet cannot be told apart, so callers
   * should not run those payments in parallel.
   *
   * @param {SparkTransaction} tx - The transaction.
   * @returns {Promise<TransactionResult>} The transaction's result.
   * @throws {SparkValidationError} When `syncAndRetry` is true and the recipient address is not valid for the wallet's network.
   * @throws {SparkError} When `syncAndRetry` is true and the transfer history cannot be read. The transaction is not submitted.
   * @throws {SparkError} If the send fails and no matching transfer appears in history.
   */
  async sendTransaction ({ to, value }) {
    const params = { receiverSparkAddress: to, amountSats: Number(value) }

    if (!this._config.syncAndRetry) {
      const { id } = await this._wallet.transfer(params)
      return { hash: id, fee: 0n }
    }

    const priorIds = new Set(
      (await this._listMatchingOutgoingTransfers(params)).map(transfer => transfer.id)
    )

    try {
      const { id } = await this._wallet.transfer(params)
      return { hash: id, fee: 0n }
    } catch (error) {
      await this.syncWalletBalance()

      let existing
      try {
        existing = await this._findOutgoingTransfer(params, priorIds)
      } catch (lookupError) {
        if (!(lookupError instanceof SparkError)) throw lookupError
        throw error
      }

      if (existing) {
        return { hash: existing.id, fee: 0n }
      }

      throw error
    }
  }

  /**
   * Transfers a token to another address.
   *
   * @param {TransferOptions} options - The transfer's options.
   * @returns {Promise<TransferResult>} The transfer's result.
   */
  async transfer (options) {
    const txId = await this._wallet.transferTokens({
      tokenIdentifier: options.token,
      tokenAmount: BigInt(options.amount),
      receiverSparkAddress: options.recipient
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
   * Returns a static deposit address for Bitcoin deposits from layer 1,
   * generating one if it does not already exist. The address is reusable.
   *
   * @returns {Promise<string>} The static deposit address.
   */
  async getStaticDepositAddress () {
    return await this._wallet.getStaticDepositAddress()
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
   * Gets the SSP credit quote for a static deposit and calculates its fee from
   * the caller-provided Bitcoin output amount.
   *
   * The deposit amount is not verified by this method. Callers must use the
   * amount of the exact Bitcoin output identified by `txId` and `outputIndex`.
   *
   * @param {ClaimStaticDepositQuoteOptions} options - The quote options.
   * @returns {Promise<ClaimStaticDepositQuote>} The static-deposit claim quote.
   * @throws {ValueError} If the caller-provided deposit amount or SSP-quoted credit is invalid.
   */
  async getClaimStaticDepositQuote (options) {
    if (!isCreditAmountInSats(options.depositAmountSats)) {
      throw new ValueError('The static deposit amount must be a safe positive integer number of satoshis.')
    }

    const quote = await this._wallet.getClaimStaticDepositQuote(options.txId, options.outputIndex)

    if (!isCreditAmountInSats(quote.creditAmountSats)) {
      throw new ValueError('The SSP quoted a credit that is not a safe positive integer number of satoshis.')
    }

    const claimFeeSats = options.depositAmountSats - quote.creditAmountSats

    if (!isNonNegativeAmountInSats(claimFeeSats)) {
      throw new ValueError('The caller-provided deposit amount is lower than the SSP quoted credit.')
    }

    return {
      transactionId: quote.transactionId,
      outputIndex: quote.outputIndex,
      depositAmountSats: options.depositAmountSats,
      creditAmountSats: quote.creditAmountSats,
      claimFeeSats
    }
  }

  /**
   * Claims a static deposit to the wallet.
   *
   * The SSP quotes the credit and this account signs it, so a quote that is not a plain
   * amount in satoshis is refused: claiming hands over the deposit's secret key and cannot
   * be undone. The amount is not bounded — nothing here knows the deposit's on-chain value.
   *
   * @param {string} txId - The transaction id of the deposit.
   * @returns {Promise<ClaimStaticDepositResult>} The Spark transfer created by the claim.
   * @throws {ValueError} If the SSP quotes a credit that is not a safe positive integer number of satoshis, which every credit below Bitcoin's total supply is.
   * @throws {SparkError} If the Spark SDK returns an invalid claim result.
   */
  async claimStaticDeposit (txId) {
    const quote = await this._wallet.getClaimStaticDepositQuote(txId)

    if (!isCreditAmountInSats(quote.creditAmountSats)) {
      throw new ValueError('The SSP quoted a credit that is not a safe positive integer number of satoshis.')
    }

    const result = await this._wallet.claimStaticDeposit({
      transactionId: txId,
      creditAmountSats: quote.creditAmountSats,
      sspSignature: quote.signature
    })

    if (!isClaimStaticDepositResult(result)) {
      throw new SparkError('The SSP returned an invalid static deposit claim result.', { result })
    }

    return result
  }

  /**
   * Claims a static deposit only when the Spark SDK's exact fee does not exceed
   * the maximum approved by the caller.
   *
   * The Spark SDK independently reads the Bitcoin output and obtains a fresh SSP
   * quote before checking the maximum. It does not rely on an earlier
   * caller-provided deposit amount or quote.
   *
   * @param {ClaimStaticDepositWithMaxFeeOptions} options - The bounded claim options.
   * @returns {Promise<ClaimStaticDepositResult>} The Spark transfer created by the claim.
   * @throws {ValueError} If an input is invalid.
   * @throws {StaticDepositFeeExceededError} If the exact claim fee exceeds the approved maximum.
   * @throws {StaticDepositClaimOutcomeUnknownError} If the SDK fails and this package cannot prove whether the claim was dispatched.
   */
  async claimStaticDepositWithMaxFee (options) {
    if (!options || typeof options.txId !== 'string' || options.txId.trim().length === 0) {
      throw new ValueError('The static deposit transaction ID must be a non-empty string.')
    }

    if (!isNonNegativeAmountInSats(options.maxFeeSats)) {
      throw new ValueError('The maximum static deposit claim fee must be a safe non-negative integer number of satoshis.')
    }

    if (options.outputIndex !== undefined && !isOutputIndex(options.outputIndex)) {
      throw new ValueError('The static deposit output index must be a safe non-negative integer.')
    }

    let result

    try {
      result = await this._wallet.claimStaticDepositWithMaxFee({
        transactionId: options.txId,
        maxFee: options.maxFeeSats,
        ...(options.outputIndex === undefined ? {} : { outputIndex: options.outputIndex })
      })
    } catch (error) {
      const claimFeeSats = getFeeChargedFromError(error)

      if (claimFeeSats !== undefined) {
        throw new StaticDepositFeeExceededError(
          'The static deposit claim fee exceeds the approved maximum.',
          {
            claimFeeSats,
            maxFeeSats: options.maxFeeSats,
            cause: error
          }
        )
      }

      throw new StaticDepositClaimOutcomeUnknownError(
        'The static deposit claim outcome is unknown.',
        {
          transactionId: options.txId,
          outputIndex: options.outputIndex,
          cause: error
        }
      )
    }

    if (!isClaimStaticDepositResult(result)) {
      throw new StaticDepositClaimOutcomeUnknownError(
        'The static deposit claim outcome is unknown.',
        {
          transactionId: options.txId,
          outputIndex: options.outputIndex,
          cause: new SparkError('The Spark SDK returned an invalid static deposit claim result.', { result })
        }
      )
    }

    return result
  }

  /**
   * Refunds a deposit made to a static deposit address back to a specified Bitcoin address.
   * The minimum fee is 300 satoshis.
   *
   * @param {RefundStaticDepositOptions} options - The refund options.
   * @returns {Promise<string>} The refund transaction as a hex string that needs to be broadcast.
   */
  async refundStaticDeposit (options) {
    return await this._wallet.refundStaticDeposit(options)
  }

  /**
   * Gets a fee quote for withdrawing funds from Spark cooperatively to an on-chain Bitcoin address.
   *
   * @param {QuoteWithdrawOptions} options - The withdrawal's options.
   * @returns {Promise<CoopExitFeeQuote>} The withdrawal fee quote.
   */
  async quoteWithdraw (options) {
    return await this._wallet.getWithdrawalFeeQuote(options)
  }

  /**
   * Initiates a withdrawal to move funds from the Spark network to an on-chain Bitcoin address.
   *
   * @param {WithdrawOptions} options - The withdrawal's options.
   * @returns {Promise<CoopExitRequest | null | undefined>} The withdrawal request details, or null/undefined if the request cannot be completed.
   * @throws {ValueError} If the withdraw max. fee option is set and the exit speed is not "FAST", "MEDIUM" or "SLOW".
   * @throws {MaximumFeeExceededError} If the quoted fee for the chosen exit speed surpasses the withdraw max. fee option.
   */
  async withdraw (options) {
    options.exitSpeed = options.exitSpeed || 'MEDIUM'
    const feeQuote = await this.quoteWithdraw({
      withdrawalAddress: options.onchainAddress,
      amountSats: options.amountSats
    })

    if (this._config.withdrawMaxFee !== undefined && getWithdrawalFeeSats(feeQuote, options.exitSpeed) > this._config.withdrawMaxFee) {
      throw new MaximumFeeExceededError('Exceeded maximum fee cost for withdraw operation.')
    }

    return await this._wallet.withdraw({
      ...options,
      feeQuote
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
   * When `syncAndRetry` is true, the payment carries a Spark transfer id that is reused if
   * the payment is retried, so the retry settles once instead of paying twice. The id is
   * available on the thrown error as `transferId`.
   *
   * @param {PayLightningInvoiceParams} options - The payment options.
   * @returns {Promise<LightningSendRequest>} The Lightning payment request details.
   * @throws {LightningPaymentError} When `syncAndRetry` is true and the payment fails with an error that is not retried. Its `transferId` is the id the payment was sent with.
   * @throws {LightningPaymentError} When `syncAndRetry` is true and the stale-leaf retry also fails. Its `transferId` is the id both attempts were sent with.
   */
  async payLightningInvoice (options) {
    if (!this._config.syncAndRetry) {
      return await this._wallet.payLightningInvoice(options)
    }

    const params = {
      ...options,
      transferId: options.transferId ?? generateTransferId()
    }

    try {
      return await this._wallet.payLightningInvoice(params)
    } catch (error) {
      await this.syncWalletBalance()

      if (!this._isStaleLeafError(error)) {
        throw new LightningPaymentError('The Lightning payment failed.', {
          transferId: params.transferId,
          cause: error
        })
      }

      try {
        return await this._wallet.payLightningInvoice(params)
      } catch (retryError) {
        throw new LightningPaymentError('The Lightning payment failed after retrying a stale-leaf error.', {
          transferId: params.transferId,
          cause: retryError
        })
      }
    }
  }

  /**
   * Gets fee estimate for sending Lightning payments.
   *
   * @param {LightningSendFeeEstimateInput} options - The fee estimation options.
   * @returns {Promise<bigint>} Fee estimate for sending Lightning payments.
   */
  async quotePayLightningInvoice (options) {
    const fee = await this._wallet.getLightningSendFeeEstimate(options)
    return BigInt(fee)
  }

  /**
   * Creates a Spark invoice for receiving a sats payment.
   *
   * @param {CreateSatsInvoiceOptions} options - The invoice options.
   * @returns {Promise<SparkAddressFormat>} A Spark invoice that can be paid by another Spark wallet.
   */
  async createSparkSatsInvoice (options) {
    return await this._wallet.createSatsInvoice(options)
  }

  /**
   * Creates a Spark invoice for receiving a token payment.
   *
   * @param {CreateTokensInvoiceOptions} options - The invoice options.
   * @returns {Promise<SparkAddressFormat>} A Spark invoice that can be paid by another Spark wallet.
   */
  async createSparkTokensInvoice (options) {
    return await this._wallet.createTokensInvoice(options)
  }

  /**
   * Fulfills one or more Spark invoices by paying them.
   *
   * @param {SparkInvoice[]} invoices - Array of invoices to fulfill.
   * @returns {Promise<FulfillSparkInvoiceResponse>} Response containing transaction results and errors.
   */
  async paySparkInvoice (invoices) {
    return await this._wallet.fulfillSparkInvoice(invoices)
  }

  /**
   * Reconciles the wallet's internal state with the server and waits
   * for any triggered optimisation to complete.
   *
   * @returns {Promise<void>}
   */
  async syncWalletBalance () {
    await this._wallet.experimental_syncWallet()

    const deadline = Date.now() + 10_000
    while (await this._wallet.isOptimizationInProgress()) {
      if (Date.now() > deadline) break
      await new Promise(resolve => setTimeout(resolve, 200))
    }
  }

  /**
   * Returns a read-only copy of the account.
   *
   * @returns {Promise<WalletAccountReadOnlySpark>} The read-only account.
   */
  async toReadOnlyAccount () {
    if (!this._sparkReadOnlyAccount) {
      const address = await this.getAddress()
      this._sparkReadOnlyAccount = new WalletAccountReadOnlySpark(address, this._config)
    }

    return this._sparkReadOnlyAccount
  }

  /**
   * Cleans up and closes the connections with the spark blockchain.
   *
   * @returns {Promise<void>}
   */
  async cleanupConnections () {
    await this._wallet.cleanup()
  }

  /**
   * Disposes the wallet account, erasing its private keys from the memory.
   *
   * The private key bytes held by the account's signer are zeroed. Other copies made while deriving the keys,
   * including the master key derived from the seed and the bigint form of each key, are not zeroed and are
   * left to the garbage collector.
   *
   * @returns {void}
   */
  dispose () {
    this.cleanupConnections().catch(console.error)

    this._signer.dispose()
  }

  /**
   * Tells whether an error reports leaves the wallet still believes it can spend, but
   * which the operators have already locked or reassigned.
   *
   * The operators report this condition as message text on a gRPC error. The SDK exposes
   * no error class or code that distinguishes it, and matches the same fragments in its
   * own leaf manager. Override this if a future SDK version identifies it properly.
   *
   * @protected
   * @param {Error} error - An error thrown by the Spark SDK.
   * @returns {boolean} Whether the error reports stale leaves.
   */
  _isStaleLeafError (error) {
    const message = error.message.toLowerCase()
    return STALE_LEAF_ERROR_FRAGMENTS.some(fragment => message.includes(fragment))
  }

  /** @private */
  async _listMatchingOutgoingTransfers (params) {
    const network = this._wallet.config.getNetworkType()
    const { identityPublicKey } = decodeSparkAddress(
      params.receiverSparkAddress,
      network
    )
    const matches = []

    for (let page = 0; page < TRANSFER_LOOKUP_MAX_PAGES; page++) {
      const offset = page * TRANSFER_LOOKUP_PAGE_SIZE
      // Two-argument skip pagination. Do not pass createdAfter.
      const { transfers } = await this._wallet.getTransfers(
        TRANSFER_LOOKUP_PAGE_SIZE,
        offset
      )

      for (const transfer of transfers) {
        if (
          transfer.transferDirection === 'OUTGOING' &&
          transfer.totalValue === params.amountSats &&
          transfer.receiverIdentityPublicKey === identityPublicKey &&
          !isExpiredOrReturnedStatus(transfer.status)
        ) {
          matches.push(transfer)
        }
      }

      if (transfers.length < TRANSFER_LOOKUP_PAGE_SIZE) {
        break
      }
    }

    return matches
  }

  /** @private */
  async _findOutgoingTransfer (params, priorIds) {
    const transfers = await this._listMatchingOutgoingTransfers(params)
    return transfers.find(transfer => !priorIds.has(transfer.id))
  }
}
