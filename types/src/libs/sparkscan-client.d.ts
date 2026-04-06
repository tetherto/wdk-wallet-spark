/** @typedef {import('@buildonspark/spark-sdk').NetworkType} NetworkType */
/**
 * @typedef {Object} SparkScanConfig
 * @property {string} [baseUrl] - Optional sparkscan url (default: https://api.sparkscan.io)
 * @property {NetworkType} [network] - Optional spark network
 * @property {string} [apiKey] - Sparkscan api key
 */
/**
 * @typedef {Object} AddressBalance
 * @property {number} btcSoftBalanceSats - Soft BTC balance in sats (pending + confirmed)
 * @property {number} btcHardBalanceSats - Hard BTC balance in sats (confirmed only)
 * @property {number} btcValueUsdHard - USD value of hard balance
 * @property {number} btcValueUsdSoft - USD value of soft balance
 * @property {number} totalTokenValueUsd - Total USD value of all tokens held
 */
/**
 * @typedef {Object} AddressToken
 * @property {string} tokenIdentifier - Unique token identifier (hex)
 * @property {string} tokenAddress - Token bech32 address
 * @property {string} name - Token display name
 * @property {string} ticker - Token ticker symbol
 * @property {number} decimals - Token decimal places
 * @property {string} balance - Token balance as a decimal string
 * @property {number} valueUsd - USD value of the balance
 * @property {string} issuerPublicKey - Public key of the token issuer
 * @property {string|null} maxSupply
 * @property {boolean|null} isFreezable
 */
/**
 * @typedef {Object} AddressInfo
 * @property {string} sparkAddress - The Spark bech32 address
 * @property {string} publicKey - The public key hex
 * @property {AddressBalance} balance
 * @property {number} totalValueUsd - Total portfolio value in USD
 * @property {number} transactionCount - Total number of transactions
 * @property {number} tokenCount - Number of distinct tokens held
 * @property {Array<AddressToken>|null} tokens
 */
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
    request(path: any, headers?: {}, method?: string, query?: {}): Promise<any>;
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
