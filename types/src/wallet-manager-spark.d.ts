export default class WalletManagerSpark extends WalletManager {
    /**
     * Creates a new wallet manager for the Spark blockchain.
     *
     * @param {string | Uint8Array} seed - The wallet's [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) seed phrase.
     * @param {SparkWalletConfig} [config] - The configuration object.
     */
    constructor(seed: string | Uint8Array, config?: SparkWalletConfig);
    /**
     * Returns the wallet account at a specific index (see [BIP-44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)).
     *
     * @example
     * // Returns the account with derivation path m/44'/998'/0'/0/1
     * const account = await wallet.getAccount(1);
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
     * @returns {Promise<FeeRates>} The fee rates (in satoshis).
     */
    getFeeRates(): Promise<FeeRates>;
}
export type FeeRates = import("@wdk/wallet").FeeRates;
export type SparkWalletConfig = import("./wallet-account-read-only-spark.js").SparkWalletConfig;
import WalletManager from '@wdk/wallet';
import WalletAccountSpark from './wallet-account-spark.js';
