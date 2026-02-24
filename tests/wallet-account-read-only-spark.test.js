import { describe, beforeEach, expect, jest, test } from '@jest/globals'

const ADDRESS = 'sp1pgss9mdgv7f6cf3lq5a3feh2jtnuypgf2x438tdq79q9jxtnflj9hhq4htem47'

const IDENTITY_KEY = '02eda86793ac263f053b14e6ea92e7c2050951ab13ada0f1405919734fe45bdc15'

const mockClient = {
  getAvailableBalance: jest.fn(),
  getTokenBalance: jest.fn(),
  getTransfersByIds: jest.fn(),
  getTransfers: jest.fn(),
  getUnusedDepositAddresses: jest.fn(),
  getStaticDepositAddresses: jest.fn(),
  getUtxosForDepositAddress: jest.fn(),
  getSparkInvoices: jest.fn()
}

jest.unstable_mockModule('#libs/spark-sdk', () => ({
  SparkWallet: {},
  SparkReadonlyClient: {
    createPublic: jest.fn().mockReturnValue(mockClient)
  },
  Network: {},
  ValidationError: class ValidationError extends Error {},
  DefaultSparkSigner: class DefaultSparkSigner {},
  decodeSparkAddress: jest.fn().mockReturnValue({ identityPublicKey: IDENTITY_KEY })
}))

const { WalletAccountReadOnlySpark } = await import('../index.js')

