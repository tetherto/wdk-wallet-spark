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
    constructor(message: string, options: LightningPaymentErrorOptions & ErrorOptions);
    /**
     * The Spark transfer id the failed payment was sent with. Paying again with the same
     * id lets the operator settle the payment once instead of sending a second one.
     *
     * @type {UUID}
     */
    transferId: UUID;
}
/**
 * @typedef {Object} StaticDepositFeeExceededErrorOptions
 * @property {number} claimFeeSats - The exact fee quoted by the Spark SDK.
 * @property {number} maxFeeSats - The maximum fee approved by the caller.
 */
/**
 * A static-deposit claim whose exact fee exceeds the caller's approved maximum.
 */
export class StaticDepositFeeExceededError extends MaximumFeeExceededError {
    /** @type {'STATIC_DEPOSIT_FEE_EXCEEDED'} */
    code: "STATIC_DEPOSIT_FEE_EXCEEDED";
    /** @type {number} */
    claimFeeSats: number;
    /** @type {number} */
    maxFeeSats: number;
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
    constructor(message: string, options: StaticDepositClaimOutcomeUnknownErrorOptions & ErrorOptions);
    /** @type {'STATIC_DEPOSIT_CLAIM_OUTCOME_UNKNOWN'} */
    code: "STATIC_DEPOSIT_CLAIM_OUTCOME_UNKNOWN";
    /** @type {string} */
    transactionId: string;
    /** @type {number | undefined} */
    outputIndex: number | undefined;
}
export type UUID = import("uuidv7").UUID;
export type LightningPaymentErrorOptions = {
    /**
     * - The Spark transfer id the failed payment was sent with.
     */
    transferId: UUID;
};
export type StaticDepositFeeExceededErrorOptions = {
    /**
     * - The exact fee quoted by the Spark SDK.
     */
    claimFeeSats: number;
    /**
     * - The maximum fee approved by the caller.
     */
    maxFeeSats: number;
};
export type StaticDepositClaimOutcomeUnknownErrorOptions = {
    /**
     * - The Bitcoin transaction ID of the deposit.
     */
    transactionId: string;
    /**
     * - The Bitcoin output index of the deposit.
     */
    outputIndex?: number;
};
import { WdkError } from '@tetherto/wdk-wallet';
import { MaximumFeeExceededError } from '@tetherto/wdk-wallet';
