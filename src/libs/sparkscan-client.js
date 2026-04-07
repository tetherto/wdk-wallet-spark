'use strict'

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
  constructor (config = {}) {
    this._baseUrl = config.baseUrl || 'https://api.sparkscan.io'
    this._network = config.network || 'MAINNET'

    const SUPPORTED_NETWORKS = new Set(['MAINNET', 'REGTEST'])
    if (!SUPPORTED_NETWORKS.has(this._network)) {
      throw new Error(`SparkScan does not support network: ${this._network}`)
    }

    this._headers = {
      'Content-Type': 'application/json'
    }
    if (config.apiKey) {
      this._headers.Authorization = `Bearer ${config.apiKey}`
    }
  }

  async _request (path, headers = {}, method = 'get', query = {}) {
    query.network = this._network
    const search = Object.entries(query).map(([k, v]) => `${k}=${v}`).join('&')
    const url = `${this._baseUrl}${path}?${search}`
    const response = await fetch(url, {
      headers: {
        ...this._headers,
        ...headers
      },
      method
    })
    if (!response.ok) {
      const text = await response.text().catch(() => 'Failed to read response body')
      throw new Error(`Sparkscan request failed: ${response.status} ${response.statusText} - ${text}`)
    }
    return response.json()
  }

  /**
   * Get account information for an address
   * @see https://docs.sparkscan.io/api/address#get-v1-address-by-address
   * @param {string} address Spark address
   * @returns {Promise<AddressInfo>} Account information
   */
  async getAddressInfo (address) {
    return this._request(`/v1/address/${address}`)
  }
}
