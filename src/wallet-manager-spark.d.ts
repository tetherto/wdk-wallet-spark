/**
 * @typedef {Object} SparkWalletConfig
 * @property {string} [network] - The network type; available values: "MAINNET", "REGTEST", "TESTNET" (default: "MAINNET").
 */
export default class WalletManagerSpark {
    /**
     * Returns a random [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
     *
     * @returns {string} The seed phrase.
     */
    static getRandomSeedPhrase(): string;
    /**
     * Checks if a seed phrase is valid.
     *
     * @param {string} seedPhrase - The seed phrase.
     * @returns {boolean} True if the seed phrase is valid.
     */
    static isValidSeedPhrase(seedPhrase: string): boolean;
    /**
     * Creates a new wallet manager for the Spark blockchain.
     *
     * @param {Uint8Array} seedBuffer - Uint8Array seedBuffer buffer.
     * @param {SparkWalletConfig} [config] - The configuration object.
     */
    constructor(seedBuffer: Uint8Array, config?: SparkWalletConfig);
    /**
    * The seed of the wallet.
    *
    * @type {Uint8Array}
    */
    get seedBuffer(): Uint8Array;
    /**
     * Returns the wallet account at a specific index.
     *
     * @param {number} index - The index of the account to get (default: 0).
     * @returns {Promise<WalletAccountSpark>} The account.
     */
    getAccount(index?: number): Promise<WalletAccountSpark>;
    /**
     * Returns the wallet account at a specific BIP-44 derivation path.
     *
     * @param {string} path - The derivation path (e.g. "0'/0/0").
     * @returns {Promise<WalletAccountSpark>} The account.
     */
    getAccountByPath(path: string): Promise<WalletAccountSpark>;
    /**
     * Returns the current fee rates.
     *
     * @returns {Promise<{ normal: number, fast: number }>} The fee rates (in satoshis).
     */
    getFeeRates(): Promise<{
        normal: number;
        fast: number;
    }>;
    /**
     * Close the wallet manager and erase the seed buffer.
     */
    close(): void;
    #private;
}
export type SparkWalletConfig = {
    /**
     * - The network type; available values: "MAINNET", "REGTEST", "TESTNET" (default: "MAINNET").
     */
    network?: string;
};
import WalletAccountSpark from './wallet-account-spark.js';
