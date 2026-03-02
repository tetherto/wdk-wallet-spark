/** @typedef {import('@buildonspark/spark-sdk').NetworkType} NetworkType */
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
     * @type {SparkReadonlyClient}
     */
    protected _client: SparkReadonlyClient;
    /**
     * Returns the account's bitcoin balance.
     *
     * @returns {Promise<bigint>} The bitcoin balance (in satoshis).
     */
    getBalance(): Promise<bigint>;
    /**
     * Returns the account balance for a specific token.
     *
     * @param {string} tokenAddress - The token identifier (Bech32m token identifier, e.g., `btkn1...`).
     * @returns {Promise<bigint>} The token balance (in base unit).
     */
    getTokenBalance(tokenAddress: string): Promise<bigint>;
    /**
     * Quotes the costs of a send transaction operation.
     *
     * @param {SparkTransaction} tx - The transaction.
     * @returns {Promise<Omit<TransactionResult, 'hash'>>} The transaction's quotes.
     */
    quoteSendTransaction(tx: SparkTransaction): Promise<Omit<TransactionResult, 'hash'>>;
    /**
     * Quotes the costs of a transfer operation.
     *
     * @param {TransferOptions} options - The transfer's options.
     * @returns {Promise<Omit<TransferResult, 'hash'>>} The transfer's quotes.
     */
    quoteTransfer(options: TransferOptions): Promise<Omit<TransferResult, 'hash'>>;
    /**
     * Returns a Spark transfer by its ID. Only returns Spark transfers, not on-chain Bitcoin transactions.
     *
     * @param {string} hash - The Spark transfer's ID.
     * @returns {Promise<Object | null>} The Spark transfer, or null if not found.
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
     * Returns the Spark transfer history of the account. Only returns Spark transfers, not on-chain Bitcoin transactions.
     *
     * @param {GetTransfersOptions} [options] - The options.
     * @returns {Promise<Array>} The Spark transfers.
     */
    getTransfers(options?: GetTransfersOptions): Promise<Array<any>>;
    /**
     * Returns unused single-use deposit addresses for the account.
     *
     * @param {Omit<QueryDepositAddressesParams, 'sparkAddress'>} [options] - The options.
     * @returns {Promise<{ depositAddresses: Array, offset: number }>} The unused deposit addresses.
     */
    getUnusedDepositAddresses(options?: Omit<QueryDepositAddressesParams, 'sparkAddress'>): Promise<{
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
     * @param {GetUtxosParams} options - The options.
     * @returns {Promise<{ utxos: Array<{ txid: string, vout: number }>, offset: number }>} The UTXOs.
     */
    getUtxosForDepositAddress(options: GetUtxosParams): Promise<{
        utxos: Array<{
            txid: string;
            vout: number;
        }>;
        offset: number;
    }>;
    /**
     * Queries the status of Spark invoices.
     *
     * @param {QuerySparkInvoicesParams} params - The query parameters.
     * @returns {Promise<{ invoiceStatuses: Array, offset: number }>} The invoice statuses.
     */
    getSparkInvoices(params: QuerySparkInvoicesParams): Promise<{
        invoiceStatuses: Array<any>;
        offset: number;
    }>;
}
export type NetworkType = import("@buildonspark/spark-sdk").NetworkType;
export type SparkReadonlyClient = import("@buildonspark/spark-sdk").SparkReadonlyClient;
export type QueryDepositAddressesParams = import("@buildonspark/spark-sdk").QueryDepositAddressesParams;
export type GetUtxosParams = import("@buildonspark/spark-sdk").GetUtxosParams;
export type QuerySparkInvoicesParams = import("@buildonspark/spark-sdk").QuerySparkInvoicesParams;
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
import { WalletAccountReadOnly } from '@tetherto/wdk-wallet';
