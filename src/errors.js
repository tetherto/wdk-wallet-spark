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

import { MaximumFeeExceededError, WdkError } from '@tetherto/wdk-wallet'

/** @typedef {import('uuidv7').UUID} UUID */

/**
 * @typedef {Object} LightningPaymentErrorOptions
 * @property {UUID} transferId - The Spark transfer id the failed payment was sent with.
 */

/**
 * A Lightning payment that did not complete, carrying the Spark transfer id it was sent with.
 *
 * It extends {@link WdkError}, so it is also part of the `WdkError` taxonomy.
 */
export class LightningPaymentError extends WdkError {
  /**
   * Create a new Lightning payment error.
   *
   * @param {string} message - The error message.
   * @param {LightningPaymentErrorOptions & ErrorOptions} options - The error's options.
   */
  constructor (message, options) {
    super(message, { cause: options.cause })

    this.name = 'LightningPaymentError'

    /**
     * The Spark transfer id the failed payment was sent with. Paying again with the same
     * id lets the operator settle the payment once instead of sending a second one.
     *
     * @type {UUID}
     */
    this.transferId = options.transferId
  }
}

/**
 * @typedef {Object} StaticDepositClaimOutcomeUnknownErrorOptions
 * @property {string} transactionId - The Bitcoin transaction ID of the deposit.
 * @property {number} [outputIndex] - The Bitcoin output index of the deposit.
 */

/**
 * A static-deposit claim failure for which this package cannot prove whether the claim was dispatched.
 */
export class StaticDepositClaimOutcomeUnknownError extends WdkError {
  /**
   * Creates a new static-deposit claim outcome unknown error.
   *
   * @param {string} message - The error's message.
   * @param {StaticDepositClaimOutcomeUnknownErrorOptions & ErrorOptions} options - The error's options.
   */
  constructor (message, options) {
    super(message, { cause: options.cause })

    this.name = 'StaticDepositClaimOutcomeUnknownError'

    /** @type {'STATIC_DEPOSIT_CLAIM_OUTCOME_UNKNOWN'} */
    this.code = 'STATIC_DEPOSIT_CLAIM_OUTCOME_UNKNOWN'

    /** @type {string} */
    this.transactionId = options.transactionId

    /** @type {number | undefined} */
    this.outputIndex = options.outputIndex
  }
}
