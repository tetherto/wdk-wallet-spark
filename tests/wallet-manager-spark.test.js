import { wordlists } from 'bip39'

import WalletManagerSpark from '../src/wallet-manager-spark'
import WalletAccountSpark from '../src/wallet-account-spark'

const SEED_PHRASE = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
const INVALID_SEED_PHRASE = 'invalid seed phrase'

describe('WalletManagerSpark', () => {
  let walletManager

  beforeAll(async () => {
    walletManager = new WalletManagerSpark(SEED_PHRASE, {
      network: 'REGTEST'
    })
  })

  test('shouwld throw if seed phrase is invalid', () => {
    expect(() => new WalletManagerSpark(INVALID_SEED_PHRASE, {
      network: 'REGTEST'
    })).toThrow()
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
    test('returns false for an invalid mnemonic', () => {
      expect(WalletManagerSpark.isValidSeedPhrase(SEED_PHRASE)).toBe(true)
    })

    test('should return false if if mnemonic is not valid', () => {
      expect(WalletManagerSpark.isValidSeedPhrase(INVALID_SEED_PHRASE)).toBe(false)
    })

    test('returns false for empty string', () => {
      expect(WalletManagerSpark.isValidSeedPhrase('')).toBe(false)
    })

    test('returns false for null', () => {
      expect(WalletManagerSpark.isValidSeedPhrase(null)).toBe(false)
    })

    test('returns false for undefined', () => {
      expect(WalletManagerSpark.isValidSeedPhrase(undefined)).toBe(false)
    })

    test('returns false for non-string input (number)', () => {
      expect(WalletManagerSpark.isValidSeedPhrase(12345)).toBe(false)
    })
  })

  describe('seedPhrase getter', () => {
    test('returns the original seed phrase used during construction', () => {
      expect(walletManager.seedPhrase).toBe(SEED_PHRASE)
    })
  })

  describe('getAccount', () => {
    test('returns an instance of WalletAccountEvm for index 0 by default', async () => {
      const account = await walletManager.getAccount()

      expect(account).toBeInstanceOf(WalletAccountSpark)
      expect(account.index).toBe(0)

      await account.cleanupConnections()
    })

    test('returns different accounts for different indices', async () => {
      const account0 = await walletManager.getAccount(0)
      const account1 = await walletManager.getAccount(1)

      expect(account0.index).toBe(0)
      expect(account1.index).toBe(1)

      expect(await account0.getAddress()).not.toBe(await account1.getAddress())

      await account0.cleanupConnections()
      await account1.cleanupConnections()
    }, 10000)

    test('throws if index is negative', async () => {
      expect(walletManager.getAccount(-1)).rejects.toThrow()
    })

    test('returns same account for same index consistently', async () => {
      const accountA = await walletManager.getAccount(5)
      const accountB = await walletManager.getAccount(5)

      expect(await accountA.getAddress()).toBe(await accountB.getAddress())

      await accountA.cleanupConnections()
      await accountB.cleanupConnections()
    })
  })

  describe('getAccountByPath', () => {
    test('throws because method not supported on the spark blockchain', async () => {
      expect(walletManager.getAccountByPath('path')).rejects.toThrow()
    })
  })

  describe('getFeeRates', () => {
    test('should return 0 for both normal and fast', async () => {
      const feeRates = await walletManager.getFeeRates()

      expect(feeRates).toHaveProperty('normal')
      expect(feeRates).toHaveProperty('fast')

      expect(feeRates.normal).toBe(0)
      expect(feeRates.fast).toBe(0)
    })
  })
})
