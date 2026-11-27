/** @implements {IWalletAccount} */
export default class WalletAccountSpark extends WalletAccountReadOnlySpark implements IWalletAccount {
    /**
     * Creates a new spark wallet account.
     *
     * @param {string | Uint8Array} seed - A [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) mnemonic seed phrase, or a raw BIP-32 master seed (16-64 bytes).
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
     * The uint8 arrays are bound to the wallet account, so any external change will reflect to the internal representation. For this reason,
     * it's strongly recommended to treat the key pair as a read-only view of the keys. While it's still technically possible to alter their
     * content, client code should never do so.
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
     * Signs a transaction.
     *
     * Not supported on spark: transfers are signed collaboratively with the spark operators
     * via a FROST / Statechain protocol, so a signed payload cannot be produced locally and
     * broadcast independently. Use `sendTransaction` instead.
     *
     * @param {SparkTransaction} tx - The transaction.
     * @returns {Promise<never>} Never resolves; always throws.
     * @throws {UnsupportedOperationError} Always — spark transfers cannot be signed locally.
     */
    signTransaction(tx: SparkTransaction): Promise<never>;
    /**
     * Sends a transaction.
     *
     * When `syncAndRetry` is true, the transaction is submitted at most once: if the send
     * fails, the account reconciles against transfer history and returns the transfer that
     * reached the network, so a lost response is never paid twice. Concurrent identical
     * sends (same amount and recipient) from one wallet cannot be told apart, so callers
     * should not run those payments in parallel.
     *
     * @param {SparkTransaction} tx - The transaction.
     * @returns {Promise<TransactionResult>} The transaction's result.
     * @throws {SparkValidationError} When `syncAndRetry` is true and the recipient address is not valid for the wallet's network.
     * @throws {SparkError} When `syncAndRetry` is true and the transfer history cannot be read. The transaction is not submitted.
     * @throws {SparkError} If the send fails and no matching transfer appears in history.
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
     * Returns a static deposit address for Bitcoin deposits from layer 1,
     * generating one if it does not already exist. The address is reusable.
     *
     * @returns {Promise<string>} The static deposit address.
     */
    getStaticDepositAddress(): Promise<string>;
    /**
     * Reconciles a static deposit using only positive coordinator and SSP evidence.
     *
     * This method never infers that a deposit is unclaimed from missing history or
     * credit. `claimable` is a read-only snapshot and is not authorization to
     * refund. `unknown` is inconclusive rather than terminal, so callers may poll
     * again. Spark currently exposes no authoritative refunded/spent status.
     *
     * A claim is decided from its Spark transfer rather than the SSP request's own status:
     * the SSP's `SPEND_TX_*` statuses track its on-chain sweep of the deposit and are not
     * all known to every SDK version, so a request can settle successfully while reporting
     * a status this method doesn't recognize.
     *
     * @param {GetStaticDepositStatusOptions} options - The static deposit outpoint.
     * @returns {Promise<StaticDepositStatus>} The conservatively reconciled status.
     * @throws {ValueError} If the transaction ID or output index is invalid.
     * @throws {SparkError} If the coordinator or SSP evidence cannot be fetched.
     */
    getStaticDepositStatus(options: GetStaticDepositStatusOptions): Promise<StaticDepositStatus>;
    /**
     * Reconciles several static deposits from a single coordinator/SSP scan.
     *
     * Equivalent to calling `getStaticDepositStatus` once per outpoint, but pages through
     * the unclaimed UTXOs and SSP claim requests only once, which matters for a caller
     * polling the status of many pending deposits at once.
     *
     * @param {GetStaticDepositStatusOptions[]} optionsList - The static deposit outpoints.
     * @returns {Promise<StaticDepositStatus[]>} The conservatively reconciled status for each outpoint, in the given order.
     * @throws {ValueError} If any transaction ID or output index is invalid.
     * @throws {SparkError} If the coordinator or SSP evidence cannot be fetched.
     */
    getStaticDepositStatuses(optionsList: GetStaticDepositStatusOptions[]): Promise<StaticDepositStatus[]>;
    /**
     * Claims a deposit to the wallet.
     *
     * @param {string} txId - The transaction id of the deposit.
     * @returns {Promise<WalletLeaf[] | undefined>} The nodes resulting from the deposit.
     */
    claimDeposit(txId: string): Promise<WalletLeaf[] | undefined>;
    /**
     * Gets the SSP credit quote for a static deposit and calculates its fee from
     * the caller-provided Bitcoin output amount.
     *
     * The deposit amount is not verified by this method. Callers must use the
     * amount of the exact Bitcoin output identified by `txId` and `outputIndex`.
     *
     * @param {ClaimStaticDepositQuoteOptions} options - The quote options.
     * @returns {Promise<ClaimStaticDepositQuote>} The static-deposit claim quote.
     */
    getClaimStaticDepositQuote(options: ClaimStaticDepositQuoteOptions): Promise<ClaimStaticDepositQuote>;
    /**
     * Claims a static deposit to the wallet.
     *
     * The SSP quotes the credit and this account signs it, so a quote that is not a plain
     * amount in satoshis is refused: claiming hands over the deposit's secret key and cannot
     * be undone. The amount is not bounded — nothing here knows the deposit's on-chain value.
     * When `maxFeeSats` is provided, the Spark SDK calculates the actual fee
     * (deposit minus credit) from the quote and only proceeds with the claim if
     * it does not exceed the provided maximum.
     *
     * @param {string} txId - The transaction id of the deposit.
     * @param {ClaimStaticDepositOptions} [options] - Optional claim constraints.
     * @returns {Promise<ClaimStaticDepositResult>} The Spark transfer created by the claim.
     * @throws {ValueError} If the SSP quotes a credit that is not a safe positive integer number of satoshis, which every credit below Bitcoin's total supply is.
     * @throws {StaticDepositFeeExceededError} If the exact claim fee exceeds the approved maximum.
     */
    claimStaticDeposit(txId: string, options?: ClaimStaticDepositOptions): Promise<ClaimStaticDepositResult>;
    /**
     * Refunds a deposit made to a static deposit address back to a specified Bitcoin address.
     * The fee rate must be less than 150 sats per vbyte, and the resulting transaction fee
     * must be at least 194 satoshis.
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
     * @throws {ValueError} If the withdraw max. fee option is set and the exit speed is not "FAST", "MEDIUM" or "SLOW".
     * @throws {MaximumFeeExceededError} If the quoted fee for the chosen exit speed surpasses the withdraw max. fee option.
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
     * When `syncAndRetry` is true, the payment carries a Spark transfer id that is reused if
     * the payment is retried, so the retry settles once instead of paying twice. The id is
     * available on the thrown error as `transferId`.
     *
     * @param {PayLightningInvoiceParams} options - The payment options.
     * @returns {Promise<LightningSendRequest>} The Lightning payment request details.
     * @throws {LightningPaymentError} When `syncAndRetry` is true and the payment fails with an error that is not retried. Its `transferId` is the id the payment was sent with.
     * @throws {LightningPaymentError} When `syncAndRetry` is true and the stale-leaf retry also fails. Its `transferId` is the id both attempts were sent with.
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
     * Reconciles the wallet's internal state with the server and waits
     * for any triggered optimisation to complete.
     *
     * @returns {Promise<void>}
     */
    syncWalletBalance(): Promise<void>;
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
     * The private key bytes held by the account's signer are zeroed. Other copies made while deriving the keys,
     * including the master key derived from the seed and the bigint form of each key, are not zeroed and are
     * left to the garbage collector.
     *
     * @returns {void}
     */
    dispose(): void;
    /**
     * Tells whether an error reports leaves the wallet still believes it can spend, but
     * which the operators have already locked or reassigned.
     *
     * The operators report this condition as message text on a gRPC error. The SDK exposes
     * no error class or code that distinguishes it, and matches the same fragments in its
     * own leaf manager. Override this if a future SDK version identifies it properly.
     *
     * @protected
     * @param {Error} error - An error thrown by the Spark SDK.
     * @returns {boolean} Whether the error reports stale leaves.
     */
    protected _isStaleLeafError(error: Error): boolean;
    /** @private */
    private _validateStaticDepositStatusOptions;
    /** @private */
    private _resolveStaticDepositStatus;
    /** @private */
    private _listMatchingOutgoingTransfers;
    /** @private */
    private _findOutgoingTransfer;
}
export type WalletLeaf = import("@buildonspark/spark-sdk/types").WalletLeaf;
export type CoopExitRequest = import("@buildonspark/spark-sdk/types").CoopExitRequest;
export type LightningReceiveRequest = import("@buildonspark/spark-sdk/types").LightningReceiveRequest;
export type LightningSendRequest = import("@buildonspark/spark-sdk/types").LightningSendRequest;
export type CoopExitFeeQuote = import("@buildonspark/spark-sdk/types").CoopExitFeeQuote;
export type LightningSendFeeEstimateInput = import("@buildonspark/spark-sdk/types").LightningSendFeeEstimateInput;
export type WithdrawParams = import("@buildonspark/spark-sdk").WithdrawParams;
export type CreateLightningInvoiceParams = import("@buildonspark/spark-sdk").CreateLightningInvoiceParams;
export type PayLightningInvoiceParams = import("@buildonspark/spark-sdk").PayLightningInvoiceParams;
export type SparkAddressFormat = import("@buildonspark/spark-sdk").SparkAddressFormat;
export type FulfillSparkInvoiceResponse = import("@buildonspark/spark-sdk").FulfillSparkInvoiceResponse;
export type SparkValidationError = import("@buildonspark/spark-sdk").SparkValidationError;
export type IWalletAccount = import("@tetherto/wdk-wallet").IWalletAccount;
export type KeyPair = import("@tetherto/wdk-wallet").KeyPair;
export type TransactionResult = import("@tetherto/wdk-wallet").TransactionResult;
export type TransferOptions = import("@tetherto/wdk-wallet").TransferOptions;
export type TransferResult = import("@tetherto/wdk-wallet").TransferResult;
export type SparkTransaction = import("./wallet-account-read-only-spark.js").SparkTransaction;
export type SparkWalletConfig = import("./wallet-account-read-only-spark.js").SparkWalletConfig;
export type WithdrawOptions = Omit<WithdrawParams, "feeQuote">;
export type ClaimStaticDepositResult = import("@buildonspark/spark-sdk/types").ClaimStaticDepositOutput;
export type StaticDepositQuoteOutput = import("@buildonspark/spark-sdk/types").StaticDepositQuoteOutput;
export type ClaimStaticDepositQuoteOptions = {
    /**
     * - The transaction ID of the deposit.
     */
    txId: string;
    /**
     * - The caller-provided amount of the Bitcoin deposit output.
     */
    depositAmountSats: number;
    /**
     * - The output index of the deposit. The Spark SDK detects it when omitted.
     */
    outputIndex?: number;
};
export type ClaimStaticDepositQuote = Pick<StaticDepositQuoteOutput, "transactionId" | "outputIndex" | "creditAmountSats"> & {
    depositAmountSats: number;
    claimFeeSats: number;
};
export type ClaimStaticDepositOptions = {
    /**
     * - The maximum claim fee approved by the caller.
     */
    maxFeeSats?: number;
};
export type GetStaticDepositStatusOptions = {
    /**
     * - The transaction ID of the deposit.
     */
    txId: string;
    /**
     * - The output index of the deposit.
     */
    outputIndex?: number;
};
export type StaticDepositAwaitingConfirmationsStatus = {
    /**
     * - The deposit is visible to the coordinator but is not yet confirmed.
     */
    status: "awaiting-confirmations";
    /**
     * - The transaction ID of the deposit.
     */
    transactionId: string;
    /**
     * - The output index of the deposit.
     */
    outputIndex: number;
};
export type StaticDepositClaimableStatus = {
    /**
     * - The coordinator reports the confirmed outpoint as unclaimed.
     */
    status: "claimable";
    /**
     * - The transaction ID of the deposit.
     */
    transactionId: string;
    /**
     * - The output index of the deposit.
     */
    outputIndex: number;
};
export type StaticDepositClaimInProgressStatus = {
    /**
     * - The SSP has an active, not-yet-completed claim request for the outpoint.
     */
    status: "claim-in-progress";
    /**
     * - The transaction ID of the deposit.
     */
    transactionId: string;
    /**
     * - The output index of the deposit.
     */
    outputIndex: number;
    /**
     * - The SSP claim request ID.
     */
    requestId: string;
    /**
     * - The observed SSP claim request status (e.g. `CREATED`, `TRANSFER_CREATED`, `SPEND_TX_CREATED`, `SPEND_TX_BROADCAST`). Informational only: whether the claim is in progress is decided from its transfer, not this value.
     */
    requestStatus: string;
    /**
     * - The SSP-quoted credit amount, in satoshis.
     */
    creditAmountSats: number;
};
export type StaticDepositClaimedStatus = {
    /**
     * - The claim's Spark transfer has completed.
     */
    status: "claimed";
    /**
     * - The transaction ID of the deposit.
     */
    transactionId: string;
    /**
     * - The output index of the deposit.
     */
    outputIndex: number;
    /**
     * - The SSP claim request ID.
     */
    requestId: string;
    /**
     * - The Spark transfer ID created by the claim.
     */
    transferId: string;
    /**
     * - The SSP-quoted credit amount, in satoshis.
     */
    creditAmountSats: number;
};
export type StaticDepositUnknownStatus = {
    /**
     * - Available evidence does not prove another state.
     */
    status: "unknown";
    /**
     * - The transaction ID of the deposit.
     */
    transactionId: string;
    /**
     * - The output index when it can be resolved unambiguously.
     */
    outputIndex?: number;
    /**
     * - Why no authoritative state was returned.
     */
    reason: "NOT_FOUND" | "AMBIGUOUS_OUTPUT" | "CONFLICTING_EVIDENCE" | "INCOMPLETE_EVIDENCE" | "MALFORMED_CLAIM_RESULT";
    /**
     * - Claim request statuses observed for the outpoint.
     */
    observedClaimStatuses?: string[];
};
export type StaticDepositStatus = StaticDepositAwaitingConfirmationsStatus | StaticDepositClaimableStatus | StaticDepositClaimInProgressStatus | StaticDepositClaimedStatus | StaticDepositUnknownStatus;
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
