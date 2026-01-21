/** @typedef {import('@buildonspark/spark-sdk/types').WalletLeaf} WalletLeaf */
/** @typedef {import('@buildonspark/spark-sdk/types').CoopExitRequest} CoopExitRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningReceiveRequest} LightningReceiveRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningSendRequest} LightningSendRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').WalletTransfer} SparkTransfer */
/** @typedef {import('@buildonspark/spark-sdk/types').CoopExitFeeQuote} CoopExitFeeQuote */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningSendFeeEstimateInput} LightningSendFeeEstimateInput */
/** @typedef {import('@buildonspark/spark-sdk').WithdrawParams} WithdrawParams */
/** @typedef {import('@buildonspark/spark-sdk').CreateLightningInvoiceParams} CreateLightningInvoiceParams */
/** @typedef {import('@buildonspark/spark-sdk').PayLightningInvoiceParams} PayLightningInvoiceParams */
/** @typedef {import('@buildonspark/spark-sdk').SparkAddressFormat} SparkAddressFormat */
/** @typedef {import('@buildonspark/spark-sdk').FulfillSparkInvoiceResponse} FulfillSparkInvoiceResponse */
/** @typedef {import('@buildonspark/spark-sdk/proto/spark').QuerySparkInvoicesResponse} QuerySparkInvoicesResponse */
/** @typedef {import('@tetherto/wdk-wallet').IWalletAccount} IWalletAccount */
/** @typedef {import('@tetherto/wdk-wallet').KeyPair} KeyPair */
/** @typedef {import('@tetherto/wdk-wallet').TransactionResult} TransactionResult */
/** @typedef {import('@tetherto/wdk-wallet').TransferOptions} TransferOptions */
/** @typedef {import('@tetherto/wdk-wallet').TransferResult} TransferResult */
/** @typedef {import('./wallet-account-read-only-spark.js').SparkTransaction} SparkTransaction */
/** @typedef {import('./wallet-account-read-only-spark.js').SparkWalletConfig} SparkWalletConfig */
/** @typedef {Omit<WithdrawParams, 'feeQuote'>} WithdrawOptions */
/**
 * @typedef {Object} QuoteWithdrawOptions
 * @property {string} withdrawalAddress - The Bitcoin address where the funds should be sent.
 * @property {number} amountSats - The amount in satoshis to withdraw.
 */
/**
 * @typedef {Object} GetTransfersOptions
 * @property {"incoming" | "outgoing" | "all"} [direction] - If set, only returns transfers with the given direction (default: "all").
 * @property {number} [limit] - The number of transfers to return (default: 10).
 * @property {number} [skip] - The number of transfers to skip (default: 0).
 */
/**
 * @typedef {Object} RefundStaticDepositOptions
 * @property {string} depositTransactionId - The transaction ID of the original deposit.
 * @property {number} outputIndex - The output index of the deposit.
 * @property {string} destinationAddress - The Bitcoin address to send the refund to.
 * @property {number} satsPerVbyteFee - The fee rate in sats per vbyte for the refund transaction.
 */
/**
 * @typedef {Object} CreateSatsInvoiceOptions
 * @property {number} [amount] - The amount of sats to receive (optional for open invoices).
 * @property {string} [memo] - Optional memo/description for the payment.
 * @property {SparkAddressFormat} [senderSparkAddress] - Optional Spark address of the expected sender.
 * @property {Date} [expiryTime] - Optional expiry time for the invoice.
 */
/**
 * @typedef {Object} CreateTokensInvoiceOptions
 * @property {string} [tokenIdentifier] - The Bech32m token identifier (e.g., `btkn1...`).
 * @property {bigint} [amount] - The amount of tokens to receive.
 * @property {string} [memo] - Optional memo/description for the payment.
 * @property {SparkAddressFormat} [senderSparkAddress] - Optional Spark address of the expected sender.
 * @property {Date} [expiryTime] - Optional expiry time for the invoice.
 */
