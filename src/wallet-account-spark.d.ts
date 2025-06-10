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
 * @typedef {import('@buildonspark/spark-sdk/types').WalletTransfer} SparkTransfer
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
    /**
     * The derivation path's index of this account.
     *
     * @type {number}
     */
    get index(): number;
    /**
     * The derivation path of this account.
     *
     * @type {string}
     */
    get path(): string;
    /**
     * The account's key pair.
     *
     * @type {KeyPair}
     */
    get keyPair(): KeyPair;
    /**
     * Returns the account's address.
     *
     * @returns {Promise<string>} The account's address.
     */
    getAddress(): Promise<string>;
    /**
     * Signs a message.
     *
     * @param {string} message - The message to sign.
     * @returns {Promise<string>} The message's signature.
     */
    sign(message: string): Promise<string>;
    /**
     * Verifies a message's signature.
     *
     * @param {string} message - The original message.
     * @param {string} signature - The signature to verify.
     * @returns {Promise<boolean>} True if the signature is valid.
     */
    verify(message: string, signature: string): Promise<boolean>;
    /**
     * Quotes a transaction.
     *
     * @param {SparkTransaction} tx - The transaction to quote.
     * @returns {Promise<number>} The transaction's fee (in satoshis).
     */
    quoteTransaction({ to, value }: SparkTransaction): Promise<number>;
    /**
     * Sends a transaction.
     *
     * @param {SparkTransaction} tx - The transaction to send.
     * @returns {Promise<string>} The transaction's hash.
     */
    sendTransaction({ to, value }: SparkTransaction): Promise<string>;
    /**
     * Returns the account's native token balance.
     *
     * @returns {Promise<number>} The native token balance.
     */
    getBalance(): Promise<number>;
    /**
     * Returns the account balance for a specific token.
     *
     * @param {string} tokenAddress - The smart contract address of the token.
     * @returns {Promise<number>} The token balance.
     */
    getTokenBalance(tokenAddress: string): Promise<number>;
    /**
     * Generates a single-use deposit address for bitcoin deposits from layer 1.
     * Once you deposit funds to this address, it cannot be used again.
     *
     * @returns {Promise<string>} The single-use deposit address.
     */
    getSingleUseDepositAddress(): Promise<string>;
    /**
     * Claims a deposit to the wallet.
  
     * @param {string} txId - The transaction id of the deposit.
     * @returns {Promise<WalletLeaf[] | undefined>} The nodes resulting from the deposit.
     */
    claimDeposit(txId: string): Promise<WalletLeaf[] | undefined>;
    /**
     * Checks for a confirmed deposit to the specified deposit address.
     *
     * @param {string} depositAddress - The deposit address to check.
     * @returns {Promise<string | null>} The transaction id if found, null otherwise.
     */
    getLatestDepositTxId(depositAddress: string): Promise<string | null>;
    /**
     * Initiates a withdrawal to move funds from the Spark network to an on-chain Bitcoin address.
     *
     * @property {Object} options - The withdrawal's options.
     * @property {string} options.to - The Bitcoin address where the funds should be sent.
     * @property {number} options.value - The amount in satoshis to withdraw.
     * @returns {Promise<CoopExitRequest | null | undefined>} The withdrawal request details, or null/undefined if the request cannot be completed.
     */
    withdraw({ to, value }: {
        to: any;
        value: any;
    }): Promise<CoopExitRequest | null | undefined>;
    /**
     * Creates a Lightning invoice for receiving payments.
     *
     * @param {Object} options - The invoice options.
     * @param {number} options.value - The amount in satoshis.
     * @param {string} [options.memo] - An optional description for the invoice.
     * @returns {Promise<LightningReceiveRequest>} BOLT11 encoded invoice.
     */
    createLightningInvoice({ value, memo }: {
        value: number;
        memo?: string;
    }): Promise<LightningReceiveRequest>;
    /**
     * Get a Lightning receive request by id.
     *
     * @param {string} invoiceId - The id of the Lightning receive request.
     * @returns {Promise<LightningReceiveRequest | null>} The Lightning receive request.
     */
    getLightningReceiveRequest(invoiceId: string): Promise<LightningReceiveRequest | null>;
    /**
     * Pays a Lightning invoice.
     *
     * @param {Object} options - The payment options.
     * @param {string} options.invoice - The BOLT11-encoded Lightning invoice to pay.
     * @param {number} options.maxFeeSats - The maximum fee in satoshis to pay.
     * @returns {Promise<LightningSendRequest>} The Lightning payment request details.
     */
    payLightningInvoice({ invoice, maxFeeSats }: {
        invoice: string;
        maxFeeSats: number;
    }): Promise<LightningSendRequest>;
    /**
     * Gets fee estimate for sending Lightning payments.
     *
     * @param {Object} options - The fee estimation options.
     * @param {string} options.invoice - The BOLT11-encoded Lightning invoice to estimate fees for.
     * @returns {Promise<number>} Fee estimate for sending Lightning payments.
     */
    getLightningSendFeeEstimate({ invoice }: {
        invoice: string;
    }): Promise<number>;
    /**
     * Returns the bitcoin transfers history of the account.
     *
     * @param {Object} [options] - The options.
     * @param {"incoming" | "outgoing" | "all"} [options.direction] - If set, only returns transfers with the given direction (default: "all").
     * @param {number} [options.limit] - The number of transfers to return (default: 10).
     * @param {number} [options.skip] - The number of transfers to skip (default: 0).
     * @returns {Promise<SparkTransfer[]>} The bitcoin transfers.
     */
    getTransfers(options?: {
        direction?: "incoming" | "outgoing" | "all";
        limit?: number;
        skip?: number;
    }): Promise<SparkTransfer[]>;
    #private;
}
export type WalletLeaf = import("@buildonspark/spark-sdk/types").WalletLeaf;
export type CoopExitRequest = import("@buildonspark/spark-sdk/types").CoopExitRequest;
export type LightningReceiveRequest = import("@buildonspark/spark-sdk/types").LightningReceiveRequest;
export type LightningSendRequest = import("@buildonspark/spark-sdk/types").LightningSendRequest;
export type SparkTransfer = import("@buildonspark/spark-sdk/types").WalletTransfer;
export type KeyPair = {
    /**
     * - The public key.
     */
    publicKey: string;
    /**
     * - The private key.
     */
    privateKey: string;
};
export type SparkTransaction = {
    /**
     * - The transaction's recipient.
     */
    to: string;
    /**
     * - The amount of bitcoins to send to the recipient (in satoshis).
     */
    value: number;
};
