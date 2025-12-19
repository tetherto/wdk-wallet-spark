import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals'

import { SparkWallet } from '@buildonspark/spark-sdk'

import * as bip39 from 'bip39'

import { WalletAccountSpark, WalletAccountReadOnlySpark } from '../index.js'

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
  })

  afterAll(async () => {
    await sparkWallet.cleanupConnections()
  })

  beforeEach(() => {
    account = new WalletAccountSpark(sparkWallet, {
      network: 'MAINNET'
    })
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
    test('should return the account spark address', async () => {
      const DUMMY_ADDRESS = 'sp1pgss9mdgv7f6cf3lq5a3feh2jtnuypgf2x438tdq79q9jxtnflj9hhq4htem47'

      sparkWallet.getSparkAddress = jest.fn().mockResolvedValue(DUMMY_ADDRESS)

      const address = await account.getAddress()

      expect(sparkWallet.getSparkAddress).toHaveBeenCalled()
      expect(address).toBe(DUMMY_ADDRESS)
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

      expect(fee).toBe(0n)
    })
  })

  describe('transfer', () => {
    const DUMMY_TRANSFER_OPTIONS = {
      recipient: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
      token: 'btkn1qxk5cq74ldm',
      amount: 1000n
    }

    const DUMMY_TX_ID = 'dummy-token-transfer-1'

    test('should successfully transfer tokens', async () => {
      sparkWallet.transferTokens = jest.fn().mockResolvedValue(DUMMY_TX_ID)

      const { hash, fee } = await account.transfer(DUMMY_TRANSFER_OPTIONS)

      expect(sparkWallet.transferTokens).toHaveBeenCalledWith({
        tokenIdentifier: DUMMY_TRANSFER_OPTIONS.token,
        tokenAmount: BigInt(DUMMY_TRANSFER_OPTIONS.amount),
        receiverSparkAddress: DUMMY_TRANSFER_OPTIONS.recipient
      })

      expect(hash).toBe(DUMMY_TX_ID)

      expect(fee).toBe(0n)
    })
  })

  describe('getSingleUseDepositAddress', () => {
    test('should return a single use deposit address', async () => {
      const DUMMY_ADDRESS = 'bc1pgljhxntemplmml7xz9gmf7cptw4hualdnf348jmu95k6gzuxgfeslrg6kh'

      sparkWallet.getSingleUseDepositAddress = jest.fn().mockResolvedValue(DUMMY_ADDRESS)

      const address = await account.getSingleUseDepositAddress()

      expect(sparkWallet.getSingleUseDepositAddress).toHaveBeenCalled()
      expect(address).toBe(DUMMY_ADDRESS)
    })
  })

  describe('getStaticDepositAddress', () => {
    test('should return the static deposit address', async () => {
      const DUMMY_STATIC_DEPOSIT_ADDRESS = 'bc1qstaticdeposit123'

      sparkWallet.getStaticDepositAddress = jest.fn().mockResolvedValue(DUMMY_STATIC_DEPOSIT_ADDRESS)

      const address = await account.getStaticDepositAddress()

      expect(sparkWallet.getStaticDepositAddress).toHaveBeenCalled()
      expect(address).toBe(DUMMY_STATIC_DEPOSIT_ADDRESS)
    })
  })

  describe('getUnusedDepositAddresses', () => {
    test('should return a list of unused deposit addresses', async () => {
      const DUMMY_ADDRESSES = [
        'bc1qunused1',
        'bc1qunused2',
        'bc1qunused3'
      ]

      sparkWallet.getUnusedDepositAddresses = jest.fn().mockResolvedValue(DUMMY_ADDRESSES)

      const addresses = await account.getUnusedDepositAddresses()

      expect(sparkWallet.getUnusedDepositAddresses).toHaveBeenCalled()
      expect(addresses).toEqual(DUMMY_ADDRESSES)
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

  describe('claimStaticDeposit', () => {
    test('should successfully claim a static deposit', async () => {
      const DUMMY_CLAIM_STATIC_DEPOSIT_QUOTE = {
        signature: 'dummy-signature',
        creditAmountSats: 1_000
      }

      const DUMMY_WALLET_LEAFS = [
        { id: 'wallet-leaf-1' }
      ]

      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue(DUMMY_CLAIM_STATIC_DEPOSIT_QUOTE)

      sparkWallet.claimStaticDeposit = jest.fn().mockResolvedValue(DUMMY_WALLET_LEAFS)

      const result = await account.claimStaticDeposit('dummy-transaction-id')

      expect(sparkWallet.getClaimStaticDepositQuote).toHaveBeenCalledWith('dummy-transaction-id')

      expect(sparkWallet.claimStaticDeposit).toHaveBeenCalledWith({
        transactionId: 'dummy-transaction-id',
        creditAmountSats: 1_000,
        sspSignature: 'dummy-signature'
      })

      expect(result).toEqual(DUMMY_WALLET_LEAFS)
    })
  })

  describe('refundStaticDeposit', () => {
    test('should successfully refund a static deposit', async () => {
      const DUMMY_OPTIONS = {
        depositTransactionId: 'dummy-deposit-tx-id',
        outputIndex: 0,
        destinationAddress: 'bc1qdestination',
        satsPerVbyteFee: 10
      }

      const DUMMY_REFUND_TX_HEX = '0200000001...'

      sparkWallet.refundStaticDeposit = jest.fn().mockResolvedValue(DUMMY_REFUND_TX_HEX)

      const refundTxHex = await account.refundStaticDeposit(DUMMY_OPTIONS)

      expect(sparkWallet.refundStaticDeposit).toHaveBeenCalledWith(DUMMY_OPTIONS)
      expect(refundTxHex).toBe(DUMMY_REFUND_TX_HEX)
    })
  })

  describe('quoteWithdraw', () => {
    test('should return a withdrawal fee quote', async () => {
      const DUMMY_OPTIONS = {
        withdrawalAddress: 'bc1qwithdraw',
        amountSats: 10_000
      }

      const DUMMY_FEE_QUOTE = {
        feeSats: 500,
        expiryTime: new Date()
      }

      sparkWallet.getWithdrawalFeeQuote = jest.fn().mockResolvedValue(DUMMY_FEE_QUOTE)

      const feeQuote = await account.quoteWithdraw(DUMMY_OPTIONS)

      expect(sparkWallet.getWithdrawalFeeQuote).toHaveBeenCalledWith(DUMMY_OPTIONS)
      expect(feeQuote).toEqual(DUMMY_FEE_QUOTE)
    })
  })

  describe('withdraw', () => {
    test('should successfully initialize a withdrawal', async () => {
      const DUMMY_OPTIONS = {
        onchainAddress: 'tb1qx3fju0uclmp0xmqzhxjcydeal6eky95srd2laj',
        amountSats: 100,
        exitSpeed: 'MEDIUM'
      }

      const DUMMY_COOP_EXIT_FEE_QUOTE = {
        id: 'coop-exit-fee-quote-1'
      }

      const DUMMY_COOP_EXIT_REQUEST = {
        id: 'coop-exit-request-1'
      }

      sparkWallet.getWithdrawalFeeQuote = jest.fn().mockResolvedValue(DUMMY_COOP_EXIT_FEE_QUOTE)

      sparkWallet.withdraw = jest.fn().mockResolvedValue(DUMMY_COOP_EXIT_REQUEST)

      const coopExitRequest = await account.withdraw(DUMMY_OPTIONS)

      expect(sparkWallet.getWithdrawalFeeQuote).toHaveBeenCalledWith({
        withdrawalAddress: DUMMY_OPTIONS.onchainAddress,
        amountSats: DUMMY_OPTIONS.amountSats
      })

      expect(sparkWallet.withdraw).toHaveBeenCalledWith({
        ...DUMMY_OPTIONS,
        feeQuote: DUMMY_COOP_EXIT_FEE_QUOTE
      })

      expect(coopExitRequest).toEqual(DUMMY_COOP_EXIT_REQUEST)
    })
  })

  describe('createLightningInvoice', () => {
    test('should successfully create a lightning invoice', async () => {
      const DUMMY_OPTIONS = {
        amountSats: 1_500,
        memo: 'Test invoice'
      }

      const DUMMY_LIGHTNING_RECEIVE_REQUEST = {
        id: 'lightning-receive-request-1',
        invoice: 'lnbc...'
      }

      sparkWallet.createLightningInvoice = jest.fn().mockResolvedValue(DUMMY_LIGHTNING_RECEIVE_REQUEST)

      const result = await account.createLightningInvoice(DUMMY_OPTIONS)

      expect(sparkWallet.createLightningInvoice).toHaveBeenCalledWith(DUMMY_OPTIONS)
      expect(result).toEqual(DUMMY_LIGHTNING_RECEIVE_REQUEST)
    })
  })

  describe('getLightningReceiveRequest', () => {
    test('should return a lightning receive request by id', async () => {
      const DUMMY_INVOICE_ID = 'dummy-invoice-id'

      const DUMMY_LIGHTNING_RECEIVE_REQUEST = {
        id: DUMMY_INVOICE_ID,
        invoice: 'lnbc...'
      }

      sparkWallet.getLightningReceiveRequest = jest.fn().mockResolvedValue(DUMMY_LIGHTNING_RECEIVE_REQUEST)

      const result = await account.getLightningReceiveRequest(DUMMY_INVOICE_ID)

      expect(sparkWallet.getLightningReceiveRequest).toHaveBeenCalledWith(DUMMY_INVOICE_ID)
      expect(result).toEqual(DUMMY_LIGHTNING_RECEIVE_REQUEST)
    })

    test('should return null if invoice not found', async () => {
      sparkWallet.getLightningReceiveRequest = jest.fn().mockResolvedValue(null)

      const result = await account.getLightningReceiveRequest('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('getLightningSendRequest', () => {
    test('should return a lightning send request by id', async () => {
      const DUMMY_REQUEST_ID = 'dummy-request-id'

      const DUMMY_LIGHTNING_SEND_REQUEST = {
        id: DUMMY_REQUEST_ID,
        status: 'COMPLETED'
      }

      sparkWallet.getLightningSendRequest = jest.fn().mockResolvedValue(DUMMY_LIGHTNING_SEND_REQUEST)

      const result = await account.getLightningSendRequest(DUMMY_REQUEST_ID)

      expect(sparkWallet.getLightningSendRequest).toHaveBeenCalledWith(DUMMY_REQUEST_ID)
      expect(result).toEqual(DUMMY_LIGHTNING_SEND_REQUEST)
    })

    test('should return null if request not found', async () => {
      sparkWallet.getLightningSendRequest = jest.fn().mockResolvedValue(null)

      const result = await account.getLightningSendRequest('non-existent-id')

      expect(result).toBeNull()
    })
  })

  describe('payLightningInvoice', () => {
    test('should successfully pay a lightning invoice', async () => {
      const DUMMY_OPTIONS = {
        invoice: 'lnbc1500...',
        maxFeeSats: 50
      }

      const DUMMY_LIGHTNING_SEND_REQUEST = {
        id: 'lightning-send-request-1',
        status: 'PENDING'
      }

      sparkWallet.payLightningInvoice = jest.fn().mockResolvedValue(DUMMY_LIGHTNING_SEND_REQUEST)

      const result = await account.payLightningInvoice(DUMMY_OPTIONS)

      expect(sparkWallet.payLightningInvoice).toHaveBeenCalledWith(DUMMY_OPTIONS)
      expect(result).toEqual(DUMMY_LIGHTNING_SEND_REQUEST)
    })
  })

  describe('quotePayLightningInvoice', () => {
    test('should return the fee estimate as bigint', async () => {
      const DUMMY_OPTIONS = {
        encodedInvoice: 'lnbc1500...'
      }

      const DUMMY_FEE_ESTIMATE = 100

      sparkWallet.getLightningSendFeeEstimate = jest.fn().mockResolvedValue(DUMMY_FEE_ESTIMATE)

      const feeEstimate = await account.quotePayLightningInvoice(DUMMY_OPTIONS)

      expect(sparkWallet.getLightningSendFeeEstimate).toHaveBeenCalledWith(DUMMY_OPTIONS)
      expect(feeEstimate).toBe(BigInt(DUMMY_FEE_ESTIMATE))
    })
  })

  describe('createSparkSatsInvoice', () => {
    test('should successfully create a spark sats invoice', async () => {
      const DUMMY_OPTIONS = {
        amount: 1_000,
        memo: 'Test sats invoice'
      }

      const DUMMY_INVOICE = 'spark1invoice...'

      sparkWallet.createSatsInvoice = jest.fn().mockResolvedValue(DUMMY_INVOICE)

      const invoice = await account.createSparkSatsInvoice(DUMMY_OPTIONS)

      expect(sparkWallet.createSatsInvoice).toHaveBeenCalledWith(DUMMY_OPTIONS)
      expect(invoice).toBe(DUMMY_INVOICE)
    })
  })

  describe('createSparkTokensInvoice', () => {
    test('should successfully create a spark tokens invoice', async () => {
      const DUMMY_OPTIONS = {
        tokenIdentifier: 'btkn1abc',
        amount: 500n,
        memo: 'Test tokens invoice'
      }

      const DUMMY_INVOICE = 'spark1tokeninvoice...'

      sparkWallet.createTokensInvoice = jest.fn().mockResolvedValue(DUMMY_INVOICE)

      const invoice = await account.createSparkTokensInvoice(DUMMY_OPTIONS)

      expect(sparkWallet.createTokensInvoice).toHaveBeenCalledWith(DUMMY_OPTIONS)
      expect(invoice).toBe(DUMMY_INVOICE)
    })
  })

  describe('paySparkInvoice', () => {
    test('should successfully pay spark invoices', async () => {
      const DUMMY_INVOICES = [
        { invoice: 'spark1invoice1', amount: 100n },
        { invoice: 'spark1invoice2', amount: 200n }
      ]

      const DUMMY_RESPONSE = {
        results: [
          { transferId: 'transfer-1' },
          { transferId: 'transfer-2' }
        ],
        errors: []
      }

      sparkWallet.fulfillSparkInvoice = jest.fn().mockResolvedValue(DUMMY_RESPONSE)

      const response = await account.paySparkInvoice(DUMMY_INVOICES)

      expect(sparkWallet.fulfillSparkInvoice).toHaveBeenCalledWith({
        sparkInvoices: DUMMY_INVOICES
      })
      expect(response).toEqual(DUMMY_RESPONSE)
    })
  })

  describe('getSparkInvoices', () => {
    test('should return the status of spark invoices', async () => {
      const DUMMY_INVOICES = ['spark1invoice1', 'spark1invoice2']

      const DUMMY_RESPONSE = {
        invoices: [
          { invoice: 'spark1invoice1', status: 'PAID' },
          { invoice: 'spark1invoice2', status: 'PENDING' }
        ]
      }

      sparkWallet.querySparkInvoices = jest.fn().mockResolvedValue(DUMMY_RESPONSE)

      const response = await account.getSparkInvoices(DUMMY_INVOICES)

      expect(sparkWallet.querySparkInvoices).toHaveBeenCalledWith(DUMMY_INVOICES)
      expect(response).toEqual(DUMMY_RESPONSE)
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