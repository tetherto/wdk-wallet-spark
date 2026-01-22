import { describe, beforeEach, expect, jest, test } from '@jest/globals'

const ADDRESS = 'sp1pgss9mdgv7f6cf3lq5a3feh2jtnuypgf2x438tdq79q9jxtnflj9hhq4htem47'

const DUMMY_SPARK_SCAN_API_KEY = 'dummy-spark-scan-api-key'

const addressSummaryV1AddressAddressGetMock = jest.fn()

const getAddressTokensV1AddressAddressTokensGetMock = jest.fn()

const getTransactionDetailsByIdV1TxTxidGetMock = jest.fn()

jest.unstable_mockModule('@sparkscan/api-node-sdk-client', () => ({
  addressSummaryV1AddressAddressGet: addressSummaryV1AddressAddressGetMock,
  getAddressTokensV1AddressAddressTokensGet: getAddressTokensV1AddressAddressTokensGetMock,
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
          Authorization: `Bearer ${DUMMY_SPARK_SCAN_API_KEY}`
        }
      })
      expect(balance).toBe(12_345n)
    })
  })

  describe('getTokenBalance', () => {
    const DUMMY_TOKEN_ADDRESS = '0x1234567890abcdef'

    test('should return the correct token balance', async () => {
      const DUMMY_TOKENS_RESPONSE = {
        tokens: [
          { tokenAddress: DUMMY_TOKEN_ADDRESS, balance: 5_000 },
          { tokenAddress: '0xother', balance: 1_000 }
        ]
      }

      getAddressTokensV1AddressAddressTokensGetMock.mockResolvedValue(DUMMY_TOKENS_RESPONSE)

      const balance = await account.getTokenBalance(DUMMY_TOKEN_ADDRESS)

      expect(getAddressTokensV1AddressAddressTokensGetMock).toHaveBeenCalledWith(ADDRESS, { network: 'MAINNET' }, {
        headers: {
          Authorization: `Bearer ${DUMMY_SPARK_SCAN_API_KEY}`
        }
      })
      expect(balance).toBe(5_000n)
    })

    test('should return 0n if the token is not found', async () => {
      const DUMMY_TOKENS_RESPONSE = {
        tokens: [
          { tokenAddress: '0xother', balance: 1_000 }
        ]
      }

      getAddressTokensV1AddressAddressTokensGetMock.mockResolvedValue(DUMMY_TOKENS_RESPONSE)

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
          Authorization: `Bearer ${DUMMY_SPARK_SCAN_API_KEY}`
        }
      })

      expect(receipt).toEqual(DUMMY_TRANSACTION_RECEIPT)
    })

    test('should return null if the transaction has not been included in a block yet', async () => {
      getTransactionDetailsByIdV1TxTxidGetMock.mockRejectedValue({ status: 404 })

      const receipt = await account.getTransactionReceipt(DUMMY_TRANSACTION_HASH)

      expect(getTransactionDetailsByIdV1TxTxidGetMock).toHaveBeenCalledWith(DUMMY_TRANSACTION_HASH, { network: 'MAINNET' }, {
        headers: {
          Authorization: `Bearer ${DUMMY_SPARK_SCAN_API_KEY}`
        }
      })

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
})
