import { beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals'

import * as sparkSdk from '@buildonspark/spark-sdk'

import * as bip39 from 'bip39'

import Bip44SparkSigner from '../src/bip-44/spark-signer.js'

const { SparkWallet } = sparkSdk

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

jest.unstable_mockModule('@buildonspark/spark-sdk', () => ({
  ...sparkSdk,
  getLatestDepositTxId: getLatestDepositTxIdMock
}))

const { WalletAccountSpark } = await import('../index.js')

describe('WalletAccountSpark', () => {
  let sparkWallet,
      account

  beforeAll(async () => {
    const { wallet } = await SparkWallet.initialize({
      signer: new Bip44SparkSigner(0),
      mnemonicOrSeed: SEED,
      options: {
        network: 'MAINNET'
      }
    })

    sparkWallet = wallet
  }, 10_000)

  afterAll(async () => {
    await sparkWallet.cleanupConnections()
  }, 10_000)

  beforeEach(() => {
    account = new WalletAccountSpark(sparkWallet)
  })

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
    const DUMMY_TRANSACTION = {
      to: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
      value: 100
    }

    const DUMMY_WALLET_TRANSFER = {
      id: 'dummy-wallet-transfer-1'
    }

    test('should successfully send a transaction', async () => {
      sparkWallet.transfer = jest.fn().mockResolvedValue(DUMMY_WALLET_TRANSFER)

      const { hash, fee } = await account.sendTransaction(DUMMY_TRANSACTION)

      expect(sparkWallet.transfer).toHaveBeenCalledWith({
        receiverSparkAddress: DUMMY_TRANSACTION.to,
        amountSats: DUMMY_TRANSACTION.value
      })

      expect(hash).toBe(DUMMY_WALLET_TRANSFER.id)

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
      sparkWallet.getBalance = jest.fn(() => ({
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
  
  describe('getTransactionReceipt', () => {
    const DUMMY_TRANSACTION_HASH = 'dummy-transfer-id'

    test('should return the correct transaction receipt', async () => {
      const DUMMY_TRANSACTION_RECEIPT = {
        id: DUMMY_TRANSACTION_HASH,
        totalValue: 1_000
      }

      sparkWallet.getTransfer = jest.fn().mockResolvedValue(DUMMY_TRANSACTION_RECEIPT)

      const receipt = await account.getTransactionReceipt(DUMMY_TRANSACTION_HASH)
      expect(sparkWallet.getTransfer).toHaveBeenCalledWith(DUMMY_TRANSACTION_HASH)
      expect(receipt).toEqual(DUMMY_TRANSACTION_RECEIPT)
    })

    test('should return null if the transaction has not been included in a block yet', async () => {
      sparkWallet.getTransfer = jest.fn().mockResolvedValue(undefined)
      
      const receipt = await account.getTransactionReceipt(DUMMY_TRANSACTION_HASH)
      expect(sparkWallet.getTransfer).toHaveBeenCalledWith(DUMMY_TRANSACTION_HASH)
      expect(receipt).toBe(null)
    })
  })

  describe('getSingleUseDepositAddress', () => {
    test('should return a valid single use deposit address', async () => {
      const DUMMY_SINGLE_USE_DEPOSIT_ADDRESS = 'bc1pgljhxntemplmml7xz9gmf7cptw4hualdnf348jmu95k6gzuxgfeslrg6kh'
      sparkWallet.getSingleUseDepositAddress = jest.fn().mockResolvedValue(DUMMY_SINGLE_USE_DEPOSIT_ADDRESS)

      const address = await account.getSingleUseDepositAddress()
      expect(sparkWallet.getSingleUseDepositAddress).toHaveBeenCalled()
      expect(address).toMatch(DUMMY_SINGLE_USE_DEPOSIT_ADDRESS)
    })
  })

  describe('claimDeposit', () => {
    test('should successfully claim a deposit', async () => {
      const DUMMY_TX_ID = 'dummy-tx-id'

      const DUMMY_WALLET_LEAFS = [
        { id: 'wallet-leaf-1' },
        { id: 'wallet-leaf-2' }
      ]

      sparkWallet.claimDeposit = jest.fn().mockResolvedValue(DUMMY_WALLET_LEAFS)

      const nodes = await account.claimDeposit(DUMMY_TX_ID)
      expect(sparkWallet.claimDeposit).toHaveBeenCalledWith(DUMMY_TX_ID)
      expect(nodes).toEqual(DUMMY_WALLET_LEAFS)
    })
  })

  describe('getLatestDepositTxId', () => {
    test('should return the latest deposit transaction id', async () => {
      const DUMMY_LATEST_DEPOSIT_TX_ID = 'dummy-latest-tx-id'
      getLatestDepositTxIdMock.mockResolvedValue(DUMMY_LATEST_DEPOSIT_TX_ID)

      const txId = await account.getLatestDepositTxId()
      expect(getLatestDepositTxIdMock).toHaveBeenCalled()
      expect(txId).toBe(DUMMY_LATEST_DEPOSIT_TX_ID)
    })
  })

  describe('withdraw', () => {
    test('should successfully initialize a withdrawal', async () => {
      const DUMMY_OPTIONS = {
        to: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
        value: 100
      }

      const DUMMY_COOP_EXIT_REQUEST = { 
        id: 'coop-exit-request-1' 
      }

      sparkWallet.withdraw = jest.fn().mockResolvedValue(DUMMY_COOP_EXIT_REQUEST)

      const coopExitRequest = await account.withdraw(DUMMY_OPTIONS)

      expect(sparkWallet.withdraw).toHaveBeenCalledWith({
        onchainAddress: DUMMY_OPTIONS.to,
        amountSats: DUMMY_OPTIONS.value,
        exitSpeed: 'MEDIUM'
      })

      expect(coopExitRequest).toEqual(DUMMY_COOP_EXIT_REQUEST)
    })
  })

  describe('createLightningInvoice', () => {
    test('should successfully create a lighting invoice', async () => {
      const DUMMY_OPTIONS = { 
        value: 1_500, 
        memo: 'This is just a test invoice.' 
      }

      const DUMMY_LIGHTNING_RECEIVE_REQUEST = { 
        id: 'lightining-receive-request-1' 
      }

      sparkWallet.createLightningInvoice = jest.fn().mockResolvedValue(DUMMY_LIGHTNING_RECEIVE_REQUEST)

      const lightningReceiveRequest = await account.createLightningInvoice(DUMMY_OPTIONS)

      expect(sparkWallet.createLightningInvoice).toHaveBeenCalledWith({
        amountSats: DUMMY_OPTIONS.value,
        memo: DUMMY_OPTIONS.memo
      })

      expect(lightningReceiveRequest).toEqual(DUMMY_LIGHTNING_RECEIVE_REQUEST)
    })
  })

  describe('getLightningReceiveRequest', () => {
    test('should successfully return the lightning receive request', async () => {
      const DUMMY_INVOICE_ID = 'dummy-invoice-id'

      const DUMMY_LIGHTING_RECEIVE_REQUEST = { 
        id: DUMMY_INVOICE_ID 
      }

      sparkWallet.getLightningReceiveRequest = jest.fn().mockResolvedValue(DUMMY_LIGHTING_RECEIVE_REQUEST)

      const lightningReceiveRequest = await account.getLightningReceiveRequest(DUMMY_INVOICE_ID)
      expect(sparkWallet.getLightningReceiveRequest).toHaveBeenCalledWith(DUMMY_INVOICE_ID)
      expect(lightningReceiveRequest).toEqual(DUMMY_LIGHTING_RECEIVE_REQUEST)
    })
  })

  describe('payLightningInvoice', () => {
    test('should successfully pay a lightning invoice', async () => {
      const DUMMY_OPTIONS = { 
        invoice: 'dummy-bolt11-invoice',
        maxFeeSats: 50 
      }

      const DUMMY_LIGHTNING_SEND_REQUEST = { 
        id: 'lighting-send-request-1'
      }

      sparkWallet.payLightningInvoice = jest.fn().mockResolvedValue(DUMMY_LIGHTNING_SEND_REQUEST)

      const lightningSendRequest = await account.payLightningInvoice(DUMMY_OPTIONS)

      expect(sparkWallet.payLightningInvoice).toHaveBeenCalledWith({
        invoice: DUMMY_OPTIONS.invoice,
        maxFeeSats: DUMMY_OPTIONS.maxFeeSats
      })

      expect(lightningSendRequest).toEqual(DUMMY_LIGHTNING_SEND_REQUEST)
    })
  })

  describe('getLightningSendFeeEstimate', () => {
    test('should successfully return the fee estimate', async () => {
      const DUMMY_OPTIONS = {
        invoice: 'dummy-bolt11-invoice'
      }

      const DUMMY_FEE_ESTIMATE = 100

      sparkWallet.getLightningSendFeeEstimate = jest.fn().mockResolvedValue(DUMMY_FEE_ESTIMATE)

      const feeEstimate = await account.getLightningSendFeeEstimate(DUMMY_OPTIONS)

      expect(sparkWallet.getLightningSendFeeEstimate).toHaveBeenCalledWith({
        encodedInvoice: DUMMY_OPTIONS.invoice
      })

      expect(feeEstimate).toBe(DUMMY_FEE_ESTIMATE)
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
      sparkWallet.getTransfers = jest.fn().mockResolvedValueOnce({ transfers: [] })

      const transfers = await account.getTransfers()
      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(10, 0)
      expect(transfers).toEqual([])
    })

    test('should return the full transfer history', async () => {
      sparkWallet.getTransfers = jest.fn().mockResolvedValueOnce({ transfers: DUMMY_TRANSFERS })
        .mockResolvedValue({ transfers: [] })

      const transfers = await account.getTransfers()
      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(10, 0)
      expect(transfers).toEqual(DUMMY_TRANSFERS)
    })

    test('should return the incoming transfer history', async () => {
      sparkWallet.getTransfers = jest.fn().mockResolvedValueOnce({ transfers: DUMMY_TRANSFERS })
        .mockResolvedValue({ transfers: [] })

      const transfers = await account.getTransfers({ direction: 'incoming' })
      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(10, 0)
      expect(transfers).toEqual([DUMMY_TRANSFERS[0], DUMMY_TRANSFERS[2], DUMMY_TRANSFERS[4]])
    })

    test('should return the outgoing transfer history', async () => {
      sparkWallet.getTransfers = jest.fn().mockResolvedValueOnce({ transfers: DUMMY_TRANSFERS })
        .mockResolvedValue({ transfers: [] })

      const transfers = await account.getTransfers({ direction: 'outgoing' })
      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(10, 0)
      expect(transfers).toEqual([DUMMY_TRANSFERS[1], DUMMY_TRANSFERS[3]])
    })

    test('should correctly paginate the transfer history', async () => {
      sparkWallet.getTransfers = jest.fn().mockResolvedValueOnce({ transfers: DUMMY_TRANSFERS })
        .mockResolvedValue({ transfers: [] })

      const transfers = await account.getTransfers({ limit: 2, skip: 1 })
      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(3, 0)
      expect(transfers).toEqual([DUMMY_TRANSFERS[1], DUMMY_TRANSFERS[2]])
    })

    test('should correctly filter and paginate the transfer history', async () => {
      sparkWallet.getTransfers = jest.fn().mockResolvedValueOnce({ transfers: DUMMY_TRANSFERS.slice(0, 3) })
        .mockResolvedValueOnce({ transfers: DUMMY_TRANSFERS.slice(3) })
        .mockResolvedValue({ transfers: [] })

      const transfers = await account.getTransfers({ limit: 2, skip: 1, direction: 'incoming' })

      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(3, 0)
      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(3, 3)
      expect(transfers).toEqual([DUMMY_TRANSFERS[2], DUMMY_TRANSFERS[4]])
    })
  })

  describe('cleanupConnections', () => {
    test('should close and clean up connections with the blockchain', async () => {
      sparkWallet.cleanupConnections = jest.fn()

      await account.cleanupConnections()

      expect(sparkWallet.cleanupConnections).toHaveBeenCalled()
    })
  })
})
