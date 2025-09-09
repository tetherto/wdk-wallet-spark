import { afterEach, beforeEach, describe, expect, test } from '@jest/globals'

import WalletManagerSpark, { WalletAccountSpark } from '../index.js'

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'

describe('WalletManagerSpark', () => {
  let wallet

  beforeEach(async () => {
    wallet = new WalletManagerSpark(SEED_PHRASE, {
      network: 'MAINNET'
    })
  })

  afterEach(() => {
    wallet.dispose()
  })

  describe('getAccount', () => {
    test('should return the account at index 0 by default', async () => {
      const account = await wallet.getAccount()

      expect(account).toBeInstanceOf(WalletAccountSpark)

      expect(account.path).toBe("m/44'/998'/0'/0/0")
    })

    test('should return the account at the given index', async () => {
      const account = await wallet.getAccount(3)

      expect(account).toBeInstanceOf(WalletAccountSpark)

      expect(account.path).toBe("m/44'/998'/0'/0/3")
    })

    test('should throw if the index is a negative number', async () => {
      await expect(wallet.getAccount(-1))
        .rejects.toThrow('invalid child index: -1')
    })
  })

  describe('getAccountByPath', () => {
    test('should throw an unsupported operation error', async () => {
      await expect(wallet.getAccountByPath("0'/0/0"))
        .rejects.toThrow('Method not supported on the spark blockchain.')
    })
  })

  describe('getFeeRates', () => {
    test('should return the correct fee rates', async () => {
      const feeRates = await wallet.getFeeRates()

      expect(feeRates.normal).toBe(0n)

      expect(feeRates.fast).toBe(0n)
    })
  })
})
