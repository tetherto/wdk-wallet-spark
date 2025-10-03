import { describe } from 'noba'
import { spy } from 'noba/spy'
import { deepMock } from 'noba/mock'

const ADDRESS = 'sp1pgss9mdgv7f6cf3lq5a3feh2jtnuypgf2x438tdq79q9jxtnflj9hhq4htem47'

const DUMMY_SPARK_SCAN_API_KEY = 'dummy-spark-scan-api-key'

const DUMMY_ADDRESS_SUMMARY_RESPONSE = {
  balance: {
    btcHardBalanceSats: 12_345
  }
}
const addressSummaryV1AddressAddressGetMock = spy(() => {
  return DUMMY_ADDRESS_SUMMARY_RESPONSE
})

const DUMMY_TRANSACTION_HASH = 'dummy-transfer-id'
const DUMMY_TRANSACTION_RECEIPT = {
  id: DUMMY_TRANSACTION_HASH,
  amountSats: 1_000
}
const getTransactionDetailsByIdV1TxTxidGetMock = spy(async (txHash) => {
  if (txHash === DUMMY_TRANSACTION_HASH) return DUMMY_TRANSACTION_RECEIPT
  throw { status: 404 }
})

describe('WalletAccountReadOnlySpark', async ({ describe, beforeEach }) => {
  let account

  const deepImport = await deepMock('@sparkscan/api-node-sdk-client', import.meta.url, {
    addressSummaryV1AddressAddressGet: addressSummaryV1AddressAddressGetMock,
    getTransactionDetailsByIdV1TxTxidGet: getTransactionDetailsByIdV1TxTxidGetMock
  })

  const { WalletAccountReadOnlySpark } = await deepImport(
    import.meta.resolve('@tetherto/wdk-wallet-spark')
  )

  beforeEach(() => {
    account = new WalletAccountReadOnlySpark(ADDRESS, {
      network: 'MAINNET',
      sparkScanApiKey: DUMMY_SPARK_SCAN_API_KEY
    })
  })

  describe('getBalance', ({ test }) => {
    test('should return the correct balance of the account', async ({ expect }) => {
      const balance = await account.getBalance()

      expect(addressSummaryV1AddressAddressGetMock.calls).toContainEqual([
        ADDRESS,
        { network: 'MAINNET' },
        {
          headers: {
            Authorization: `Bearer ${DUMMY_SPARK_SCAN_API_KEY}`
          }
        }
      ])
      expect(balance).toBe(12_345n)
    })
  })

  describe('getTokenBalance', ({ test }) => {
    test('should throw an unsupported operation error', async ({ expect }) => {
      await expect(async () => {
        await account.getTokenBalance('token-address')
      }).rejects('Method not supported on the spark blockchain.')
    })
  })

  describe('quoteSendTransaction', ({ test }) => {
    const TRANSACTION = {
      to: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
      value: 100
    }

    test('should successfully quote a transaction', async ({ expect }) => {
      const { fee } = await account.quoteSendTransaction(TRANSACTION)

      expect(fee).toBe(0n)
    })
  })

  describe('quoteTransfer', ({ test }) => {
    test('should throw an unsupported operation error', async ({ expect }) => {
      await expect(async () => {
        await account.quoteTransfer({})
      }).rejects('Method not supported on the spark blockchain.')
    })
  })

  describe('getTransactionReceipt', ({ test }) => {
    test('should return the correct transaction receipt', async ({ expect }) => {
      const receipt = await account.getTransactionReceipt(DUMMY_TRANSACTION_HASH)
      expect(getTransactionDetailsByIdV1TxTxidGetMock.calls).toContainEqual([
        DUMMY_TRANSACTION_HASH,
        { network: 'MAINNET' },
        {
          headers: {
            Authorization: `Bearer ${DUMMY_SPARK_SCAN_API_KEY}`
          }
        }
      ])
      expect(receipt).toEqual(DUMMY_TRANSACTION_RECEIPT)
    })

    test('should return null if the transaction has not been included in a block yet', async ({
      expect
    }) => {
      const INVALID_TRANSACTION_HASH = 'invalid-transfer-id'

      const receipt = await account.getTransactionReceipt(INVALID_TRANSACTION_HASH)

      expect(getTransactionDetailsByIdV1TxTxidGetMock.calls).toContainEqual([
        INVALID_TRANSACTION_HASH,
        { network: 'MAINNET' },
        {
          headers: {
            Authorization: `Bearer ${DUMMY_SPARK_SCAN_API_KEY}`
          }
        }
      ])

      expect(receipt).toBe(null)
    })
  })
})
