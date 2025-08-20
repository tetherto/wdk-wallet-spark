/** @typedef {import('@wdk/wallet').IWalletAccount} IWalletAccount */
/** @typedef {import('@wdk/wallet').KeyPair} KeyPair */
/** @typedef {import('@wdk/wallet').TransactionResult} TransactionResult */
/** @typedef {import('@wdk/wallet').TransferOptions} TransferOptions */
/** @typedef {import('@wdk/wallet').TransferResult} TransferResult */
/** @typedef {import('./wallet-account-readonly-spark.js').SparkWalletConfig} SparkWalletConfig */
/** @typedef {import('./wallet-account-readonly-spark.js').SparkTransaction} SparkTransaction */
/** @typedef {import('@buildonspark/spark-sdk').SparkWallet} SparkWallet */
/** @typedef {import('@buildonspark/spark-sdk/signer').SparkSigner} SparkSigner */
/** @typedef {import('@buildonspark/spark-sdk/types').WalletLeaf} WalletLeaf */
/** @typedef {import('@buildonspark/spark-sdk/types').CoopExitRequest} CoopExitRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningReceiveRequest} LightningReceiveRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningSendRequest} LightningSendRequest */
/** @implements {IWalletAccount} */
export default class WalletAccountSpark extends WalletAccountReadOnlySpark implements IWalletAccount {
    /** @package */
    constructor(wallet: any, config: any);
    /** @private
     * @type {SparkSigner}
     */
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
     * Claims a deposit to the wallet.
  
     * @param {string} txId - The transaction id of the deposit.
     * @returns {Promise<WalletLeaf[] | undefined>} The nodes resulting from the deposit.
     */
    claimDeposit(txId: string): Promise<WalletLeaf[] | undefined>;
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
     * Returns a read-only copy of the account.
     *
     * @returns {Promise<never>} The read-only account.
     */
    toReadOnlyAccount(): Promise<never>;
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
export type IWalletAccount = import("@wdk/wallet").IWalletAccount;
export type KeyPair = import("@wdk/wallet").KeyPair;
export type TransactionResult = import("@wdk/wallet").TransactionResult;
export type TransferOptions = import("@wdk/wallet").TransferOptions;
export type TransferResult = import("@wdk/wallet").TransferResult;
export type SparkWalletConfig = import("./wallet-account-readonly-spark.js").SparkWalletConfig;
export type SparkTransaction = import("./wallet-account-readonly-spark.js").SparkTransaction;
export type SparkWallet = import("@buildonspark/spark-sdk").SparkWallet;
export type SparkSigner = import("@buildonspark/spark-sdk/signer").SparkSigner;
export type WalletLeaf = import("@buildonspark/spark-sdk/types").WalletLeaf;
export type CoopExitRequest = import("@buildonspark/spark-sdk/types").CoopExitRequest;
export type LightningReceiveRequest = import("@buildonspark/spark-sdk/types").LightningReceiveRequest;
export type LightningSendRequest = import("@buildonspark/spark-sdk/types").LightningSendRequest;
import WalletAccountReadOnlySpark from './wallet-account-readonly-spark.js';
