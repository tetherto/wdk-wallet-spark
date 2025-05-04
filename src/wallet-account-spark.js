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

import { bytesToHex } from '@noble/curves/abstract/utils'
import { getLatestDepositTxId } from '@buildonspark/spark-sdk/utils'

export default class WalletAccountSpark {
  #index
  #wallet
  #signer
  #address

  constructor ({ index, wallet, signer, address }) {
    this.#index = index
    this.#wallet = wallet
    this.#signer = signer
    this.#address = address
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
   * The account's address.
   *
   * @type {string}
   */
  get address () {
    return this.#address
  }

  /**
   * Returns the account's Spark address.
   *
   * @returns {Promise<string>} The Spark address.
   */
  async getSparkAddress () {
    return this.#wallet.getSparkAddress()
  }

  /**
   * @typedef {Object} KeyPair
   * @property {string} publicKey - The public key.
   * @property {string} privateKey - The private key.
   */

  /**
   * The account's identity key pair.
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
   * Signs a message using the account's signing key.
   *
   * @param {string} message - The message to sign.
   * @returns {Promise<string>} The message's signature.
   */
  async sign (message) {
    const signature = await this.#signer.signMessageHex(message)
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
   * @typedef {Object} Transaction
   * @property {string} to - The transaction's recipient.
   * @property {number|string} value - The amount of native tokens to send to the recipient.
   * @property {string} [data] - Optional data to include in the transaction.
   */

  /**
   * Sends a transaction.
   *
   * @param {Transaction} tx - The transaction to send.
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
   * @returns {Promise<BigInt>} The native token balance.
   */
  async getBalance () {
    const balances = await this.#wallet.getBalance()
    return Number(balances.balance)
  }

  /**
   * Generates a single-use deposit address for Bitcoin deposits from L1.
   * This address can only be used once.
   *
   * @returns {Promise<string>} The single-use deposit address.
   */
  async getSingleUseDepositAddress () {
    return this.#wallet.getSingleUseDepositAddress()
  }

  /**
   * Claims a deposit made to a previously generated deposit address.
   *
   * @param {string} txId - The transaction ID of the deposit.
   * @returns {Promise<Object>} The claim transaction result.
   */
  async claimDeposit (txId) {
    return this.#wallet.claimDeposit(txId)
  }

  /**
   * Checks for a confirmed deposit to the specified deposit address.
   *
   * @param {string} depositAddress - The deposit address to check.
   * @returns {Promise<string|null>} The transaction ID if found, null otherwise.
   */
  async checkDepositConfirmation (depositAddress) {
    return getLatestDepositTxId(depositAddress)
  }

  /**
   * Withdraws the given amount from spark to L1 mainchain.
   *
   * @property {string} to - The transaction's recipient.
   * @property {number|string} value - The amount of native tokens to send to the recipient.
   * @returns {Promise<CoopExitRequest | null | undefined>} The transaction ID if found, null otherwise.
   */
  async withdrawSpark ({ to, value }) {
    return await this.#wallet.withdraw({
      onchainAddress: to,
      amountSats: value,
      exitSpeed: 'MEDIUM'
    })
  }

  /**
   * Generates a Lightning invoice to receive payment.
   *
   * @param {Object} options - The invoice options.
   * @param {number|string} options.amountSats - The amount in satoshis.
   * @param {string} [options.memo] - Optional description for the invoice.
   * @returns {Promise<Object>} The generated invoice.
   */
  async createLightningInvoice ({ amountSats, memo }) {
    return this.#wallet.createLightningInvoice({
      amountSats,
      memo
    })
  }

  /**
   * Checks the status of a Lightning payment.
   *
   * @param {string} invoiceId - The invoice ID to check.
   * @returns {Promise<Object>} The payment status.
   */
  async getLightningReceiveRequest (invoiceId) {
    return this.#wallet.getLightningReceiveRequest(invoiceId)
  }

  /**
   * Sends a Lightning payment using an invoice.
   *
   * @param {Object} options - The payment options.
   * @param {string} options.invoice - The Lightning invoice to pay.
   * @param {number|string} options.maxFeeSats - The maximum fee in satoshis to pay.
   * @returns {Promise<Object>} The payment response.
   */
  async payLightningInvoice ({ invoice, maxFeeSats }) {
    return this.#wallet.payLightningInvoice({
      invoice,
      maxFeeSats
    })
  }
}
