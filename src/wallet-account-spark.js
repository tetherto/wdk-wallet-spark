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

import { getLatestDepositTxId } from '@buildonspark/spark-sdk/utils'

import { bytesToHex } from '@noble/curves/abstract/utils'

/**
 * @typedef {import('@buildonspark/spark-sdk/types').WalletLeaf} WalletLeaf
 */

/**
 * @typedef {import('@buildonspark/spark-sdk/types').CoopExitRequest} CoopExitRequest
 */

/**
 * @typedef {import('@buildonspark/spark-sdk/types').LightningReceiveRequest} LightningReceiveRequest
 */

/**
 * @typedef {import('@buildonspark/spark-sdk/types').LightningSendRequest} LightningSendRequest
 */

/**
 * @typedef {Object} LightningFeeEstimate
 * @property {Object} feeEstimate - The fee estimate information.
 * @property {number} feeEstimate.originalValue - The fee amount in satoshis.
 * @property {string} feeEstimate.originalUnit - The original unit of the fee (e.g., 'SATOSHI').
 * @property {string} feeEstimate.preferredCurrencyUnit - The preferred currency unit for display (e.g., 'USD').
 * @property {number} feeEstimate.preferredCurrencyValueRounded - The fee amount in the preferred currency, rounded.
 * @property {number} feeEstimate.preferredCurrencyValueApprox - The approximate fee amount in the preferred currency.
 */

/**
 * @typedef {Object} KeyPair
 * @property {string} publicKey - The public key.
 * @property {string} privateKey - The private key.
 */

/**
 * @typedef {Object} SparkTransaction
 * @property {string} to - The transaction's recipient.
 * @property {number} value - The amount of bitcoins to send to the recipient (in satoshis).
 */

export default class WalletAccountSpark {
  #index
  #wallet
  #signer

  constructor ({ index, signer, wallet }) {
    this.#index = index
    this.#signer = signer
    this.#wallet = wallet
  }

  /**
   * The derivation path's index of this account.
   *
   * @type {number}
   */
  get index () {
    return this.#index
  }

  /**
   * The derivation path of this account.
   *
   * @type {string}
   */
  get path () {
    return this.#signer.path
  }

  /**
   * The account's key pair.
   *
   * @type {KeyPair}
   */
  get keyPair () {
    return {
      publicKey: bytesToHex(this.#signer.identityKey.publicKey),
      privateKey: bytesToHex(this.#signer.identityKey.privateKey)
    }
  }

  /**
   * Returns the account's address.
   *
   * @returns {Promise<string>} The account's address.
   */
  async getAddress () {
    return await this.#wallet.getSparkAddress()
  }

  /**
   * Signs a message.
   *
   * @param {string} message - The message to sign.
   * @returns {Promise<string>} The message's signature.
   */
  async sign (message) {
    const signature = await this.#signer.signMessageWithIdentityKey(message)

    return signature
  }

  /**
   * Verifies a message's signature.
   *
   * @param {string} message - The original message.
   * @param {string} signature - The signature to verify.
   * @returns {Promise<boolean>} True if the signature is valid.
   */
  async verify (message, signature) {
    return this.#signer.verifySignatureHex(message, signature)
  }

  /**
   * Sends a transaction.
   *
   * @param {SparkTransaction} tx - The transaction to send.
   * @returns {Promise<string>} The transaction's hash.
   */
  async sendTransaction ({ to, value }) {
    const transfer = await this.#wallet.transfer({
      receiverSparkAddress: to,
      amountSats: value
    })

    return transfer.id
  }

  /**
   * Returns the account's native token balance.
   *
   * @returns {Promise<number>} The native token balance.
   */
  async getBalance () {
    const { balance } = await this.#wallet.getBalance()

    return Number(balance)
  }

  /**
   * Returns the account balance for a specific token.
   *
   * @param {string} tokenAddress - The smart contract address of the token.
   * @returns {Promise<number>} The token balance.
   */
  async getTokenBalance (tokenAddress) {
    throw new Error('Not supported by the spark blockchain.')
  }

  /**
   * Generates a single-use deposit address for bitcoin deposits from layer 1.
   * Once you deposit funds to this address, it cannot be used again.
   *
   * @returns {Promise<string>} The single-use deposit address.
   */
  async getSingleUseDepositAddress () {
    return await this.#wallet.getSingleUseDepositAddress()
  }

  /**
   * Claims a deposit to the wallet.

   * @param {string} txId - The transaction id of the deposit.
   * @returns {Promise<WalletLeaf[] | undefined>} The nodes resulting from the deposit.
   */
  async claimDeposit (txId) {
    return await this.#wallet.claimDeposit(txId)
  }

  /**
   * Checks for a confirmed deposit to the specified deposit address.
   *
   * @param {string} depositAddress - The deposit address to check.
   * @returns {Promise<string | null>} The transaction id if found, null otherwise.
   */
  async checkDepositConfirmation (depositAddress) {
    return await getLatestDepositTxId(depositAddress)
  }

  /**
   * Initiates a withdrawal to move funds from the Spark network to an on-chain Bitcoin address.
   *
   * @property {Object} options - The withdrawal's options.
   * @property {string} options.to - The Bitcoin address where the funds should be sent.
   * @property {number} options.value - The amount in satoshis to withdraw.
   * @returns {Promise<CoopExitRequest | null | undefined>} The withdrawal request details, or null/undefined if the request cannot be completed.
   */
  async withdrawSpark ({ to, value }) {
    return await this.#wallet.withdraw({
      onchainAddress: to,
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
    return await this.#wallet.createLightningInvoice({
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
    return await this.#wallet.getLightningReceiveRequest(invoiceId)
  }

  /**
   * Gets an estimate of the fee for sending a Lightning payment.
   *
   * @param {Object} options - The fee estimation options.
   * @param {string} options.invoice - The BOLT11-encoded Lightning invoice to estimate fees for.
   * @returns {Promise<LightningFeeEstimate>} The fee estimate details.
   */
  async getLightningSendFeeEstimate ({ invoice }) {
    return await this.#wallet.getLightningSendFeeEstimate({
      encodedInvoice: invoice
    })
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
    return await this.#wallet.payLightningInvoice({
      invoice,
      maxFeeSats
    })
  }
}
