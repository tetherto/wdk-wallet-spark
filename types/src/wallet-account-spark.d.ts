/** @implements {IWalletAccount} */
export default class WalletAccountSpark extends WalletAccountReadOnlySpark implements IWalletAccount {
    /**
     * Creates a new spark wallet account.
     *
     * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
     * @param {number} index - The index of the account.
     * @param {SparkWalletConfig} [config] - The configuration object.
     * @returns {Promise<WalletAccountSpark>} The wallet account.
     */
    static at(seed: string | Uint8Array, index: number, config?: SparkWalletConfig): Promise<WalletAccountSpark>;
    /**
     * Creates a new WalletAccountSpark instance.
     *
     * @param {SparkWallet} wallet - The underlying Spark wallet instance.
     * @param {SparkWalletConfig} [config] - The configuration object.
     */
    constructor(wallet: any, config?: SparkWalletConfig);
    /** @private */
    private _wallet;
    /** @private */
    private _signer;
    /**
     * The derivation path's index of this account.
     *
     * @type {number}
     */
    get index(): number;
    /**
     * The derivation path of this account (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
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
     * Sends a transaction.
     *
     * @param {SparkTransaction} tx - The transaction.
     * @returns {Promise<TransactionResult>} The transaction's result.
     */
    sendTransaction({ to, value }: SparkTransaction): Promise<TransactionResult>;
    /**
     * Transfers a token to another address.
     *
     * @param {TransferOptions} options - The transfer's options.
     * @returns {Promise<TransferResult>} The transfer's result.
     */
    transfer(options: TransferOptions): Promise<TransferResult>;
    /**
     * Generates a single-use deposit address for bitcoin deposits from layer 1.
     * Once you deposit funds to this address, it cannot be used again.
     *
     * @returns {Promise<string>} The single-use deposit address.
     */
    getSingleUseDepositAddress(): Promise<string>;
    /**
     * Gets static deposit address for bitcoin deposits from layer 1.
     * This address can be reused.
     *
     * @returns {Promise<string>} The static deposit address.
     */
    getStaticDepositAddress(): Promise<string>;
    /**
     * Claims a deposit to the wallet.
     *
     * @param {string} txId - The transaction id of the deposit.
     * @returns {Promise<WalletLeaf[] | undefined>} The nodes resulting from the deposit.
     */
    claimDeposit(txId: string): Promise<WalletLeaf[] | undefined>;
    /**
     * Claims a static deposit to the wallet.
     *
     * @param {string} txId - The transaction id of the deposit.
     * @returns {Promise<WalletLeaf[] | undefined>} The nodes resulting from the deposit.
     */
    claimStaticDeposit(txId: string): Promise<WalletLeaf[] | undefined>;
    /**
     * Initiates a withdrawal to move funds from the Spark network to an on-chain Bitcoin address.
     *
     * @param {WithdrawOptions} options - The withdrawal's options.
     * @returns {Promise<CoopExitRequest | null | undefined>} The withdrawal request details, or null/undefined if the request cannot be completed.
     */
    withdraw({ to, value }: WithdrawOptions): Promise<CoopExitRequest | null | undefined>;
    /**
     * Creates a Lightning invoice for receiving payments.
     *
     * @param {CreateLightningInvoiceOptions} options - The invoice options.
     * @returns {Promise<LightningReceiveRequest>} BOLT11 encoded invoice.
     */
    createLightningInvoice({ value, memo }: CreateLightningInvoiceOptions): Promise<LightningReceiveRequest>;
    /**
     * Gets a Lightning receive request by id.
     *
     * @param {string} invoiceId - The id of the Lightning receive request.
     * @returns {Promise<LightningReceiveRequest | null>} The Lightning receive request.
     */
    getLightningReceiveRequest(invoiceId: string): Promise<LightningReceiveRequest | null>;
    /**
     * Pays a Lightning invoice.
     *
     * @param {PayLightningInvoiceOptions} options - The payment options.
     * @returns {Promise<LightningSendRequest>} The Lightning payment request details.
     */
    payLightningInvoice({ invoice, maxFeeSats }: PayLightningInvoiceOptions): Promise<LightningSendRequest>;
    /**
     * Gets fee estimate for sending Lightning payments.
     *
     * @param {GetLightningSendFeeEstimateOptions} options - The fee estimation options.
     * @returns {Promise<number>} Fee estimate for sending Lightning payments.
     */
    getLightningSendFeeEstimate({ invoice }: GetLightningSendFeeEstimateOptions): Promise<number>;
    /**
     * Returns the bitcoin transfer history of the account.
     *
     * @param {GetTransfersOptions} [options] - The options.
     * @returns {Promise<SparkTransfer[]>} The bitcoin transfers.
     */
    getTransfers(options?: GetTransfersOptions): Promise<SparkTransfer[]>;
    /**
     * Returns a read-only copy of the account.
     *
     * @returns {Promise<WalletAccountReadOnlySpark>} The read-only account.
     */
    toReadOnlyAccount(): Promise<WalletAccountReadOnlySpark>;
    /**
     * Cleans up and closes the connections with the spark blockchain.
     *
     * @returns {Promise<void>}
     */
    cleanupConnections(): Promise<void>;
    /**
     * Disposes the wallet account, erasing its private keys from the memory.
     *
     * @returns {void}
     */
    dispose(): void;
}
export type WalletLeaf = import("@buildonspark/spark-sdk/types").WalletLeaf;
export type CoopExitRequest = import("@buildonspark/spark-sdk/types").CoopExitRequest;
export type LightningReceiveRequest = import("@buildonspark/spark-sdk/types").LightningReceiveRequest;
export type LightningSendRequest = import("@buildonspark/spark-sdk/types").LightningSendRequest;
export type SparkTransfer = import("@buildonspark/spark-sdk/types").WalletTransfer;
export type SparkTransactionReceipt = import("@sparkscan/api-node-sdk-client").TxV1Response;
export type IWalletAccount = import("@tetherto/wdk-wallet").IWalletAccount;
export type KeyPair = import("@tetherto/wdk-wallet").KeyPair;
export type TransactionResult = import("@tetherto/wdk-wallet").TransactionResult;
export type TransferOptions = import("@tetherto/wdk-wallet").TransferOptions;
export type TransferResult = import("@tetherto/wdk-wallet").TransferResult;
export type SparkTransaction = import("./wallet-account-read-only-spark.js").SparkTransaction;
export type SparkWalletConfig = import("./wallet-account-read-only-spark.js").SparkWalletConfig;
export type WithdrawOptions = {
    /**
     * - The Bitcoin address where the funds should be sent.
     */
    to: string;
    /**
     * - The amount in satoshis to withdraw.
     */
    value: number;
};
export type CreateLightningInvoiceOptions = {
    /**
     * - The amount in satoshis.
     */
    value: number;
    /**
     * - An optional description for the invoice.
     */
    memo?: string;
};
export type PayLightningInvoiceOptions = {
    /**
     * - The BOLT11-encoded Lightning invoice to pay.
     */
    invoice: string;
    /**
     * - The maximum fee in satoshis to pay.
     */
    maxFeeSats: number;
};
export type GetLightningSendFeeEstimateOptions = {
    /**
     * - The BOLT11-encoded Lightning invoice to estimate fees for.
     */
    invoice: string;
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
import WalletAccountReadOnlySpark from './wallet-account-read-only-spark.js';
