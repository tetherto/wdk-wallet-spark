import { wordlists } from 'bip39'

import WalletManagerSpark from '../src/wallet-manager-spark'
import WalletAccountSpark from '../src/wallet-account-spark'

const SEED_PHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
const INVALID_SEED_PHRASE = 'invalid seed phrase'

describe('WalletManagerSpark', () => {
  let wallet

  beforeAll(async () => {
    wallet = new WalletManagerSpark(SEED_PHRASE, {
      network: 'REGTEST'
    })
  })

  describe('constructor', () => {
    test('should successfully initialize a wallet manager for the given seed phrase', () => {
      const wallet = new WalletManagerSpark(SEED_PHRASE, {
        network: 'REGTEST'
      })

      expect(wallet.seed).toEqual(SEED_PHRASE)
    })

    test('should throw if the seed phrase is invalid', () => {
      expect(() => { new WalletManagerSpark(INVALID_SEED_PHRASE, { network: 'REGTEST' }) })
        .toThrow()
    })
  })

  describe('static getRandomSeedPhrase', () => {
    test('generates a valid 12-word seed phrase', () => {
      const seedPhrase = WalletManagerSpark.getRandomSeedPhrase()
      const words = seedPhrase.trim().split(/\s+/)

      expect(words).toHaveLength(12)

      words.forEach(word => expect(wordlists.EN.indexOf(word)).not.toBe(-1))
    })
  })

  describe('static isValidSeedPhrase', () => {
    test('should return true for a valid seed phrase', () => {
      expect(WalletManagerSpark.isValidSeedPhrase(SEED_PHRASE))
        .toBe(true)
    })

    test('should return false for an invalid seed phrase', () => {
      expect(WalletManagerSpark.isValidSeedPhrase(INVALID_SEED_PHRASE))
        .toBe(false)
    })

    test('should return false for an empty string', () => {
      expect(WalletManagerSpark.isValidSeedPhrase(''))
        .toBe(false)
    })
  })

  describe('seed getter', () => {
    test('returns the original seed phrase used during construction', () => {
      expect(wallet.seed).toBe(SEED_PHRASE)
    })
  })

  describe('getAccount', () => {
    test('should return the account at index 0 by default', async () => {
      const account = await wallet.getAccount()

      expect(account).toBeInstanceOf(WalletAccountSpark)

      expect(account.path).toBe("m/8797555'/1'/0'/0'")

      account.cleanupConnections()
    }, 10000)

    test('should return the account at the given index', async () => {
      const account = await wallet.getAccount(3)

      expect(account).toBeInstanceOf(WalletAccountSpark)

      expect(account.path).toBe("m/8797555'/1'/3'/0'")

      account.cleanupConnections()
    }, 10000)

    test('should throw if the index is a negative number', async () => {
      await expect(wallet.getAccount(-1))
        .rejects.toThrow("invalid child index: -1'")
    })
  })

  describe('getAccountByPath', () => {
    test('throws because method not supported on the spark blockchain', async () => {
      expect(wallet.getAccountByPath('path')).rejects.toThrow()
    })
  })

  describe('getFeeRates', () => {
    test('should return 0 for both normal and fast', async () => {
      const feeRates = await wallet.getFeeRates()

      expect(feeRates).toHaveProperty('normal')
      expect(feeRates).toHaveProperty('fast')

      expect(feeRates.normal).toBe(0)
      expect(feeRates.fast).toBe(0)
    })
  })
})
