export class SparkScanClient {
    /**
     * Creates a new sparkscan client.
     *
     * @param {SparkScanConfig} config
     */
    constructor(config?: SparkScanConfig);
    _baseUrl: string;
    _network: "MAINNET" | "TESTNET" | "SIGNET" | "REGTEST" | "LOCAL";
    _headers: {
        'Content-Type': string;
    };
    _request(path: any, headers?: {}, method?: string, query?: {}): Promise<any>;
    /**
     * Get account information for an address
     * @see https://docs.sparkscan.io/api/address#get-v1-address-by-address
     * @param {string} address Spark address
     * @returns {Promise<AddressInfo>} Account information
     */
    getAddressInfo(address: string): Promise<AddressInfo>;
}
export type NetworkType = import("@buildonspark/spark-sdk").NetworkType;
export type SparkScanConfig = {
    /**
     * - Optional sparkscan url (default: https://api.sparkscan.io)
     */
    baseUrl?: string;
    /**
     * - Optional spark network
     */
    network?: NetworkType;
    /**
     * - Sparkscan api key
     */
    apiKey?: string;
};
export type AddressBalance = {
    /**
     * - Soft BTC balance in sats (pending + confirmed)
     */
    btcSoftBalanceSats: number;
    /**
     * - Hard BTC balance in sats (confirmed only)
     */
    btcHardBalanceSats: number;
    /**
     * - USD value of hard balance
     */
    btcValueUsdHard: number;
    /**
     * - USD value of soft balance
     */
    btcValueUsdSoft: number;
    /**
     * - Total USD value of all tokens held
     */
    totalTokenValueUsd: number;
};
export type AddressToken = {
    /**
     * - Unique token identifier (hex)
     */
    tokenIdentifier: string;
    /**
     * - Token bech32 address
     */
    tokenAddress: string;
    /**
     * - Token display name
     */
    name: string;
    /**
     * - Token ticker symbol
     */
    ticker: string;
    /**
     * - Token decimal places
     */
    decimals: number;
    /**
     * - Token balance as a decimal string
     */
    balance: string;
    /**
     * - USD value of the balance
     */
    valueUsd: number;
    /**
     * - Public key of the token issuer
     */
    issuerPublicKey: string;
    maxSupply: string | null;
    isFreezable: boolean | null;
};
export type AddressInfo = {
    /**
     * - The Spark bech32 address
     */
    sparkAddress: string;
    /**
     * - The public key hex
     */
    publicKey: string;
    balance: AddressBalance;
    /**
     * - Total portfolio value in USD
     */
    totalValueUsd: number;
    /**
     * - Total number of transactions
     */
    transactionCount: number;
    /**
     * - Number of distinct tokens held
     */
    tokenCount: number;
    tokens: Array<AddressToken> | null;
};
