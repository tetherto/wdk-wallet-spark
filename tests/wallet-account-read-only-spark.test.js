import { describe, beforeEach, expect, jest, test } from '@jest/globals'

const ADDRESS = 'sp1pgss9mdgv7f6cf3lq5a3feh2jtnuypgf2x438tdq79q9jxtnflj9hhq4htem47'

const DUMMY_SPARK_SCAN_API_KEY = 'dummy-spark-scan-api-key'

const addressSummaryV1AddressAddressGetMock = jest.fn()

const getTransactionDetailsByIdV1TxTxidGetMock = jest.fn()

jest.unstable_mockModule('@sparkscan/api-node-sdk-client', () => ({
  addressSummaryV1AddressAddressGet: addressSummaryV1AddressAddressGetMock,
  getTransactionDetailsByIdV1TxTxidGet: getTransactionDetailsByIdV1TxTxidGetMock
}))

const { WalletAccountReadOnlySpark } = await import('../index.js')

describe('WalletAccountReadOnlySpark', () => {
  let account

  beforeEach(async () => {
    account = new WalletAccountReadOnlySpark(ADDRESS, {
      network: 'MAINNET',
      sparkScanApiKey: DUMMY_SPARK_SCAN_API_KEY
    })
  })

  describe('getBalance', () => {
    test('should return the correct balance of the account', async () => {
      const DUMMY_ADDRESS_SUMMARY_RESPONSE = {
        balance: {
          btcHardBalanceSats: 12_345
        }
      }

      addressSummaryV1AddressAddressGetMock.mockResolvedValue(DUMMY_ADDRESS_SUMMARY_RESPONSE)

      const balance = await account.getBalance()

      expect(addressSummaryV1AddressAddressGetMock).toHaveBeenCalledWith(ADDRESS, { network: 'MAINNET' }, {
        headers: {
          'Authorization': `Bearer ${DUMMY_SPARK_SCAN_API_KEY}`
        }
      })

      expect(balance).toBe(12_345)
    })
  })

  describe('getTokenBalance', () => {
    test('should throw an unsupported operation error', async () => {
      await expect(account.getTokenBalance('token-address'))
        .rejects.toThrow('Method not supported on the spark blockchain.')
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

  describe('quoteTransfer', () => {
    test('should throw an unsupported operation error', async () => {
      await expect(account.quoteTransfer({}))
        .rejects.toThrow('Method not supported on the spark blockchain.')
    })
  })

  describe('getTransactionReceipt', () => {
    const DUMMY_TRANSACTION_HASH = 'dummy-transfer-id'

    test('should return the correct transaction receipt', async () => {
      const DUMMY_TRANSACTION_RECEIPT = {
        id: DUMMY_TRANSACTION_HASH,
        amountSats: 1_000
      }

      getTransactionDetailsByIdV1TxTxidGetMock.mockResolvedValue(DUMMY_TRANSACTION_RECEIPT)

      const receipt = await account.getTransactionReceipt(DUMMY_TRANSACTION_HASH)

      expect(getTransactionDetailsByIdV1TxTxidGetMock).toHaveBeenCalledWith(DUMMY_TRANSACTION_HASH, { network: 'MAINNET' }, {
        headers: {
          'Authorization': `Bearer ${DUMMY_SPARK_SCAN_API_KEY}`
        }
      })

      expect(receipt).toEqual(DUMMY_TRANSACTION_RECEIPT)
    })

    test('should return null if the transaction has not been included in a block yet', async () => {
      getTransactionDetailsByIdV1TxTxidGetMock.mockRejectedValue({ status: 404 })

      const receipt = await account.getTransactionReceipt(DUMMY_TRANSACTION_HASH)

      expect(getTransactionDetailsByIdV1TxTxidGetMock).toHaveBeenCalledWith(DUMMY_TRANSACTION_HASH, { network: 'MAINNET' }, {
        headers: {
          'Authorization': `Bearer ${DUMMY_SPARK_SCAN_API_KEY}`
        }
      })

      expect(receipt).toBe(null)
    })
  })
})