/** @typedef {import('@buildonspark/spark-sdk').NetworkType} NetworkType */
/** @typedef {import('@sparkscan/api-node-sdk-client').TxV1Response} SparkTransactionReceipt */
/** @typedef {import('@tetherto/wdk-wallet').TransactionResult} TransactionResult */
/** @typedef {import('@tetherto/wdk-wallet').TransferOptions} TransferOptions */
/** @typedef {import('@tetherto/wdk-wallet').TransferResult} TransferResult */
/**
 * @typedef {Object} SparkTransaction
 * @property {string} to - The transaction's recipient.
 * @property {number} value - The amount of bitcoins to send to the recipient (in satoshis).
 */
/**
 * @typedef {Object} SparkWalletConfig
 * @property {NetworkType} [network] - The network (default: "MAINNET").
 * @property {string} [sparkScanApiKey] - The spark scan api-key.
 */
export default class WalletAccountReadOnlySpark extends WalletAccountReadOnly {
    /**
     * Creates a new spark read-only wallet account.
     *
     * @param {string} address - The account's address.
     * @param {SparkWalletConfig} [config] - The configuration object.
     */
    constructor(address: string, config?: SparkWalletConfig);
    /**
     * The read-only wallet account configuration.
     *
     * @protected
     * @type {SparkWalletConfig}
     */
    protected _config: SparkWalletConfig;
    /**
     * Quotes the costs of a send transaction operation.
     *
     * @param {SparkTransaction} tx - The transaction.
     * @returns {Promise<Omit<TransactionResult, 'hash'>>} The transaction's quotes.
     */
    quoteSendTransaction(tx: SparkTransaction): Promise<Omit<TransactionResult, "hash">>;
    /**
     * Returns a transaction's receipt.
     *
     * @param {string} hash - The transaction's hash.
     * @returns {Promise<SparkTransactionReceipt | null>} The receipt, or null if the transaction has not been included in a block yet.
     */
    getTransactionReceipt(hash: string): Promise<SparkTransactionReceipt | null>;
}
export type NetworkType = import("@buildonspark/spark-sdk").NetworkType;
export type SparkTransactionReceipt = import("@sparkscan/api-node-sdk-client").TxV1Response;
export type TransactionResult = import("@tetherto/wdk-wallet").TransactionResult;
export type TransferOptions = import("@tetherto/wdk-wallet").TransferOptions;
export type TransferResult = import("@tetherto/wdk-wallet").TransferResult;
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
export type SparkWalletConfig = {
    /**
     * - The network (default: "MAINNET").
     */
    network?: NetworkType;
    /**
     * - The spark scan api-key.
     */
    sparkScanApiKey?: string;
};
import { WalletAccountReadOnly } from '@tetherto/wdk-wallet';
