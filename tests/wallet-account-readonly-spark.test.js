import { describe, beforeEach, test, expect, jest } from '@jest/globals'

const ACCOUNT = {
  address: 'sp1pgss9mdgv7f6cf3lq5a3feh2jtnuypgf2x438tdq79q9jxtnflj9hhq4htem47',
  balance: 1000000
}

const TRANSACTION_RECEIPT = {
  id: 'test-tx-id',
  type: 'spark_transfer',
  status: 'sent',
  amountSats: 1000
}

const TRANSFERS = [
  {
    id: '1',
    type: 'spark_transfer',
    status: 'sent',
    amountSats: 1000,
    from: {
      identifier: ACCOUNT.address
    },
    to: {
      identifier: 'sp1xxx'
    }
  }, {
    id: '2',
    type: 'bitcoin_deposit',
    status: 'sent',
    amountSats: 1000,
    from: {
      identifier: 'sp1xxx'
    },
    to: {
      identifier: ACCOUNT.address
    }
  },
  {
    id: '3',
    type: 'spark_transfer',
    status: 'sent',
    amountSats: 1000,
    from: {
      identifier: 'sp1xxx'
    },
    to: {
      identifier: ACCOUNT.address
    }
  },
  {
    id: '4',
    type: 'spark_transfer',
    status: 'sent',
    amountSats: 1000,
    from: {
      identifier: 'sp1xxx'
    },
    to: {
      identifier: ACCOUNT.address
    }
  },
  {
    id: '5',
    type: 'spark_transfer',
    status: 'sent',
    amountSats: 1000,
    from: {
      identifier: ACCOUNT.address
    },
    to: {
      identifier: 'sp1xxx'
    }
  }
]

const LIGHTNING_SEND_FEE_ESTIMATE = 1000

const getLatestTransactionsMock = jest.fn()

await jest.unstable_mockModule('@sparkscan/api-node-sdk-client', () => ({
  addressSummaryV1AddressAddressGet: jest.fn().mockResolvedValue({
    balance: {
      btcHardBalanceSats: ACCOUNT.balance
    }
  }),
  getLatestTransactionsV1TxLatestGet: getLatestTransactionsMock,
  getTransactionDetailsByIdV1TxTxidGet: jest.fn().mockResolvedValue(TRANSACTION_RECEIPT)
}))

