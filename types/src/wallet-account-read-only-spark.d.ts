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
    protected _sparkscan?: SparkScanClient;
    /**
     * Returns a Spark transfer by its ID. Only returns Spark transfers, not on-chain Bitcoin transactions.
     *
     * @param {string} hash - The Spark transfer's ID.
     * @returns {Promise<SparkTransfer | null>} The Spark transfer, or null if not found.
     */
    getTransactionReceipt(hash: string): Promise<SparkTransfer | null>;
    /**
     * Returns the account's identity public key.
     *
     * @returns {Promise<string>} The identity public key (hex-encoded).
     */
    getIdentityKey(): Promise<string>;
    /**
     * Returns the Spark transfer history of the account. Only returns Spark transfers, not on-chain Bitcoin transactions.
     *
     * @param {GetTransfersOptions} [options] - The options.
     * @returns {Promise<SparkTransfer[]>} The Spark transfers.
     */
    getTransfers(options?: GetTransfersOptions): Promise<SparkTransfer[]>;
    /**
     * Returns unused single-use deposit addresses for the account.
     *
     * @param {Omit<QueryDepositAddressesParams, 'sparkAddress'>} [options] - The options.
     * @returns {Promise<{ depositAddresses: DepositAddressQueryResult[], offset: number }>} The unused deposit addresses.
     */
    getUnusedDepositAddresses(options?: Omit<QueryDepositAddressesParams, "sparkAddress">): Promise<{
        depositAddresses: DepositAddressQueryResult[];
        offset: number;
    }>;
    /**
     * Returns all existing static deposit addresses for the account.
     *
     * @returns {Promise<DepositAddressQueryResult[]>} The static deposit addresses.
     */
    getStaticDepositAddresses(): Promise<DepositAddressQueryResult[]>;
    /**
     * Returns confirmed UTXOs for a specific deposit address.
     *
     * @param {GetUtxosParams} options - The options.
     * @returns {Promise<{ utxos: { txid: string, vout: number }[], offset: number }>} The UTXOs.
     */
    getUtxosForDepositAddress(options: GetUtxosParams): Promise<{
        utxos: {
            txid: string;
            vout: number;
        }[];
        offset: number;
    }>;
    /**
     * Queries the status of Spark invoices.
     *
     * @param {QuerySparkInvoicesParams} params - The query parameters.
     * @returns {Promise<{ invoiceStatuses: InvoiceResponse[], offset: number }>} The invoice statuses.
     */
    getSparkInvoices(params: QuerySparkInvoicesParams): Promise<{
        invoiceStatuses: InvoiceResponse[];
        offset: number;
    }>;
}
export type NetworkType = import("@buildonspark/spark-sdk").NetworkType;
export type SparkReadonlyClient = import("@buildonspark/spark-sdk").SparkReadonlyClient;
export type SparkTransfer = import("@buildonspark/spark-sdk/proto/spark").Transfer;
export type DepositAddressQueryResult = import("@buildonspark/spark-sdk/proto/spark").DepositAddressQueryResult;
export type InvoiceResponse = import("@buildonspark/spark-sdk/proto/spark").InvoiceResponse;
export type QueryDepositAddressesParams = import("@buildonspark/spark-sdk").QueryDepositAddressesParams;
export type GetUtxosParams = import("@buildonspark/spark-sdk").GetUtxosParams;
export type QuerySparkInvoicesParams = import("@buildonspark/spark-sdk").QuerySparkInvoicesParams;
export type TransactionResult = import("@tetherto/wdk-wallet").TransactionResult;
export type TransferOptions = import("@tetherto/wdk-wallet").TransferOptions;
export type TransferResult = import("@tetherto/wdk-wallet").TransferResult;
export type SparkScanConfig = import("./libs/sparkscan-client.js").SparkScanConfig;
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
    /**
     * - Optional sparkscan client config
     */
    sparkscan?: SparkScanConfig;
    /**
     * - When true, failed sends and Lightning payments will automatically sync wallet state and retry once (default: false).
     */
    syncAndRetry?: boolean;
    /**
     * - When true, enable logging from within spark sdk (default: false).
     */
    enableLogging?: boolean;
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
import { SparkReadonlyClient } from '#libs/spark-sdk';
import { SparkScanClient } from '#libs/sparkscan-client';
