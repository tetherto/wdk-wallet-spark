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

const LIGHTNING_SEND_FEE_ESTIMATE = 1000

await jest.unstable_mockModule('@sparkscan/api-node-sdk-client', () => ({
  addressSummaryV1AddressAddressGet: jest.fn().mockResolvedValue({
    balance: {
      btcHardBalanceSats: ACCOUNT.balance
    }
  }),
  getLatestTransactionsV1TxLatestGet: jest.fn().mockResolvedValue([TRANSACTION_RECEIPT]),
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

    test('should throw an error when getting balance without API key', async () => {
      const { WalletAccountReadOnlySpark } = await import('../index.js')

      const accountWithoutKey = new WalletAccountReadOnlySpark(ACCOUNT.address, { network: 'REGTEST' })

      await expect(accountWithoutKey.getBalance()).rejects.toThrow('Please provide a SparkScan API key in the config to retrieve the balance.')
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

    test('should throw an error when getting transaction receipt without API key', async () => {
      const { WalletAccountReadOnlySpark } = await import('../index.js')

      const accountWithoutKey = new WalletAccountReadOnlySpark(ACCOUNT.address, { network: 'REGTEST' })

      await expect(accountWithoutKey.getTransactionReceipt('test-tx-id')).rejects.toThrow('Please provide a SparkScan API key in the config to retrieve the transaction receipt.')
    })
  })

  describe('getLatestDepositTxId', () => { 
    test('should throw an error', async () => {
      await expect(account.getLatestDepositTxId('deposit-address')).rejects.toThrow('Get latest deposit tx id is not supported in read-only account')
    })
  })

  describe('getLightningReceiveRequest', () => {
    test('should throw an error', async () => {
      await expect(account.getLightningReceiveRequest('invoice-id')).rejects.toThrow('Get Lightning receive request is not supported in read-only account')
    })
  })

  describe('getTransfers', () => {
    test('should throw an error when getting transfers without API key', async () => {
      const { WalletAccountReadOnlySpark } = await import('../index.js')

      const accountWithoutKey = new WalletAccountReadOnlySpark(ACCOUNT.address, { network: 'REGTEST' })

      await expect(accountWithoutKey.getTransfers()).rejects.toThrow('Please provide a SparkScan API key in the config to retrieve the transfers.')
    })

    // TODO: Add tests for getTransfers
  })
})
