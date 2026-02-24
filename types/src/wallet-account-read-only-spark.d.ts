/** @typedef {import('@buildonspark/spark-sdk').NetworkType} NetworkType */
/** @typedef {import('@buildonspark/spark-sdk').TokenBalanceMap} TokenBalanceMap */
/** @typedef {import('@tetherto/wdk-wallet').TransactionResult} TransactionResult */
/** @typedef {import('@tetherto/wdk-wallet').TransferOptions} TransferOptions */
/** @typedef {import('@tetherto/wdk-wallet').TransferResult} TransferResult */
/**
 * @typedef {Object} SparkTransaction
 * @property {string} to - The transaction's recipient.
 * @property {number | bigint} value - The amount of bitcoins to send to the recipient (in satoshis).
 */
/**
 * @typedef {Object} SparkWalletConfig
 * @property {NetworkType} [network] - The network (default: "MAINNET").
 */
/**
 * @typedef {Object} GetTransfersOptions
 * @property {"incoming" | "outgoing" | "all"} [direction] - If set, only returns transfers with the given direction (default: "all").
 * @property {number} [limit] - The number of transfers to return (default: 10).
 * @property {number} [skip] - The number of transfers to skip (default: 0).
 */
/**
 * @typedef {Object} GetUnusedDepositAddressesOptions
 * @property {number} [limit] - The maximum number of addresses to return (default: 100).
 * @property {number} [offset] - The pagination offset (default: 0).
 */
/**
 * @typedef {Object} GetUtxosForDepositAddressOptions
 * @property {string} depositAddress - The Bitcoin deposit address to query.
 * @property {number} [limit] - The maximum number of UTXOs to return (default: 100).
 * @property {number} [offset] - The pagination offset (default: 0).
 * @property {boolean} [excludeClaimed] - If true, excludes already-claimed UTXOs.
 */
/**
 * @typedef {Object} GetSparkInvoicesOptions
 * @property {string[]} invoices - Array of Spark invoice strings to query.
 * @property {number} [limit] - The maximum number of results to return (default: 100).
 * @property {number} [offset] - The pagination offset (default: 0).
 */
export const DEFAULT_NETWORK: "MAINNET";
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
     * The readonly client for querying wallet data.
     *
     * @protected
     */
    protected _client: any;
    /**
     * Returns a transfer by its ID.
     *
     * @param {string} hash - The transfer's ID.
     * @returns {Promise<Object | null>} The transfer, or null if not found.
     */
    getTransactionReceipt(hash: string): Promise<Object | null>;
    /**
     * Returns the account's identity public key.
     *
     * @returns {Promise<string>} The identity public key (hex-encoded).
     */
    getIdentityKey(): Promise<string>;
    /**
     * Verifies a message's signature.
     *
     * @param {string} message - The original message.
     * @param {string} signature - The signature to verify (hex-encoded, DER or compact).
     * @returns {Promise<boolean>} True if the signature is valid.
     */
    verify(message: string, signature: string): Promise<boolean>;
    /**
     * Returns the bitcoin transfer history of the account.
     *
     * @param {GetTransfersOptions} [options] - The options.
     * @returns {Promise<Array>} The bitcoin transfers.
     */
    getTransfers(options?: GetTransfersOptions): Promise<Array<any>>;
    /**
     * Returns unused single-use deposit addresses for the account.
     *
     * @param {GetUnusedDepositAddressesOptions} [options] - The options.
     * @returns {Promise<{ depositAddresses: Array, offset: number }>} The unused deposit addresses.
     */
    getUnusedDepositAddresses(options?: GetUnusedDepositAddressesOptions): Promise<{
        depositAddresses: Array<any>;
        offset: number;
    }>;
    /**
     * Returns all static deposit addresses for the account.
     *
     * @returns {Promise<Array>} The static deposit addresses.
     */
    getStaticDepositAddresses(): Promise<Array<any>>;
    /**
     * Returns confirmed UTXOs for a specific deposit address.
     *
     * @param {GetUtxosForDepositAddressOptions} options - The options.
     * @returns {Promise<{ utxos: Array<{ txid: string, vout: number }>, offset: number }>} The UTXOs.
     */
    getUtxosForDepositAddress(options: GetUtxosForDepositAddressOptions): Promise<{
        utxos: Array<{
            txid: string;
            vout: number;
        }>;
        offset: number;
    }>;
    /**
     * Queries the status of Spark invoices.
     *
     * @param {GetSparkInvoicesOptions} params - The query parameters.
     * @returns {Promise<{ invoiceStatuses: Array, offset: number }>} The invoice statuses.
     */
    getSparkInvoices(params: GetSparkInvoicesOptions): Promise<{
        invoiceStatuses: Array<any>;
        offset: number;
    }>;
}
export type NetworkType = import("@buildonspark/spark-sdk").NetworkType;
export type TokenBalanceMap = import("@buildonspark/spark-sdk").TokenBalanceMap;
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
    value: number | bigint;
};
export type SparkWalletConfig = {
    /**
     * - The network (default: "MAINNET").
     */
    network?: NetworkType;
};
export type GetTransfersOptions = {
    /**
     * - If set, only returns transfers with the given direction (default: "all").
     */
    direction?: "incoming" | "outgoing" | "all";
    /**
     * - The number of transfers to return (default: 10).
     */
    limit?: number;
    /**
     * - The number of transfers to skip (default: 0).
     */
    skip?: number;
};
export type GetUnusedDepositAddressesOptions = {
    /**
     * - The maximum number of addresses to return (default: 100).
     */
    limit?: number;
    /**
     * - The pagination offset (default: 0).
     */
    offset?: number;
};
export type GetUtxosForDepositAddressOptions = {
    /**
     * - The Bitcoin deposit address to query.
     */
    depositAddress: string;
    /**
     * - The maximum number of UTXOs to return (default: 100).
     */
    limit?: number;
    /**
     * - The pagination offset (default: 0).
     */
    offset?: number;
    /**
     * - If true, excludes already-claimed UTXOs.
     */
    excludeClaimed?: boolean;
};
export type GetSparkInvoicesOptions = {
    /**
     * - Array of Spark invoice strings to query.
     */
    invoices: string[];
    /**
     * - The maximum number of results to return (default: 100).
     */
    limit?: number;
    /**
     * - The pagination offset (default: 0).
     */
    offset?: number;
};
import { WalletAccountReadOnly } from '@tetherto/wdk-wallet';