describe('WalletAccountReadOnlySpark', () => {
  let account

  beforeEach(async () => {
    jest.clearAllMocks()
    account = new WalletAccountReadOnlySpark(ADDRESS, {
      network: 'MAINNET'
    })
  })

  describe('getBalance', () => {
    test('should return the correct balance of the account', async () => {
      mockClient.getAvailableBalance.mockResolvedValue(12_345n)

      const balance = await account.getBalance()

      expect(mockClient.getAvailableBalance).toHaveBeenCalledWith(ADDRESS)
      expect(balance).toBe(12_345n)
    })
  })

  describe('getTokenBalance', () => {
    const DUMMY_TOKEN_ADDRESS = 'btkn1abc123'

    test('should return the correct token balance', async () => {
      const balanceMap = new Map([
        [DUMMY_TOKEN_ADDRESS, { ownedBalance: 6_000n, availableToSendBalance: 5_000n, tokenMetadata: {} }]
      ])

      mockClient.getTokenBalance.mockResolvedValue(balanceMap)

      const balance = await account.getTokenBalance(DUMMY_TOKEN_ADDRESS)

      expect(mockClient.getTokenBalance).toHaveBeenCalledWith(ADDRESS, [DUMMY_TOKEN_ADDRESS])
      expect(balance).toBe(5_000n)
    })

    test('should return 0n if the token is not found', async () => {
      mockClient.getTokenBalance.mockResolvedValue(new Map())

      const balance = await account.getTokenBalance(DUMMY_TOKEN_ADDRESS)

      expect(balance).toBe(0n)
    })
  })

  describe('quoteSendTransaction', () => {
    const TRANSACTION = {
      to: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
      value: 100
    }

    test('should successfully quote a transaction', async () => {
      const { fee } = await account.quoteSendTransaction(TRANSACTION)

      expect(fee).toBe(0n)
    })
  })

  describe('quoteTransfer', () => {
    test('should successfully quote a transfer', async () => {
      const { fee } = await account.quoteTransfer({})

      expect(fee).toBe(0n)
    })
  })

  describe('getTransactionReceipt', () => {
    const DUMMY_TRANSFER_ID = 'dummy-transfer-id'

    test('should return the correct transfer', async () => {
      const DUMMY_TRANSFER = {
        id: DUMMY_TRANSFER_ID,
        status: 'COMPLETED'
      }

      mockClient.getTransfersByIds.mockResolvedValue([DUMMY_TRANSFER])

      const receipt = await account.getTransactionReceipt(DUMMY_TRANSFER_ID)

      expect(mockClient.getTransfersByIds).toHaveBeenCalledWith([DUMMY_TRANSFER_ID])
      expect(receipt).toEqual(DUMMY_TRANSFER)
    })

    test('should return null if the transfer is not found', async () => {
      mockClient.getTransfersByIds.mockResolvedValue([])

      const receipt = await account.getTransactionReceipt(DUMMY_TRANSFER_ID)

      expect(mockClient.getTransfersByIds).toHaveBeenCalledWith([DUMMY_TRANSFER_ID])
      expect(receipt).toBe(null)
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

  describe('getIdentityKey', () => {
    test('should return the identity public key', async () => {
      const identityKey = await account.getIdentityKey()

      expect(identityKey).toBe(IDENTITY_KEY)
    })
  })

  describe('getTransfers', () => {
    const DUMMY_TRANSFERS = [
      { id: 'dummy-transfer-1', transferDirection: 'INCOMING', totalValue: 1_000 },
      { id: 'dummy-transfer-2', transferDirection: 'OUTGOING', totalValue: 2_000 },
      { id: 'dummy-transfer-3', transferDirection: 'INCOMING', totalValue: 3_000 },
      { id: 'dummy-transfer-4', transferDirection: 'OUTGOING', totalValue: 4_000 },
      { id: 'dummy-transfer-5', transferDirection: 'INCOMING', totalValue: 5_000 }
    ]

    test('should return an empty transfer history', async () => {
      mockClient.getTransfers.mockResolvedValueOnce({ transfers: [] })

      const transfers = await account.getTransfers()

      expect(mockClient.getTransfers).toHaveBeenCalledWith({
        sparkAddress: ADDRESS,
        limit: 10,
        offset: 0
      })
      expect(transfers).toEqual([])
    })

    test('should return the full transfer history', async () => {
      mockClient.getTransfers.mockResolvedValueOnce({ transfers: DUMMY_TRANSFERS })
        .mockResolvedValue({ transfers: [] })

      const transfers = await account.getTransfers()

      expect(mockClient.getTransfers).toHaveBeenCalledWith({
        sparkAddress: ADDRESS,
        limit: 10,
        offset: 0
      })
      expect(transfers).toEqual(DUMMY_TRANSFERS)
    })

    test('should return the incoming transfer history', async () => {
      mockClient.getTransfers.mockResolvedValueOnce({ transfers: DUMMY_TRANSFERS })
        .mockResolvedValue({ transfers: [] })

      const transfers = await account.getTransfers({ direction: 'incoming' })

      expect(transfers).toEqual([DUMMY_TRANSFERS[0], DUMMY_TRANSFERS[2], DUMMY_TRANSFERS[4]])
    })

    test('should return the outgoing transfer history', async () => {
      mockClient.getTransfers.mockResolvedValueOnce({ transfers: DUMMY_TRANSFERS })
        .mockResolvedValue({ transfers: [] })

      const transfers = await account.getTransfers({ direction: 'outgoing' })

      expect(transfers).toEqual([DUMMY_TRANSFERS[1], DUMMY_TRANSFERS[3]])
    })

    test('should correctly paginate the transfer history', async () => {
      mockClient.getTransfers.mockResolvedValueOnce({ transfers: DUMMY_TRANSFERS })
        .mockResolvedValue({ transfers: [] })

      const transfers = await account.getTransfers({ limit: 2, skip: 1 })

      expect(mockClient.getTransfers).toHaveBeenCalledWith({
        sparkAddress: ADDRESS,
        limit: 3,
        offset: 0
      })
      expect(transfers).toEqual([DUMMY_TRANSFERS[1], DUMMY_TRANSFERS[2]])
    })

    test('should correctly filter and paginate the transfer history', async () => {
      mockClient.getTransfers.mockResolvedValueOnce({ transfers: DUMMY_TRANSFERS.slice(0, 3) })
        .mockResolvedValueOnce({ transfers: DUMMY_TRANSFERS.slice(3) })
        .mockResolvedValue({ transfers: [] })

      const transfers = await account.getTransfers({ limit: 2, skip: 1, direction: 'incoming' })

      expect(mockClient.getTransfers).toHaveBeenCalledWith({
        sparkAddress: ADDRESS,
        limit: 3,
        offset: 0
      })
      expect(mockClient.getTransfers).toHaveBeenCalledWith({
        sparkAddress: ADDRESS,
        limit: 3,
        offset: 3
      })
      expect(transfers).toEqual([DUMMY_TRANSFERS[2], DUMMY_TRANSFERS[4]])
    })
  })

  describe('getUnusedDepositAddresses', () => {
    test('should return unused deposit addresses', async () => {
      const DUMMY_RESPONSE = {
        depositAddresses: [
          { address: 'bc1qunused1' },
          { address: 'bc1qunused2' }
        ],
        offset: 0
      }

      mockClient.getUnusedDepositAddresses.mockResolvedValue(DUMMY_RESPONSE)

      const result = await account.getUnusedDepositAddresses()

      expect(mockClient.getUnusedDepositAddresses).toHaveBeenCalledWith({
        sparkAddress: ADDRESS
      })
      expect(result).toEqual(DUMMY_RESPONSE)
    })

    test('should pass pagination options', async () => {
      const DUMMY_RESPONSE = {
        depositAddresses: [{ address: 'bc1qunused1' }],
        offset: 10
      }

      mockClient.getUnusedDepositAddresses.mockResolvedValue(DUMMY_RESPONSE)

      const result = await account.getUnusedDepositAddresses({ limit: 5, offset: 10 })

      expect(mockClient.getUnusedDepositAddresses).toHaveBeenCalledWith({
        sparkAddress: ADDRESS,
        limit: 5,
        offset: 10
      })
      expect(result).toEqual(DUMMY_RESPONSE)
    })
  })

  describe('getStaticDepositAddresses', () => {
    test('should return static deposit addresses', async () => {
      const DUMMY_ADDRESSES = [
        { address: 'bc1qstatic1' },
        { address: 'bc1qstatic2' }
      ]

      mockClient.getStaticDepositAddresses.mockResolvedValue(DUMMY_ADDRESSES)

      const result = await account.getStaticDepositAddresses()

      expect(mockClient.getStaticDepositAddresses).toHaveBeenCalledWith(ADDRESS)
      expect(result).toEqual(DUMMY_ADDRESSES)
    })
  })

  describe('getUtxosForDepositAddress', () => {
    test('should return UTXOs for a deposit address', async () => {
      const DUMMY_OPTIONS = {
        depositAddress: 'bc1qdeposit123',
        excludeClaimed: true
      }

      const DUMMY_RESPONSE = {
        utxos: [
          { txid: 'txid1', vout: 0 },
          { txid: 'txid2', vout: 1 }
        ],
        offset: 0
      }

      mockClient.getUtxosForDepositAddress.mockResolvedValue(DUMMY_RESPONSE)

      const result = await account.getUtxosForDepositAddress(DUMMY_OPTIONS)

      expect(mockClient.getUtxosForDepositAddress).toHaveBeenCalledWith(DUMMY_OPTIONS)
      expect(result).toEqual(DUMMY_RESPONSE)
    })
  })

  describe('getSparkInvoices', () => {
    test('should return the status of spark invoices', async () => {
      const DUMMY_PARAMS = {
        invoices: ['spark1invoice1', 'spark1invoice2']
      }

      const DUMMY_RESPONSE = {
        invoiceStatuses: [
          { invoice: 'spark1invoice1', status: 'PAID' },
          { invoice: 'spark1invoice2', status: 'PENDING' }
        ],
        offset: 0
      }

      mockClient.getSparkInvoices.mockResolvedValue(DUMMY_RESPONSE)

      const result = await account.getSparkInvoices(DUMMY_PARAMS)

      expect(mockClient.getSparkInvoices).toHaveBeenCalledWith(DUMMY_PARAMS)
      expect(result).toEqual(DUMMY_RESPONSE)
    })
  })
})
