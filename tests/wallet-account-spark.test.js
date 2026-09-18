import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals'

import { SparkWallet, SparkRequestError, encodeSparkAddress, generateTransferId } from '@buildonspark/spark-sdk'

import * as bip39 from 'bip39'

import { ProviderError, ProviderErrorReason, UnsupportedOperationError, ValueError } from '@tetherto/wdk-wallet'

import { WalletAccountSpark, WalletAccountReadOnlySpark, LightningPaymentError } from '../index.js'

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

  describe('getBalance', () => {
    test('should return owned sats balance from spark wallet by default', async () => {
      const DUMMY_BALANCE = 12_345n
      sparkWallet.getBalance = jest.fn().mockResolvedValue({
        satsBalance: { owned: DUMMY_BALANCE }
      })

      const balance = await account.getBalance()

      expect(sparkWallet.getBalance).toHaveBeenCalled()
      expect(balance).toBe(DUMMY_BALANCE)
    })

    test('should return hard balance from sparkscan when configured', async () => {
      sparkWallet.getSparkAddress = jest.fn().mockResolvedValue(ACCOUNT.address)
      sparkWallet.getBalance = jest.fn().mockResolvedValue({
        satsBalance: { owned: 111n }
      })
      account._sparkscan = {
        getAddressInfo: jest.fn().mockResolvedValue({
          balance: {
            btcSoftBalanceSats: 45_678
          }
        })
      }

      const balance = await account.getBalance()

      expect(account._sparkscan.getAddressInfo).toHaveBeenCalledWith(ACCOUNT.address)
      expect(sparkWallet.getBalance).not.toHaveBeenCalled()
      expect(balance).toBe(45_678n)
    })

    test('should throw if sparkscan does not support the configured network', () => {
      expect(() => new WalletAccountSpark(sparkWallet, { network: 'TESTNET', sparkscan: {} })) // eslint-disable-line no-new
        .toThrow(ValueError)
      expect(() => new WalletAccountSpark(sparkWallet, { network: 'TESTNET', sparkscan: {} })) // eslint-disable-line no-new
        .toThrow('SparkScan does not support network: TESTNET')
    })

    test('should throw if sparkscan responds with an error status', async () => {
      const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => 'upstream is down'
      })

      sparkWallet.getSparkAddress = jest.fn().mockResolvedValue(ACCOUNT.address)

      const accountWithSparkScan = new WalletAccountSpark(sparkWallet, {
        network: 'MAINNET',
        sparkscan: { baseUrl: 'https://api.sparkscan.local' }
      })

      const promise = accountWithSparkScan.getBalance()

      await expect(promise).rejects.toThrow(ProviderError)
      await expect(promise).rejects.toThrow('Sparkscan request failed: 503 Service Unavailable - upstream is down')
      await expect(promise).rejects.toMatchObject({ reason: ProviderErrorReason.INTERNAL_SERVER_ERROR })

      fetchMock.mockRestore()
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

  describe('signTransaction', () => {
    test('should throw an unsupported operation error', async () => {
      const tx = {
        to: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
        value: 100
      }

      const promise = account.signTransaction(tx)

      await expect(promise).rejects.toThrow(UnsupportedOperationError)
      await expect(promise).rejects.toThrow("Method 'signTransaction(tx)' is not supported.")
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

    const DUMMY_RECEIVER_IDENTITY_PUBLIC_KEY = '033674c2986b02f95a687841a4d24c22dc2e0363ae631bf7948671ac86f99e197b'

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

    test('should not retry a failed send when syncAndRetry is off', async () => {
      sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))

      await expect(account.sendTransaction(DUMMY_TRANSACTION)).rejects.toThrow('timeout')

      expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
      expect(sparkWallet.transfer).toHaveBeenCalledWith({
        receiverSparkAddress: DUMMY_TRANSACTION.to,
        amountSats: DUMMY_TRANSACTION.value
      })
    })

    describe('with syncAndRetry', () => {
      const TRANSFER_PARAMS = {
        receiverSparkAddress: DUMMY_TRANSACTION.to,
        amountSats: DUMMY_TRANSACTION.value
      }

      const EMPTY_PAGE = {
        transfers: [],
        offset: 0
      }

      const DUMMY_OUTGOING_TRANSFER = {
        id: 'existing-outgoing-1',
        transferDirection: 'OUTGOING',
        totalValue: DUMMY_TRANSACTION.value,
        receiverIdentityPublicKey: DUMMY_RECEIVER_IDENTITY_PUBLIC_KEY
      }

      const OTHER_RECIPIENT_OUTGOING = {
        id: 'other-recipient-outgoing-1',
        transferDirection: 'OUTGOING',
        totalValue: DUMMY_TRANSACTION.value,
        receiverIdentityPublicKey: '02eda86793ac263f053b14e6ea92e7c2050951ab13ada0f1405919734fe45bdc15'
      }

      let retryAccount

      beforeEach(() => {
        retryAccount = new WalletAccountSpark(sparkWallet, {
          network: 'MAINNET',
          syncAndRetry: true
        })

        sparkWallet.experimental_syncWallet = jest.fn().mockResolvedValue(undefined)
        sparkWallet.isOptimizationInProgress = jest.fn().mockResolvedValue(false)
        sparkWallet.getTransfers = jest.fn().mockResolvedValue(EMPTY_PAGE)
      })

      test('should send once and return the same shape when the first transfer succeeds', async () => {
        sparkWallet.transfer = jest.fn().mockResolvedValue(DUMMY_WALLET_TRANSFER)

        const { hash, fee } = await retryAccount.sendTransaction(DUMMY_TRANSACTION)

        expect(sparkWallet.getTransfers).toHaveBeenCalledTimes(1)
        expect(sparkWallet.getTransfers).toHaveBeenCalledWith(20, 0)
        expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledWith(TRANSFER_PARAMS)
        expect(sparkWallet.experimental_syncWallet).not.toHaveBeenCalled()
        expect(sparkWallet.isOptimizationInProgress).not.toHaveBeenCalled()
        expect({ hash, fee }).toEqual({ hash: DUMMY_WALLET_TRANSFER.id, fee: 0n })
      })

      test('bug: should decode the recipient using the Spark wallet network when WDK config omits network', async () => {
        const getNetworkType = jest.spyOn(sparkWallet.config, 'getNetworkType')
          .mockReturnValue('REGTEST')
        try {
          const to = encodeSparkAddress({
            identityPublicKey: DUMMY_RECEIVER_IDENTITY_PUBLIC_KEY,
            network: 'REGTEST'
          })
          const retryWithoutNetwork = new WalletAccountSpark(sparkWallet, {
            syncAndRetry: true
          })
          sparkWallet.transfer = jest.fn().mockResolvedValue(DUMMY_WALLET_TRANSFER)

          const { hash, fee } = await retryWithoutNetwork.sendTransaction({
            to,
            value: DUMMY_TRANSACTION.value
          })

          expect(sparkWallet.getTransfers).toHaveBeenCalledTimes(1)
          expect(sparkWallet.getTransfers).toHaveBeenCalledWith(20, 0)
          expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
          expect(sparkWallet.transfer).toHaveBeenCalledWith({
            receiverSparkAddress: to,
            amountSats: DUMMY_TRANSACTION.value
          })
          expect({ hash, fee }).toEqual({ hash: DUMMY_WALLET_TRANSFER.id, fee: 0n })
        } finally {
          getNetworkType.mockRestore()
        }
      })

      test('should return a newly appeared outgoing instead of sending again after a timeout', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn()
          .mockResolvedValueOnce(EMPTY_PAGE)
          .mockResolvedValueOnce({
            transfers: [DUMMY_OUTGOING_TRANSFER],
            offset: 0
          })

        const { hash, fee } = await retryAccount.sendTransaction(DUMMY_TRANSACTION)

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledWith(TRANSFER_PARAMS)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(1, 20, 0)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(2, 20, 0)
        expect(hash).toBe(DUMMY_OUTGOING_TRANSFER.id)
        expect(fee).toBe(0n)
      })

      test('should rethrow when a timeout has no matching outgoing transfer', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))

        await expect(retryAccount.sendTransaction(DUMMY_TRANSACTION)).rejects.toThrow('timeout')

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledWith(TRANSFER_PARAMS)
        expect(sparkWallet.getTransfers).toHaveBeenCalledTimes(2)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(1, 20, 0)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(2, 20, 0)
      })

      test('should rethrow the original send error when transfer lookup fails', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn()
          .mockResolvedValueOnce(EMPTY_PAGE)
          .mockRejectedValueOnce(new SparkRequestError('history unavailable'))

        await expect(retryAccount.sendTransaction(DUMMY_TRANSACTION)).rejects.toThrow('timeout')

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledWith(TRANSFER_PARAMS)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(1, 20, 0)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(2, 20, 0)
      })

      test('should not send when the outgoing snapshot fails', async () => {
        sparkWallet.transfer = jest.fn().mockResolvedValue(DUMMY_WALLET_TRANSFER)
        sparkWallet.getTransfers = jest.fn().mockRejectedValue(new Error('history unavailable'))

        await expect(retryAccount.sendTransaction(DUMMY_TRANSACTION)).rejects.toThrow('history unavailable')

        expect(sparkWallet.getTransfers).toHaveBeenCalledWith(20, 0)
        expect(sparkWallet.transfer).toHaveBeenCalledTimes(0)
        expect(sparkWallet.experimental_syncWallet).not.toHaveBeenCalled()
      })

      test('bug: should not treat a same-amount outgoing to a different recipient as the failed send', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn().mockResolvedValue({
          transfers: [OTHER_RECIPIENT_OUTGOING],
          offset: 0
        })

        await expect(retryAccount.sendTransaction(DUMMY_TRANSACTION)).rejects.toThrow('timeout')

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledWith(TRANSFER_PARAMS)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(1, 20, 0)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(2, 20, 0)
      })

      test('bug: should not treat an earlier identical outgoing as this send', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('insufficient balance'))
        sparkWallet.getTransfers = jest.fn().mockResolvedValue({
          transfers: [DUMMY_OUTGOING_TRANSFER],
          offset: 0
        })

        await expect(retryAccount.sendTransaction(DUMMY_TRANSACTION)).rejects.toThrow('insufficient balance')

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledWith(TRANSFER_PARAMS)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(1, 20, 0)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(2, 20, 0)
      })

      test('bug: should not treat an expired outgoing as the failed send', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn()
          .mockResolvedValueOnce(EMPTY_PAGE)
          .mockResolvedValueOnce({
            transfers: [{
              ...DUMMY_OUTGOING_TRANSFER,
              id: 'expired-outgoing-1',
              status: 'TRANSFER_STATUS_EXPIRED'
            }],
            offset: 0
          })

        await expect(retryAccount.sendTransaction(DUMMY_TRANSACTION)).rejects.toThrow('timeout')

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledWith(TRANSFER_PARAMS)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(1, 20, 0)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(2, 20, 0)
      })

      test('bug: should not treat a returned outgoing as the failed send', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn()
          .mockResolvedValueOnce(EMPTY_PAGE)
          .mockResolvedValueOnce({
            transfers: [{
              ...DUMMY_OUTGOING_TRANSFER,
              id: 'returned-outgoing-1',
              status: 'TRANSFER_STATUS_RETURNED'
            }],
            offset: 0
          })

        await expect(retryAccount.sendTransaction(DUMMY_TRANSACTION)).rejects.toThrow('timeout')

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledWith(TRANSFER_PARAMS)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(1, 20, 0)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(2, 20, 0)
      })

      test('should treat a sender-key-tweaked outgoing as the failed send', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn()
          .mockResolvedValueOnce(EMPTY_PAGE)
          .mockResolvedValueOnce({
            transfers: [{
              ...DUMMY_OUTGOING_TRANSFER,
              status: 'TRANSFER_STATUS_SENDER_KEY_TWEAKED'
            }],
            offset: 0
          })

        const { hash, fee } = await retryAccount.sendTransaction(DUMMY_TRANSACTION)

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledWith(TRANSFER_PARAMS)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(1, 20, 0)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(2, 20, 0)
        expect(hash).toBe(DUMMY_OUTGOING_TRANSFER.id)
        expect(fee).toBe(0n)
      })

      test('should treat a sender-key-tweak-pending outgoing as the failed send', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn()
          .mockResolvedValueOnce(EMPTY_PAGE)
          .mockResolvedValueOnce({
            transfers: [{
              ...DUMMY_OUTGOING_TRANSFER,
              status: 'TRANSFER_STATUS_SENDER_KEY_TWEAK_PENDING'
            }],
            offset: 0
          })

        const { hash, fee } = await retryAccount.sendTransaction(DUMMY_TRANSACTION)

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledWith(TRANSFER_PARAMS)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(1, 20, 0)
        expect(sparkWallet.getTransfers).toHaveBeenNthCalledWith(2, 20, 0)
        expect(hash).toBe(DUMMY_OUTGOING_TRANSFER.id)
        expect(fee).toBe(0n)
      })

      test('bug: should keep looking past the first 20 transfers for a matching outgoing', async () => {
        const fillers = Array.from({ length: 20 }, (_, i) => ({
          id: `filler-incoming-${i}`,
          transferDirection: 'INCOMING',
          totalValue: DUMMY_TRANSACTION.value,
          receiverIdentityPublicKey: ACCOUNT.keyPair.publicKey
        }))

        let afterSend = false
        sparkWallet.transfer = jest.fn().mockImplementation(() => {
          afterSend = true
          return Promise.reject(new Error('timeout'))
        })
        sparkWallet.getTransfers = jest.fn().mockImplementation((limit, offset) => {
          if (offset === 0) {
            return Promise.resolve({ transfers: fillers, offset: 20 })
          }
          if (afterSend && offset === 20) {
            return Promise.resolve({
              transfers: [DUMMY_OUTGOING_TRANSFER],
              offset: 40
            })
          }
          return Promise.resolve({ transfers: [], offset })
        })

        const { hash, fee } = await retryAccount.sendTransaction(DUMMY_TRANSACTION)

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.getTransfers.mock.calls).toEqual([
          [20, 0],
          [20, 20],
          [20, 0],
          [20, 20]
        ])
        expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
        expect(sparkWallet.transfer).toHaveBeenCalledWith(TRANSFER_PARAMS)
        expect(hash).toBe(DUMMY_OUTGOING_TRANSFER.id)
        expect(fee).toBe(0n)
      })
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
    const DUMMY_OPTIONS = {
      invoice: 'lnbc1500...',
      maxFeeSats: 50
    }

    const DUMMY_LIGHTNING_SEND_REQUEST = {
      id: 'lightning-send-request-1',
      status: 'PENDING'
    }

    test('should successfully pay a lightning invoice', async () => {
      sparkWallet.payLightningInvoice = jest.fn().mockResolvedValue(DUMMY_LIGHTNING_SEND_REQUEST)

      const result = await account.payLightningInvoice(DUMMY_OPTIONS)

      expect(sparkWallet.payLightningInvoice).toHaveBeenCalledWith(DUMMY_OPTIONS)
      expect(result).toEqual(DUMMY_LIGHTNING_SEND_REQUEST)
    })

    test('should not retry a failed pay when syncAndRetry is off', async () => {
      sparkWallet.payLightningInvoice = jest.fn().mockRejectedValue(new Error('timeout'))

      await expect(account.payLightningInvoice(DUMMY_OPTIONS)).rejects.toThrow('timeout')

      expect(sparkWallet.payLightningInvoice).toHaveBeenCalledTimes(1)
      expect(sparkWallet.payLightningInvoice).toHaveBeenCalledWith(DUMMY_OPTIONS)
    })

    describe('with syncAndRetry', () => {
      let retryAccount

      beforeEach(() => {
        retryAccount = new WalletAccountSpark(sparkWallet, {
          network: 'MAINNET',
          syncAndRetry: true
        })

        sparkWallet.experimental_syncWallet = jest.fn().mockResolvedValue(undefined)
        sparkWallet.isOptimizationInProgress = jest.fn().mockResolvedValue(false)
      })

      test('should pay once when the first lightning pay succeeds', async () => {
        const transferId = generateTransferId()
        const options = { ...DUMMY_OPTIONS, transferId }
        sparkWallet.payLightningInvoice = jest.fn().mockResolvedValue(DUMMY_LIGHTNING_SEND_REQUEST)

        const result = await retryAccount.payLightningInvoice(options)

        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledTimes(1)
        expect(sparkWallet.experimental_syncWallet).not.toHaveBeenCalled()
        expect(sparkWallet.isOptimizationInProgress).not.toHaveBeenCalled()
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledWith(options)
        expect(result).toEqual(DUMMY_LIGHTNING_SEND_REQUEST)
      })

      test('should retry with the same transferId after a stale-leaf error', async () => {
        const transferId = generateTransferId()
        const options = { ...DUMMY_OPTIONS, transferId }
        sparkWallet.payLightningInvoice = jest.fn()
          .mockRejectedValueOnce(new Error('leaf is not available'))
          .mockResolvedValueOnce(DUMMY_LIGHTNING_SEND_REQUEST)

        const result = await retryAccount.payLightningInvoice(options)

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledTimes(2)
        expect(sparkWallet.payLightningInvoice).toHaveBeenNthCalledWith(1, options)
        expect(sparkWallet.payLightningInvoice).toHaveBeenNthCalledWith(2, options)
        expect(result).toEqual(DUMMY_LIGHTNING_SEND_REQUEST)
      })

      test('should generate one transferId and reuse it after a stale-leaf error', async () => {
        sparkWallet.payLightningInvoice = jest.fn()
          .mockRejectedValueOnce(new Error('leaf is not available'))
          .mockResolvedValueOnce(DUMMY_LIGHTNING_SEND_REQUEST)

        const result = await retryAccount.payLightningInvoice(DUMMY_OPTIONS)

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledTimes(2)
        const transferId = sparkWallet.payLightningInvoice.mock.calls[0][0].transferId
        const params = {
          invoice: DUMMY_OPTIONS.invoice,
          maxFeeSats: DUMMY_OPTIONS.maxFeeSats,
          transferId
        }
        expect(sparkWallet.payLightningInvoice).toHaveBeenNthCalledWith(1, params)
        expect(sparkWallet.payLightningInvoice).toHaveBeenNthCalledWith(2, params)
        expect(result).toEqual(DUMMY_LIGHTNING_SEND_REQUEST)
      })

      test('should not retry a lightning pay after a timeout', async () => {
        const transferId = generateTransferId()
        const options = { ...DUMMY_OPTIONS, transferId }
        sparkWallet.payLightningInvoice = jest.fn().mockRejectedValue(new Error('timeout'))

        const error = await retryAccount.payLightningInvoice(options).catch(err => err)

        expect(error).toBeInstanceOf(LightningPaymentError)
        expect(error.cause.message).toBe('timeout')
        expect(error.transferId).toBe(transferId)
        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledTimes(1)
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledWith(options)
      })

      test('bug: should attach a generated transferId to a timeout error', async () => {
        sparkWallet.payLightningInvoice = jest.fn().mockRejectedValue(new Error('timeout'))

        const error = await retryAccount.payLightningInvoice(DUMMY_OPTIONS).catch(err => err)
        const transferId = sparkWallet.payLightningInvoice.mock.calls[0][0].transferId
        const params = {
          invoice: DUMMY_OPTIONS.invoice,
          maxFeeSats: DUMMY_OPTIONS.maxFeeSats,
          transferId
        }

        expect(error).toBeInstanceOf(LightningPaymentError)
        expect(error.cause.message).toBe('timeout')
        expect(error.transferId).toBe(transferId)
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledTimes(1)
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledWith(params)
      })

      test('bug: should attach transferId when a stale-leaf retry also fails', async () => {
        const transferId = generateTransferId()
        const options = { ...DUMMY_OPTIONS, transferId }
        sparkWallet.payLightningInvoice = jest.fn()
          .mockRejectedValueOnce(new Error('leaf is not available'))
          .mockRejectedValueOnce(new Error('timeout'))

        const error = await retryAccount.payLightningInvoice(options).catch(err => err)

        expect(error).toBeInstanceOf(LightningPaymentError)
        expect(error.cause.message).toBe('timeout')
        expect(error.transferId).toBe(transferId)
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledTimes(2)
        expect(sparkWallet.payLightningInvoice).toHaveBeenNthCalledWith(1, options)
        expect(sparkWallet.payLightningInvoice).toHaveBeenNthCalledWith(2, options)
      })
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

      expect(sparkWallet.fulfillSparkInvoice).toHaveBeenCalledWith(DUMMY_INVOICES)
      expect(response).toEqual(DUMMY_RESPONSE)
    })
  })

  describe('toReadOnlyAccount', () => {
    test('should return a WalletAccountReadOnlySpark instance', async () => {
      const readOnlyAccount = await account.toReadOnlyAccount()

      expect(readOnlyAccount).toBeInstanceOf(WalletAccountReadOnlySpark)
    })

    test('should return a read-only account with the correct address', async () => {
      const readOnlyAccount = await account.toReadOnlyAccount()

      expect(await readOnlyAccount.getAddress()).toBe(ACCOUNT.address)
    })

    test('should return a read-only account with the correct network config', async () => {
      const readOnlyAccount = await account.toReadOnlyAccount()

      expect(readOnlyAccount._config.network).toBe('MAINNET')
    })
  })

  describe('cleanupConnections', () => {
    test('should close and clean up connections with the blockchain', async () => {
      sparkWallet.cleanup = jest.fn()

      await account.cleanupConnections()

      expect(sparkWallet.cleanup).toHaveBeenCalled()
    })
  })
})
