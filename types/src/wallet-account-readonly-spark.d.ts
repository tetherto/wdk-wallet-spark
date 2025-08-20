export default WalletAccountReadOnlySpark;
export type NetworkType = import("@buildonspark/spark-sdk").NetworkType;
export type SparkTransactionReceipt = import("@sparkscan/api-node-sdk-client").GetTransactionDetailsByIdV1TxTxidGet200;
export type TransactionResult = import("@wdk/wallet").TransactionResult;
export type TransferOptions = import("@wdk/wallet").TransferOptions;
export type TransferResult = import("@wdk/wallet").TransferResult;
export type SparkWalletConfig = {
    /**
     * - The network (default: "MAINNET").
     */
    network?: NetworkType;
    /**
     * - The SparkScan API key.
     */
    sparkScanApiKey?: string;
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
declare class WalletAccountReadOnlySpark extends WalletAccountReadOnly {
    /**
      * Creates a new spark read-only wallet account.
      *
      * @param {string} address - The account's address.
      * @param {SparkWalletConfig} [config] - The configuration object.
      */
    constructor(address: string, config?: SparkWalletConfig);
    /** @protected
     * @type {SparkWalletConfig}
     */
    protected _config: SparkWalletConfig;
    /** @private
     * @type {Promise<SparkWallet>}
     */
    private _wallet;
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
     * Generates a single-use deposit address for bitcoin deposits from layer 1.
     * Once you deposit funds to this address, it cannot be used again.
     *
     * @returns {Promise<string>} The single-use deposit address.
     */
    getSingleUseDepositAddress(): Promise<string>;
    /**
     * Returns a transaction's receipt.
     *
     * @param {string} hash - The transaction's hash.
     * @returns {Promise<SparkTransactionReceipt | null>} The receipt, or null if the transaction has not been included in a block yet.
     */
    getTransactionReceipt(hash: string): Promise<SparkTransactionReceipt | null>;
    /**
     * Checks for a confirmed deposit to the specified deposit address.
     *
     * @param {string} depositAddress - The deposit address to check.
     * @returns {Promise<string | null>} The transaction id if found, null otherwise.
     */
    getLatestDepositTxId(depositAddress: string): Promise<string | null>;
    /**
     * Get a Lightning receive request by id.
     *
     * @param {string} invoiceId - The id of the Lightning receive request.
     * @returns {Promise<LightningReceiveRequest | null>} The Lightning receive request.
     */
    getLightningReceiveRequest(invoiceId: string): Promise<LightningReceiveRequest | null>;
    /**
     * Returns the bitcoin transfer history of the account.
     *
     * @param {Object} [options] - The options.
     * @param {"incoming" | "outgoing" | "all"} [options.direction] - If set, only returns transfers with the given direction (default: "all").
     * @param {number} [options.limit] - The number of transfers to return (default: 10).
     * @param {number} [options.skip] - The number of transfers to skip (default: 0).
     * @returns {Promise<SparkTransactionReceipt[]>} The bitcoin transfers.
     */
    getTransfers(options?: {
        direction?: "incoming" | "outgoing" | "all";
        limit?: number;
        skip?: number;
    }): Promise<SparkTransactionReceipt[]>;
}
import { WalletAccountReadOnly } from '@wdk/wallet';