/**
 * @typedef {Object} SparkInvoice
 * @property {SparkAddressFormat} invoice - The Spark invoice to pay.
 * @property {bigint} [amount] - Amount to pay (required for invoices without encoded amount).
 */
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
    constructor(wallet: SparkWallet, config?: SparkWalletConfig);
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
     * Returns the account's Spark address.
     *
     * @returns {Promise<SparkAddressFormat>} The account's Spark address.
     */
    getAddress(): Promise<SparkAddressFormat>;
    /**
     * Signs a message.
     *
     * @param {string} message - The message to sign.
     * @returns {Promise<string>} The message's signature.
     */
    sign(message: string): Promise<string>;
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
     * Gets all unused single-use deposit addresses.
     *
     * @returns {Promise<string[]>} List of unused deposit addresses.
     */
    getUnusedDepositAddresses(): Promise<string[]>;
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
     * Refunds a deposit made to a static deposit address back to a specified Bitcoin address.
     * The minimum fee is 300 satoshis.
     *
     * @param {RefundStaticDepositOptions} options - The refund options.
     * @returns {Promise<string>} The refund transaction as a hex string that needs to be broadcast.
     */
    refundStaticDeposit(options: RefundStaticDepositOptions): Promise<string>;
    /**
     * Gets a fee quote for withdrawing funds from Spark cooperatively to an on-chain Bitcoin address.
     *
     * @param {QuoteWithdrawOptions} options - The withdrawal's options.
     * @returns {Promise<CoopExitFeeQuote>} The withdrawal fee quote.
     */
    quoteWithdraw(options: QuoteWithdrawOptions): Promise<CoopExitFeeQuote>;
    /**
     * Initiates a withdrawal to move funds from the Spark network to an on-chain Bitcoin address.
     *
     * @param {WithdrawOptions} options - The withdrawal's options.
     * @returns {Promise<CoopExitRequest | null | undefined>} The withdrawal request details, or null/undefined if the request cannot be completed.
     */
    withdraw(options: WithdrawOptions): Promise<CoopExitRequest | null | undefined>;
    /**
     * Creates a Lightning invoice for receiving payments.
     *
     * @param {CreateLightningInvoiceParams} options - The invoice options.
     * @returns {Promise<LightningReceiveRequest>} BOLT11 encoded invoice.
     */
    createLightningInvoice(options: CreateLightningInvoiceParams): Promise<LightningReceiveRequest>;
    /**
     * Gets a Lightning receive request by id.
     *
     * @param {string} invoiceId - The id of the Lightning receive request.
     * @returns {Promise<LightningReceiveRequest | null>} The Lightning receive request.
     */
    getLightningReceiveRequest(invoiceId: string): Promise<LightningReceiveRequest | null>;
    /**
     * Gets a Lightning send request by id.
     *
     * @param {string} requestId - The id of the Lightning send request.
     * @returns {Promise<LightningSendRequest | null>} The Lightning send request.
     */
    getLightningSendRequest(requestId: string): Promise<LightningSendRequest | null>;
    /**
     * Pays a Lightning invoice.
     *
     * @param {PayLightningInvoiceParams} options - The payment options.
     * @returns {Promise<LightningSendRequest>} The Lightning payment request details.
     */
    payLightningInvoice(options: PayLightningInvoiceParams): Promise<LightningSendRequest>;
    /**
     * Gets fee estimate for sending Lightning payments.
     *
     * @param {LightningSendFeeEstimateInput} options - The fee estimation options.
     * @returns {Promise<bigint>} Fee estimate for sending Lightning payments.
     */
    quotePayLightningInvoice(options: LightningSendFeeEstimateInput): Promise<bigint>;
    /**
     * Creates a Spark invoice for receiving a sats payment.
     *
     * @param {CreateSatsInvoiceOptions} options - The invoice options.
     * @returns {Promise<SparkAddressFormat>} A Spark invoice that can be paid by another Spark wallet.
     */
    createSparkSatsInvoice(options: CreateSatsInvoiceOptions): Promise<SparkAddressFormat>;
    /**
     * Creates a Spark invoice for receiving a token payment.
     *
     * @param {CreateTokensInvoiceOptions} options - The invoice options.
     * @returns {Promise<SparkAddressFormat>} A Spark invoice that can be paid by another Spark wallet.
     */
    createSparkTokensInvoice(options: CreateTokensInvoiceOptions): Promise<SparkAddressFormat>;
    /**
     * Fulfills one or more Spark invoices by paying them.
     *
     * @param {SparkInvoice[]} invoices - Array of invoices to fulfill.
     * @returns {Promise<FulfillSparkInvoiceResponse>} Response containing transaction results and errors.
     */
    paySparkInvoice(invoices: SparkInvoice[]): Promise<FulfillSparkInvoiceResponse>;
    /**
     * Queries the status of Spark invoices.
     *
     * @param {string[]} invoices - Array of invoices to query.
     * @returns {Promise<QuerySparkInvoicesResponse>} Response containing invoice status information.
     */
    getSparkInvoices(invoices: string[]): Promise<QuerySparkInvoicesResponse>;
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
export type CoopExitFeeQuote = import("@buildonspark/spark-sdk/types").CoopExitFeeQuote;
export type LightningSendFeeEstimateInput = import("@buildonspark/spark-sdk/types").LightningSendFeeEstimateInput;
export type WithdrawParams = import("@buildonspark/spark-sdk").WithdrawParams;
export type CreateLightningInvoiceParams = import("@buildonspark/spark-sdk").CreateLightningInvoiceParams;
export type PayLightningInvoiceParams = import("@buildonspark/spark-sdk").PayLightningInvoiceParams;
export type SparkAddressFormat = import("@buildonspark/spark-sdk").SparkAddressFormat;
export type FulfillSparkInvoiceResponse = import("@buildonspark/spark-sdk").FulfillSparkInvoiceResponse;
export type QuerySparkInvoicesResponse = import("@buildonspark/spark-sdk/proto/spark").QuerySparkInvoicesResponse;
export type IWalletAccount = import("@tetherto/wdk-wallet").IWalletAccount;
export type KeyPair = import("@tetherto/wdk-wallet").KeyPair;
export type TransactionResult = import("@tetherto/wdk-wallet").TransactionResult;
export type TransferOptions = import("@tetherto/wdk-wallet").TransferOptions;
export type TransferResult = import("@tetherto/wdk-wallet").TransferResult;
export type SparkTransaction = import("./wallet-account-read-only-spark.js").SparkTransaction;
export type SparkWalletConfig = import("./wallet-account-read-only-spark.js").SparkWalletConfig;
export type WithdrawOptions = Omit<WithdrawParams, "feeQuote">;
export type QuoteWithdrawOptions = {
    /**
     * - The Bitcoin address where the funds should be sent.
     */
    withdrawalAddress: string;
    /**
     * - The amount in satoshis to withdraw.
     */
    amountSats: number;
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
export type RefundStaticDepositOptions = {
    /**
     * - The transaction ID of the original deposit.
     */
    depositTransactionId: string;
    /**
     * - The output index of the deposit.
     */
    outputIndex: number;
    /**
     * - The Bitcoin address to send the refund to.
     */
    destinationAddress: string;
    /**
     * - The fee rate in sats per vbyte for the refund transaction.
     */
    satsPerVbyteFee: number;
};
export type CreateSatsInvoiceOptions = {
    /**
     * - The amount of sats to receive (optional for open invoices).
     */
    amount?: number;
    /**
     * - Optional memo/description for the payment.
     */
    memo?: string;
    /**
     * - Optional Spark address of the expected sender.
     */
    senderSparkAddress?: SparkAddressFormat;
    /**
     * - Optional expiry time for the invoice.
     */
    expiryTime?: Date;
};
export type CreateTokensInvoiceOptions = {
    /**
     * - The Bech32m token identifier (e.g., `btkn1...`).
     */
    tokenIdentifier?: string;
    /**
     * - The amount of tokens to receive.
     */
    amount?: bigint;
    /**
     * - Optional memo/description for the payment.
     */
    memo?: string;
    /**
     * - Optional Spark address of the expected sender.
     */
    senderSparkAddress?: SparkAddressFormat;
    /**
     * - Optional expiry time for the invoice.
     */
    expiryTime?: Date;
};
export type SparkInvoice = {
    /**
     * - The Spark invoice to pay.
     */
    invoice: SparkAddressFormat;
    /**
     * - Amount to pay (required for invoices without encoded amount).
     */
    amount?: bigint;
};
import WalletAccountReadOnlySpark from './wallet-account-read-only-spark.js';
import { SparkWallet } from '#libs/spark-sdk';
