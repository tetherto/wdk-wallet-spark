import { describe } from 'noba'

import WalletManagerSpark, {
  WalletAccountSpark,
} from '@tetherto/wdk-wallet-spark'

const SEED_PHRASE =
  'cook voyage document eight skate token alien guide drink uncle term abuse'

describe('WalletManagerSpark', ({ describe, beforeEach, afterEach }) => {
  let wallet

  beforeEach(async () => {
    wallet = new WalletManagerSpark(SEED_PHRASE, {
      network: 'MAINNET',
    })
  })

  afterEach(() => {
    wallet.dispose()
  })

  describe('getAccount', ({ test }) => {
    test('should return the account at index 0 by default', async ({
      expect,
    }) => {
      const account = await wallet.getAccount()

      expect(account).toBeInstanceOf(WalletAccountSpark)

      expect(account.path).toBe("m/44'/998'/0'/0/0")
    })

    test('should return the account at the given index', async ({ expect }) => {
      const account = await wallet.getAccount(3)

      expect(account).toBeInstanceOf(WalletAccountSpark)

      expect(account.path).toBe("m/44'/998'/0'/0/3")
    })

    test('should throw if the index is a negative number', async ({
      expect,
    }) => {
      await expect(async () => {
        await wallet.getAccount(-1)
      }).rejects('invalid child index: -1')
    })
  })

  describe('getAccountByPath', ({ test }) => {
    test('should throw an unsupported operation error', async ({ expect }) => {
      await expect(async () => {
        await wallet.getAccountByPath("0'/0/0")
      }).rejects('Method not supported on the spark blockchain.')
    })
  })

  describe('getFeeRates', ({ test }) => {
    test('should return the correct fee rates', async ({ expect }) => {
      const feeRates = await wallet.getFeeRates()

      expect(feeRates.normal).toBe(0n)

      expect(feeRates.fast).toBe(0n)
    })
  })
})
