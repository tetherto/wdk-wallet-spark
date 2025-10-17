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
    /** @package */
    constructor(wallet, config);
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
     * Sends a transaction.
     *
     * @param {SparkTransaction} tx - The transaction.
     * @returns {Promise<TransactionResult>} The transaction's result.
     */
    sendTransaction(tx: SparkTransaction): Promise<TransactionResult>;
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
     * Get static deposit address for bitcoin deposits from layer 1.
     * This address can be reused.
     *
     * @returns {Promise<string>} The static deposit address.
     */
    getStaticDepositAddress(): Promise<string>;
    /**
     * Claims a deposit to the wallet.
  
     * @param {string} txId - The transaction id of the deposit.
     * @returns {Promise<WalletLeaf[] | undefined>} The nodes resulting from the deposit.
     */
    claimDeposit(txId: string): Promise<WalletLeaf[] | undefined>;
    /**
     * Claims a static deposit to the wallet.
  
     * @param {string} txId - The transaction id of the deposit.
     * @returns {Promise<WalletLeaf[] | undefined>} The nodes resulting from the deposit.
     */
    claimStaticDeposit(txId: string): Promise<WalletLeaf[] | undefined>;
    /**
     * Returns confirmed utxos for a given spark deposit address.
     *
     * @param {string} depositAddress - The deposit address to query.
     * @param {number} [limit] - Maximum number of utxos to return (default 100).
     * @param {number} [offset] - Pagination offset (default 0).
     * @returns {Promise<string[]>} List of confirmed utxos.
     */
    getUtxosForDepositAddress(depositAddress: string, limit?: number, offset?: number): Promise<string[]>;
    /**
     * Initiates a withdrawal to move funds from the Spark network to an on-chain Bitcoin address.
     *
     * @param {Object} options - The withdrawal's options.
     * @param {string} options.to - The Bitcoin address where the funds should be sent.
     * @param {number} options.value - The amount in satoshis to withdraw.
     * @returns {Promise<CoopExitRequest | null | undefined>} The withdrawal request details, or null/undefined if the request cannot be completed.
     */
    withdraw({ to, value }: {
        to: string;
        value: number;
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
     */
    dispose(): void;
}
export type WalletLeaf = import("@buildonspark/spark-sdk/types").WalletLeaf;
export type CoopExitRequest = import("@buildonspark/spark-sdk/types").CoopExitRequest;
export type LightningReceiveRequest = import("@buildonspark/spark-sdk/types").LightningReceiveRequest;
export type LightningSendRequest = import("@buildonspark/spark-sdk/types").LightningSendRequest;
export type SparkTransfer = import("@buildonspark/spark-sdk/types").WalletTransfer;
export type IWalletAccount = import("@tetherto/wdk-wallet").IWalletAccount;
export type KeyPair = import("@tetherto/wdk-wallet").KeyPair;
export type TransactionResult = import("@tetherto/wdk-wallet").TransactionResult;
export type TransferOptions = import("@tetherto/wdk-wallet").TransferOptions;
export type TransferResult = import("@tetherto/wdk-wallet").TransferResult;
export type SparkTransaction = import("./wallet-account-read-only-spark.js").SparkTransaction;
export type SparkWalletConfig = import("./wallet-account-read-only-spark.js").SparkWalletConfig;
import WalletAccountReadOnlySpark from './wallet-account-read-only-spark.js';
