import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals'

import * as sparkSdk from '@buildonspark/spark-sdk'
import * as bip39 from 'bip39'

import Bip44SparkSigner from '../src/bip-44/spark-signer.js'

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'

const SEED = bip39.mnemonicToSeedSync(SEED_PHRASE)

const ACCOUNT = {
  index: 0,
  path: "m/44'/998'/0'/0/0",
  address: 'sp1pgss9mdgv7f6cf3lq5a3feh2jtnuypgf2x438tdq79q9jxtnflj9hhq4htem47',
  keyPair: {
    privateKey: 'd5d117a4be53b177b4ba48fc709539e37e24e72d4a90f1d47daf309ec3e8ae7b',
    publicKey: '02eda86793ac263f053b14e6ea92e7c2050951ab13ada0f1405919734fe45bdc15'
  }
}

const getLatestDepositTxIdMock = jest.fn()

jest.unstable_mockModule('@buildonspark/spark-sdk', async () => ({
  ...sparkSdk,
  getLatestDepositTxId: getLatestDepositTxIdMock
}))

const { WalletAccountSpark } = await import('../index.js')

describe('WalletAccountSpark', () => {
  let wallet,
    account

  beforeEach(async () => {
    const { SparkWallet } = sparkSdk;

    ({ wallet } = await SparkWallet.initialize({
      signer: new Bip44SparkSigner(0),
      mnemonicOrSeed: SEED,
      options: {
        network: 'MAINNET'
      }
    }))

    account = new WalletAccountSpark(wallet)
  }, 10_000)

  afterEach(() => {
    account.dispose()
  }, 10_000)

  describe('constructor', () => {
    test('should successfully initialize an account for the given spark wallet', async () => {
      expect(account.index).toBe(ACCOUNT.index)

      expect(account.path).toBe(ACCOUNT.path)

      expect(account.keyPair).toEqual({
        privateKey: new Uint8Array(Buffer.from(ACCOUNT.keyPair.privateKey, 'hex')),
        publicKey: new Uint8Array(Buffer.from(ACCOUNT.keyPair.publicKey, 'hex'))
      })
    })
  })

  describe('getAddress', () => {
    test('should return the correct address', async () => {
      const address = await account.getAddress()

      expect(address).toBe(ACCOUNT.address)
    })
  })

  describe('sign', () => {
    const MESSAGE = 'Dummy message to sign.'

    const EXPECTED_SIGNATURE = '304402206aeb89509bda36572e2f042e9fb6b04bf3c759c0473c6d0e683143680bb363ad02207bd0e9dd8ff98a9a15962722904c71dd074c83ce8717d67d31b1010a4e9c6de6'

    test('should return the correct signature', async () => {
      const signature = await account.sign(MESSAGE)

      expect(signature).toBe(EXPECTED_SIGNATURE)
    })
  })

  describe('verify', () => {
    const MESSAGE = 'Dummy message to sign.'

    const SIGNATURE = '304402206aeb89509bda36572e2f042e9fb6b04bf3c759c0473c6d0e683143680bb363ad02207bd0e9dd8ff98a9a15962722904c71dd074c83ce8717d67d31b1010a4e9c6de6'

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
        .rejects.toThrow('hex string expected')
    })
  })

  describe('sendTransaction', () => {
    const TRANSACTION = {
      to: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
      value: 100
    }

    const DUMMY_ID = 'dummy-id'

    test('should successfully send a transaction', async () => {
      wallet.transfer = jest.fn(({ receiverSparkAddress, amountSats }) =>
        receiverSparkAddress === TRANSACTION.to &&
        amountSats === TRANSACTION.value &&
        {
          id: DUMMY_ID
        }
      )

      const { hash, fee } = await account.sendTransaction(TRANSACTION)

      expect(hash).toBe(DUMMY_ID)

      expect(fee).toBe(0)
    })
  })

  describe('quoteSendTransaction', () => {
    const TRANSACTION = {
      to: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
      value: 100
    }

    test('should successfully quote a transaction', async () => {
      const { fee } = await account.quoteSendTransaction(TRANSACTION)

      expect(fee).toBe(0)
    })
  })

  describe('transfer', () => {
    test('should throw an unsupported operation error', async () => {
      await expect(account.transfer({}))
        .rejects.toThrow('Method not supported on the spark blockchain.')
    })
  })

  describe('quoteTransfer', () => {
    test('should throw an unsupported operation error', async () => {
      await expect(account.quoteTransfer({}))
        .rejects.toThrow('Method not supported on the spark blockchain.')
    })
  })

  describe('getBalance', () => {
    test('should return the correct balance of the account', async () => {
      wallet.getBalance = jest.fn(() => ({
        balance: 12_345n
      }))

      const balance = await account.getBalance()

      expect(balance).toBe(12_345)
    })
  })

  describe('getTokenBalance', () => {
    test('should throw an unsupported operation error', async () => {
      await expect(account.getTokenBalance('token-address'))
        .rejects.toThrow('Method not supported on the spark blockchain.')
    })
  })

  describe('getSingleUseDepositAddress', () => {
    test('returns a valid bitcoin address', async () => {
      const SINGLE_USE_DEPOSIT_ADDRESS = 'abc...'

      wallet.getSingleUseDepositAddress = jest.fn().mockResolvedValue(SINGLE_USE_DEPOSIT_ADDRESS)

      const address = await account.getSingleUseDepositAddress()

      expect(address).toMatch(SINGLE_USE_DEPOSIT_ADDRESS)
    })
  })

  describe('claimDeposit', () => {
    test('calls wallet.claimDeposit with correct transaction id', async () => {
      const MOCKED_TX_ID = 'mock-tx-id'

      const MOCKED_LEAVES = [
        { id: 'leaf1' },
        { id: 'leaf2' }
      ]

      wallet.claimDeposit = jest.fn().mockResolvedValue(MOCKED_LEAVES)

      const result = await account.claimDeposit(MOCKED_TX_ID)

      expect(wallet.claimDeposit).toHaveBeenCalledWith(MOCKED_TX_ID)
      expect(result).toEqual(MOCKED_LEAVES)
    })
  })

  describe('getLatestDepositTxId', () => {
    test('should return the latest deposit transaction id', async () => {
      const MOCKED_LATEST_TX_ID = 'latest-tx-id'

      getLatestDepositTxIdMock.mockResolvedValue(MOCKED_LATEST_TX_ID)

      const result = await account.getLatestDepositTxId()

      expect(result).toBe(MOCKED_LATEST_TX_ID)
    })
  })

  describe('withdraw', () => {
    test('should call wallet.withdraw with correct arguments and return result', async () => {
      const TRANSACTION = {
        to: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
        value: 500
      }

      const MOCKED_RESULT = { id: 'withdraw-tx-id' }

      wallet.withdraw = jest.fn().mockResolvedValue(MOCKED_RESULT)

      const result = await account.withdraw(TRANSACTION)

      expect(wallet.withdraw).toHaveBeenCalledWith({
        onchainAddress: TRANSACTION.to,
        amountSats: TRANSACTION.value,
        exitSpeed: 'MEDIUM'
      })

      expect(result).toEqual(MOCKED_RESULT)
    })
  })

  describe('createLightningInvoice', () => {
    test('should call wallet.createLightningInvoice with correct arguments and return result', async () => {
      const INVOICE_PARAMS = { value: 1500, memo: 'Test invoice' }
      const MOCKED_INVOICE = { id: 'invoice-id' }

      wallet.createLightningInvoice = jest.fn().mockResolvedValue(MOCKED_INVOICE)

      const result = await account.createLightningInvoice(INVOICE_PARAMS)

      expect(wallet.createLightningInvoice).toHaveBeenCalledWith({
        amountSats: INVOICE_PARAMS.value,
        memo: INVOICE_PARAMS.memo
      })
      expect(result).toEqual(MOCKED_INVOICE)
    })
  })

  describe('getLightningReceiveRequest', () => {
    test('should call wallet.getLightningReceiveRequest with correct invoiceId and return result', async () => {
      const MOCKED_INVOICE_ID = 'mock-invoice-id'
      const MOCKED_RECEIVE_REQUEST = { id: MOCKED_INVOICE_ID }

      wallet.getLightningReceiveRequest = jest.fn().mockResolvedValue(MOCKED_RECEIVE_REQUEST)

      const result = await account.getLightningReceiveRequest(MOCKED_INVOICE_ID)

      expect(wallet.getLightningReceiveRequest).toHaveBeenCalledWith(MOCKED_INVOICE_ID)
      expect(result).toEqual(MOCKED_RECEIVE_REQUEST)
    })
  })

  describe('payLightningInvoice', () => {
    test('should call wallet.payLightningInvoice with correct arguments and return result', async () => {
      const PAYMENT_PARAMS = { invoice: 'bolt11-invoice-string', maxFeeSats: 50 }
      const MOCKED_PAYMENT_RESULT = { id: 'payment-id' }

      wallet.payLightningInvoice = jest.fn().mockResolvedValue(MOCKED_PAYMENT_RESULT)

      const result = await account.payLightningInvoice(PAYMENT_PARAMS)

      expect(wallet.payLightningInvoice).toHaveBeenCalledWith({
        invoice: PAYMENT_PARAMS.invoice,
        maxFeeSats: PAYMENT_PARAMS.maxFeeSats
      })
      expect(result).toEqual(MOCKED_PAYMENT_RESULT)
    })
  })

  describe('getLightningSendFeeEstimate', () => {
    test('should call wallet.getLightningSendFeeEstimate with correct arguments and return result', async () => {
      const INVOICE = 'bolt11-invoice-string'
      const MOCKED_FEE_ESTIMATE = 123

      wallet.getLightningSendFeeEstimate = jest.fn().mockResolvedValue(MOCKED_FEE_ESTIMATE)

      const result = await account.getLightningSendFeeEstimate({ invoice: INVOICE })

      expect(wallet.getLightningSendFeeEstimate).toHaveBeenCalledWith({
        encodedInvoice: INVOICE
      })

      expect(result).toBe(MOCKED_FEE_ESTIMATE)
    })
  })

  describe('getTransfers', () => {
    test('returns empty array when no transfers exist', async () => {
      wallet.getTransfers = jest.fn().mockResolvedValueOnce({ transfers: [] })

      const transfers = await account.getTransfers()

      expect(transfers).toEqual([])
      expect(wallet.getTransfers).toHaveBeenCalledWith(10, 0)
    })

    test('returns transfers when they exist', async () => {
      wallet.getTransfers = jest.fn()

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
      wallet.getTransfers = jest.fn()

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
      wallet.getTransfers = jest.fn()

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
      wallet.getTransfers = jest.fn()

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

  describe('cleanupConnections', () => {
    test('should close and clean up connections with the blockchain', async () => {
      wallet.cleanupConnections = jest.fn()

      await account.cleanupConnections()

      expect(wallet.cleanupConnections).toHaveBeenCalled()
    })
  })
})