describe('WalletAccountReadOnlySpark', () => {
  let account

  beforeEach(async () => {
    const { WalletAccountReadOnlySpark } = await import('../index.js')

    account = new WalletAccountReadOnlySpark(ACCOUNT.address, {
      sparkScanApiKey: 'test-api-key',
      network: 'MAINNET'
    })

    account._wallet = Promise.resolve({
      getLightningSendFeeEstimate: jest.fn().mockResolvedValue(LIGHTNING_SEND_FEE_ESTIMATE)
    })
  })

  describe('quoteSendTransaction', () => {
    test('should return the correct quote', async () => {
      const quote = await account.quoteSendTransaction({ to: ACCOUNT.address, value: 1000000 })

      expect(quote.fee).toBe(0)
    })
  })

  describe('quoteTransfer', () => {
    test('should throw an error', async () => {
      await expect(account.quoteTransfer({})).rejects.toThrow('Method not supported on the spark blockchain.')
    })
  })

  describe('getBalance', () => {
    test('should get balance successfully', async () => {
      const balance = await account.getBalance()

      expect(balance).toBe(ACCOUNT.balance)
    })
  })

  describe('getTokenBalance', () => {
    test('should throw an error', async () => {
      await expect(account.getTokenBalance('token-address')).rejects.toThrow('Method not supported on the spark blockchain.')
    })
  })

  describe('getLightningSendFeeEstimate', () => {
    test('should return the correct estimate', async () => {
      const estimate = await account.getLightningSendFeeEstimate({ invoice: 'invoice' })

      expect(estimate).toBe(LIGHTNING_SEND_FEE_ESTIMATE)
    })
  })

  describe('getSingleUseDepositAddress', () => {
    test('should throw an error', async () => {
      await expect(account.getSingleUseDepositAddress()).rejects.toThrow('Get single use deposit address is not supported in read-only account')
    })
  })

  describe('getTransactionReceipt', () => {
    test('should get transaction receipt successfully', async () => {
      const receipt = await account.getTransactionReceipt(TRANSACTION_RECEIPT.id)

      expect(receipt.id).toEqual(TRANSACTION_RECEIPT.id)
      expect(receipt.type).toEqual(TRANSACTION_RECEIPT.type)
      expect(receipt.status).toEqual(TRANSACTION_RECEIPT.status)
      expect(receipt.amountSats).toEqual(TRANSACTION_RECEIPT.amountSats)
    })
  })

  describe('utxosForDepositAddress', () => {
    test('should throw an error', async () => {
      await expect(account.getUtxosForDepositAddress('deposit-address')).rejects.toThrow('Get utxos for deposit address is not supported in read-only account')
    })
  })

  describe('getLightningReceiveRequest', () => {
    test('should throw an error', async () => {
      await expect(account.getLightningReceiveRequest('invoice-id')).rejects.toThrow('Get Lightning receive request is not supported in read-only account')
    })
  })

  describe('getTransfers', () => {
    test('should return an empty transfer history', async () => {
      getLatestTransactionsMock.mockResolvedValueOnce([])

      const transfers = await account.getTransfers()
      expect(getLatestTransactionsMock).toHaveBeenCalledWith({ limit: 10, offset: 0, network: 'MAINNET' }, expect.anything())
      expect(transfers).toEqual([])
    })

    test('should return the full transfer history', async () => {
      getLatestTransactionsMock.mockResolvedValueOnce(TRANSFERS)
        .mockResolvedValue([])

      const transfers = await account.getTransfers()
      expect(getLatestTransactionsMock).toHaveBeenCalledWith({ limit: 10, offset: 0, network: 'MAINNET' }, expect.anything())
      expect(transfers).toEqual(TRANSFERS)
    })

    test('should return the incoming transfer history', async () => {
      getLatestTransactionsMock.mockResolvedValueOnce(TRANSFERS)
        .mockResolvedValue([])

      const transfers = await account.getTransfers({ direction: 'incoming' })
      expect(getLatestTransactionsMock).toHaveBeenCalledWith({ limit: 10, offset: 0, network: 'MAINNET' }, expect.anything())
      expect(transfers).toEqual([TRANSFERS[1], TRANSFERS[2], TRANSFERS[3]])
    })

    test('should return the outgoing transfer history', async () => {
      getLatestTransactionsMock.mockResolvedValueOnce(TRANSFERS)
        .mockResolvedValue([])

      const transfers = await account.getTransfers({ direction: 'outgoing' })
      expect(getLatestTransactionsMock).toHaveBeenCalledWith({ limit: 10, offset: 0, network: 'MAINNET' }, expect.anything())
      expect(transfers).toEqual([TRANSFERS[0], TRANSFERS[4]])
    })

    test('should correctly paginate the transfer history', async () => {
      getLatestTransactionsMock.mockResolvedValueOnce(TRANSFERS)
        .mockResolvedValue([])

      const transfers = await account.getTransfers({ limit: 2, skip: 1 })
      expect(getLatestTransactionsMock).toHaveBeenCalledWith({ limit: 3, offset: 0, network: 'MAINNET' }, expect.anything())
      expect(transfers).toEqual([TRANSFERS[1], TRANSFERS[2]])
    })

    test('should correctly filter and paginate the transfer history', async () => {
      getLatestTransactionsMock.mockResolvedValueOnce(TRANSFERS.slice(0, 3))
        .mockResolvedValueOnce(TRANSFERS.slice(3))
        .mockResolvedValue([])

      const transfers = await account.getTransfers({ limit: 2, skip: 1, direction: 'incoming' })
      console.log('transfers', transfers)

      expect(getLatestTransactionsMock).toHaveBeenCalledWith({ limit: 3, offset: 0, network: 'MAINNET' }, expect.anything())
      expect(getLatestTransactionsMock).toHaveBeenCalledWith({ limit: 3, offset: 3, network: 'MAINNET' }, expect.anything())
      expect(transfers).toEqual([TRANSFERS[2], TRANSFERS[4]])
    })
  })
})
