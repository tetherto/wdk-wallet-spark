import { jest } from '@jest/globals'
import { SparkWallet } from '@buildonspark/spark-sdk'

import WalletSparkSigner from '../src/wallet-spark-signer.js'
import WalletAccountSpark from '../src/wallet-account-spark.js'

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'
const BITCOIN_REGTEST_ADDRESS_REGEX = /^bcrt1p[a-z0-9]{58}$/

const ACCOUNT = {
  index: 0,
  path: "m/8797555'/1'/0'/0'",
  address: undefined,
  keyPair: {
    publicKey: '020b1cdb58bceba4556c8a9cd0703777e6ba09eeeaff60fd6f199b12e239614555',
    privateKey: '1e03c1b1bd15394231cfb7ff933f23d049777a1d1a2822f9e9aadb4d1b680a9f'
  }
}

describe('WalletAccountSpark', () => {
  let account
  let wallet

  beforeAll(async () => {
    const signer = new WalletSparkSigner(0)

    const { wallet: realWallet } = await SparkWallet.initialize({
      signer,
      mnemonicOrSeed: SEED_PHRASE,
      options: {
        network: 'REGTEST'
      }
    }, 10000)

    wallet = realWallet
    wallet.payLightningInvoice = jest.fn()
    wallet.getTransfers = jest.fn()
    wallet.claimDeposit = jest.fn()
    wallet.getLightningSendFeeEstimate = jest.fn()

    account = new WalletAccountSpark(wallet)
  })

  afterAll(async () => {
    await account.cleanupConnections()
  })

  describe('constructor', () => {
    test('should successfully initialize an account for the given wallet instance', async () => {
      const signer = new WalletSparkSigner(0)
      const { wallet: realWallet } = await SparkWallet.initialize({
        signer,
        mnemonicOrSeed: SEED_PHRASE,
        options: { network: 'REGTEST' }
      })

      const account = new WalletAccountSpark(realWallet)

      expect(account.index).toBe(ACCOUNT.index)
      expect(account.path).toBe(ACCOUNT.path)
      expect(account.keyPair).toHaveProperty('privateKey')
      expect(account.keyPair).toHaveProperty('publicKey')
      expect(typeof account.keyPair.privateKey).toBe(typeof ACCOUNT.keyPair.privateKey)
      expect(typeof account.keyPair.publicKey).toBe(typeof ACCOUNT.keyPair.publicKey)


      await account.cleanupConnections()
    }, 10000)

    test('should throw if wallet is not provided', () => {
      expect(() => new WalletAccountSpark()).toThrow()
    })
  })

  describe('getAddress', () => {
    test('returns the address of the account', async () => {
      const address = await account.getAddress()

      expect(typeof address).toBe('string')
    })
  })

  describe('sign', () => {
    const MESSAGE = 'Dummy message to sign.'

    const EXPECTED_SIGNATURE = '30440220041d461107e10eccd244bb0b7a1b8d0879a6b8af6413dab2fccfc1ddff66013a02203615d12f27ed4a534a67c977d0735bfe07ead671c366aba5923d034a2462f275'

    test('should return the correct signature', async () => {
      const signature = await account.sign(MESSAGE)

      expect(signature).toBe(EXPECTED_SIGNATURE)
    })
  })

  describe('verify', () => {
    const MESSAGE = 'Dummy message to sign.'

    const SIGNATURE = '30440220041d461107e10eccd244bb0b7a1b8d0879a6b8af6413dab2fccfc1ddff66013a02203615d12f27ed4a534a67c977d0735bfe07ead671c366aba5923d034a2462f275'

    test('should return true for a valid signature', async () => {
      const result = await account.verify(MESSAGE, SIGNATURE)

      expect(result).toBe(true)
    })

    test('should return false for an invalid signature', async () => {
      const result = await account.verify('Another message.', SIGNATURE)

      expect(result).toBe(false)
    })

    test('should throw on a malformed signature', async () => {
      await expect(account.verify(MESSAGE, 'A bad signature'))
        .rejects.toThrow()
    })
  })

  describe('sendTransaction', () => {
    beforeEach(() => {
      wallet.transfer = jest.fn()
    })

    test('calls wallet.transfer with correct parameters', async () => {
      const tx = {
        to: 'bcrt1ptest',
        value: 1000
      }

      const expectedTransferParams = {
        receiverSparkAddress: tx.to,
        amountSats: tx.value
      }

      const mockTransferId = 'SparkTransfer:123'
      wallet.transfer.mockResolvedValue({ id: mockTransferId })

      const result = await account.sendTransaction(tx)

      expect(wallet.transfer).toHaveBeenCalledWith(expectedTransferParams)
      expect(result).toBe(mockTransferId)
    })

    test('propagates errors from wallet.transfer', async () => {
      const tx = {
        to: 'bcrt1ptest',
        value: 1000
      }

      const error = new Error('Transfer failed')
      wallet.transfer.mockRejectedValue(error)

      await expect(account.sendTransaction(tx)).rejects.toThrow(error)
    })
  })

  describe('quoteTransaction', () => {
    test('always returns 0 for any transaction', async () => {
      const tx = {
        to: 'bcrt1ptest',
        value: 1000
      }
      const fee = await account.quoteTransaction(tx)
      expect(fee).toBe(0)

      const tx2 = {
        to: 'bcrt1ptest2',
        value: 999999
      }
      const fee2 = await account.quoteTransaction(tx2)
      expect(fee2).toBe(0)
    })
  })

  describe('getBalance', () => {
    test('returns a non-negative number', async () => {
      const balance = await account.getBalance()

      expect(typeof balance).toBe('number')
      expect(Number.isFinite(balance)).toBe(true)
      expect(balance).toBeGreaterThanOrEqual(0)
    })

    test('returns consistent balance for multiple calls', async () => {
      const balance1 = await account.getBalance()
      const balance2 = await account.getBalance()

      expect(balance1).toBe(balance2)
    })
  })

  describe('getTokenBalance', () => {
    test('throws error as tokens are not supported', async () => {
      expect(account.getTokenBalance('some-token-address'))
        .rejects
        .toThrow('Not supported by the spark blockchain.')
    })
  })

  describe('getSingleUseDepositAddress', () => {
    test('returns a valid bitcoin regtest address', async () => {
      const address = await account.getSingleUseDepositAddress()

      expect(typeof address).toBe('string')
      expect(address).toMatch(BITCOIN_REGTEST_ADDRESS_REGEX)
    })

    test('returns different address for each call', async () => {
      const address1 = await account.getSingleUseDepositAddress()
      const address2 = await account.getSingleUseDepositAddress()

      expect(address1).not.toBe(address2)
    })
  })

  describe('claimDeposit', () => {
    test('calls wallet.claimDeposit with correct transaction id', async () => {
      const mockTxId = 'mock-tx-id'
      const mockLeaves = [
        { id: 'leaf1' },
        { id: 'leaf2' }
      ]
      wallet.claimDeposit.mockResolvedValue(mockLeaves)

      const result = await account.claimDeposit(mockTxId)

      expect(wallet.claimDeposit).toHaveBeenCalledWith(mockTxId)
      expect(result).toEqual(mockLeaves)
    })
  })

  describe('getLatestDepositTxId', () => {
    test('returns null when no deposit exists', async () => {
      const address = await account.getSingleUseDepositAddress()
      const txId = await account.getLatestDepositTxId(address)

      expect(txId).toBeNull()
    })

    test('throws error for invalid bitcoin address', async () => {
      const invalidAddress = 'not-a-bitcoin-address'
      expect(account.getLatestDepositTxId(invalidAddress))
        .rejects
        .toThrow()
    })

    test('throws error for empty address', async () => {
      expect(account.getLatestDepositTxId(''))
        .rejects
        .toThrow()
    })

    test('throws error for non-string address', async () => {
      expect(account.getLatestDepositTxId(123))
        .rejects
        .toThrow()
    })
  })

  describe('withdraw', () => {
    test('throws error for invalid bitcoin address', async () => {
      expect(account.withdraw({
        to: 'not-a-bitcoin-address',
        value: 1000
      }))
        .rejects
        .toThrow()
    })

    test('throws error for negative amount', async () => {
      const address = await account.getSingleUseDepositAddress()
      expect(account.withdraw({
        to: address,
        value: -1000
      }))
        .rejects
        .toThrow()
    })

    test('throws error for zero amount', async () => {
      const address = await account.getSingleUseDepositAddress()
      expect(account.withdraw({
        to: address,
        value: 0
      }))
        .rejects
        .toThrow()
    })

    test('throws error for non-number amount', async () => {
      const address = await account.getSingleUseDepositAddress()
      expect(account.withdraw({
        to: address,
        value: '1000'
      }))
        .rejects
        .toThrow()
    })

    test('throws error for missing address', async () => {
      expect(account.withdraw({
        value: 1000
      }))
        .rejects
        .toThrow()
    })

    test('throws error for missing amount', async () => {
      const address = await account.getSingleUseDepositAddress()
      expect(account.withdraw({
        to: address
      }))
        .rejects
        .toThrow()
    })

    test('throws error for empty options', async () => {
      expect(account.withdraw({}))
        .rejects
        .toThrow()
    })

    test('throws error for missing options', async () => {
      expect(account.withdraw())
        .rejects
        .toThrow()
    })
  })

  describe('createLightningInvoice', () => {
    test('creates a valid lightning invoice with amount only', async () => {
      const value = 1000

      const { id, invoice } = await account.createLightningInvoice({ value })

      expect(typeof id).toBe('string')
      expect(invoice).toBeDefined()
      expect(typeof invoice).toBe('object')
      expect(typeof invoice.encodedInvoice).toBe('string')
      expect(invoice.encodedInvoice.startsWith('lnbcrt')).toBe(true)
      expect(invoice.amount.originalValue).toBe(value * 1000)
      expect(invoice.memo).toBeNull()
    })

    test('creates a valid lightning invoice with amount and memo', async () => {
      const value = 1000
      const memo = 'Test payment'

      const { id, invoice } = await account.createLightningInvoice({ value, memo })

      expect(typeof id).toBe('string')
      expect(invoice).toBeDefined()
      expect(typeof invoice).toBe('object')
      expect(typeof invoice.encodedInvoice).toBe('string')
      expect(invoice.encodedInvoice.startsWith('lnbcrt')).toBe(true)
      expect(invoice.amount.originalValue).toBe(value * 1000)
      expect(Buffer.from(invoice.memo, 'base64').toString()).toBe(memo)
    })

    test('throws error for missing value', async () => {
      expect(account.createLightningInvoice({}))
        .rejects
        .toThrow()
    })

    test('throws error for negative value', async () => {
      expect(account.createLightningInvoice({ value: -1000 }))
        .rejects
        .toThrow()
    })

    test('throws error for non-number value', async () => {
      expect(account.createLightningInvoice({ value: '1000' }))
        .rejects
        .toThrow()
    })

    test('throws error for non-string memo', async () => {
      expect(account.createLightningInvoice({ value: 1000, memo: 123 }))
        .rejects
        .toThrow()
    })
  })

  describe('getLightningReceiveRequest', () => {
    test('throws error for non-existent invoice id', async () => {
      const nonExistentId = 'non-existent-id'
      expect(account.getLightningReceiveRequest(nonExistentId))
        .rejects
        .toThrow()
    })

    test('returns the correct invoice for existing id', async () => {
      const value = 1000
      const memo = 'Test payment'

      const { id, invoice: createdInvoice } = await account.createLightningInvoice({ value, memo })
      const request = await account.getLightningReceiveRequest(id)

      expect(request).toBeDefined()
      expect(request.id).toMatch(/^SparkLightningReceiveRequest:/)
      expect(request.network).toBe('REGTEST')
      expect(request.status).toBe('INVOICE_CREATED')
      expect(request.typename).toBe('LightningReceiveRequest')

      expect(request.invoice).toBeDefined()
      expect(request.invoice.encodedInvoice).toBe(createdInvoice.encodedInvoice)
      expect(request.invoice.bitcoinNetwork).toBe('REGTEST')
      expect(request.invoice.paymentHash).toBeDefined()
      expect(typeof request.invoice.paymentHash).toBe('string')
      expect(request.invoice.memo).toBe(Buffer.from(memo).toString('base64'))

      expect(new Date(request.createdAt)).toBeInstanceOf(Date)
      expect(new Date(request.updatedAt)).toBeInstanceOf(Date)
      expect(new Date(request.invoice.createdAt)).toBeInstanceOf(Date)
      expect(new Date(request.invoice.expiresAt)).toBeInstanceOf(Date)
    })

    test('throws error for invalid invoice id type', async () => {
      expect(account.getLightningReceiveRequest(123))
        .rejects
        .toThrow()
    })

    test('throws error for empty invoice id', async () => {
      expect(account.getLightningReceiveRequest(''))
        .rejects
        .toThrow()
    })
  })

  describe('payLightningInvoice', () => {
    test('passes parameters correctly to wallet', async () => {
      const params = {
        invoice: 'lnbcrt1...',
        maxFeeSats: 100
      }

      await account.payLightningInvoice(params)

      expect(wallet.payLightningInvoice).toHaveBeenCalledWith(params)
    })

    test('returns result from wallet', async () => {
      const expectedResult = {
        id: 'SparkLightningSendRequest:mock-id',
      }

      wallet.payLightningInvoice.mockResolvedValue(expectedResult)

      const result = await account.payLightningInvoice({
        invoice: 'lnbcrt1...',
        maxFeeSats: 100
      })

      expect(result).toBe(expectedResult)
    })
  })

  describe('getLightningSendFeeEstimate', () => {
    test('returns the correct fee estimate', async () => {
      const invoice = 'lnbcrt1...';
      const expectedFee = 100;

      wallet.getLightningSendFeeEstimate.mockResolvedValue(expectedFee)

      const fee = await account.getLightningSendFeeEstimate({ invoice })

      expect(wallet.getLightningSendFeeEstimate).toHaveBeenCalledWith({ encodedInvoice: invoice })
      expect(fee).toBe(expectedFee)
    })
  })

  describe('getTransfers', () => {
    test('returns empty array when no transfers exist', async () => {
      wallet.getTransfers.mockResolvedValueOnce({ transfers: [] })

      const transfers = await account.getTransfers()

      expect(transfers).toEqual([])
      expect(wallet.getTransfers).toHaveBeenCalledWith(10, 0)
    })

    test('returns transfers when they exist', async () => {
      const mockTransfers = [
        {
          id: 'SparkTransfer:1',
          createdAt: new Date().toISOString(),
          status: 'COMPLETED',
          transferDirection: 'INCOMING',
          amount: {
            originalValue: 1000,
            originalUnit: 'SATOSHI'
          }
        },
        {
          id: 'SparkTransfer:2',
          createdAt: new Date().toISOString(),
          status: 'PENDING',
          transferDirection: 'OUTGOING',
          amount: {
            originalValue: 2000,
            originalUnit: 'SATOSHI'
          }
        }
      ]

      wallet.getTransfers.mockResolvedValueOnce({ transfers: mockTransfers })
      wallet.getTransfers.mockResolvedValueOnce({ transfers: [] })

      const transfers = await account.getTransfers()

      expect(transfers).toEqual(mockTransfers)
      expect(wallet.getTransfers).toHaveBeenCalledWith(10, 0)
      expect(wallet.getTransfers).toHaveBeenCalledWith(10, 10)
    })

    test('filters by INCOMING direction', async () => {
      const mockTransfers = [
        {
          id: 'SparkTransfer:1',
          transferDirection: 'INCOMING',
          amount: { originalValue: 1000, originalUnit: 'SATOSHI' }
        },
        {
          id: 'SparkTransfer:2',
          transferDirection: 'OUTGOING',
          amount: { originalValue: 2000, originalUnit: 'SATOSHI' }
        }
      ]

      wallet.getTransfers.mockResolvedValueOnce({ transfers: mockTransfers })
      wallet.getTransfers.mockResolvedValueOnce({ transfers: [] })

      const transfers = await account.getTransfers({ direction: 'incoming' })

      expect(transfers).toEqual([mockTransfers[0]])
    })

    test('filters by OUTGOING direction', async () => {
      const mockTransfers = [
        {
          id: 'SparkTransfer:1',
          transferDirection: 'INCOMING',
          amount: { originalValue: 1000, originalUnit: 'SATOSHI' }
        },
        {
          id: 'SparkTransfer:2',
          transferDirection: 'OUTGOING',
          amount: { originalValue: 2000, originalUnit: 'SATOSHI' }
        }
      ]

      wallet.getTransfers.mockResolvedValueOnce({ transfers: mockTransfers })
      wallet.getTransfers.mockResolvedValueOnce({ transfers: [] })

      const transfers = await account.getTransfers({ direction: 'outgoing' })

      expect(transfers).toEqual([mockTransfers[1]])
    })

    test('respects limit parameter', async () => {
      const mockTransfers = Array(15).fill(null).map((_, i) => ({
        id: `SparkTransfer:${i + 1}`,
        transferDirection: 'INCOMING',
        amount: { originalValue: 1000, originalUnit: 'SATOSHI' }
      }))

      wallet.getTransfers.mockResolvedValueOnce({ transfers: mockTransfers.slice(0, 10) })
      wallet.getTransfers.mockResolvedValueOnce({ transfers: mockTransfers.slice(10) })
      wallet.getTransfers.mockResolvedValueOnce({ transfers: [] })

      const limit = 5
      const transfers = await account.getTransfers({ limit })

      expect(transfers.length).toBe(limit)
      expect(transfers).toEqual(mockTransfers.slice(0, limit))
    })
  })
}, 10000)
