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
import { WdkError } from '@tetherto/wdk-wallet';
import { MaximumFeeExceededError } from '@tetherto/wdk-wallet';
