import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals'

import { SparkWallet, SparkError, SparkRequestError, SparkValidationError } from '@buildonspark/spark-sdk'

import { UUID } from 'uuidv7'

import * as bip39 from 'bip39'

import { MaximumFeeExceededError, ProviderError, ProviderErrorReason, UnsupportedOperationError, ValueError } from '@tetherto/wdk-wallet'

import {
  WalletAccountSpark,
  WalletAccountReadOnlySpark,
  LightningPaymentError,
  StaticDepositClaimOutcomeUnknownError,
  StaticDepositFeeExceededError
} from '../index.js'

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

      const DUMMY_RECEIVER_IDENTITY_PUBLIC_KEY = '033674c2986b02f95a687841a4d24c22dc2e0363ae631bf7948671ac86f99e197b'

      const DUMMY_REGTEST_ADDRESS = 'sparkrt1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm5u4lkv'

      const DUMMY_EMPTY_PAGE = {
        transfers: [],
        offset: 0
      }

      const DUMMY_OUTGOING_TRANSFER = {
        id: 'existing-outgoing-1',
        transferDirection: 'OUTGOING',
        totalValue: DUMMY_TRANSACTION.value,
        receiverIdentityPublicKey: DUMMY_RECEIVER_IDENTITY_PUBLIC_KEY,
        status: 'TRANSFER_STATUS_SENDER_KEY_TWEAKED'
      }

      const DUMMY_OTHER_RECIPIENT_OUTGOING = {
        id: 'other-recipient-outgoing-1',
        transferDirection: 'OUTGOING',
        totalValue: DUMMY_TRANSACTION.value,
        receiverIdentityPublicKey: '02d1c6f04d52a2c7b4c8e3f0a9b8d7c6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9',
        status: 'TRANSFER_STATUS_SENDER_KEY_TWEAKED'
      }

      let retryAccount

      beforeEach(() => {
        retryAccount = new WalletAccountSpark(sparkWallet, {
          network: 'MAINNET',
          syncAndRetry: true
        })

        sparkWallet.experimental_syncWallet = jest.fn().mockResolvedValue(undefined)
        sparkWallet.isOptimizationInProgress = jest.fn().mockResolvedValue(false)
        sparkWallet.getTransfers = jest.fn().mockResolvedValue(DUMMY_EMPTY_PAGE)
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
        expect(hash).toBe(DUMMY_WALLET_TRANSFER.id)
        expect(fee).toBe(0n)
      })

      test('should decode the recipient using the Spark wallet network when WDK config omits network', async () => {
        const getNetworkType = jest.spyOn(sparkWallet.config, 'getNetworkType')
          .mockReturnValue('REGTEST')
        try {
          const retryWithoutNetwork = new WalletAccountSpark(sparkWallet, {
            syncAndRetry: true
          })
          sparkWallet.transfer = jest.fn().mockResolvedValue(DUMMY_WALLET_TRANSFER)

          const { hash, fee } = await retryWithoutNetwork.sendTransaction({
            to: DUMMY_REGTEST_ADDRESS,
            value: DUMMY_TRANSACTION.value
          })

          expect(sparkWallet.getTransfers).toHaveBeenCalledTimes(1)
          expect(sparkWallet.getTransfers).toHaveBeenCalledWith(20, 0)
          expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
          expect(sparkWallet.transfer).toHaveBeenCalledWith({
            receiverSparkAddress: DUMMY_REGTEST_ADDRESS,
            amountSats: DUMMY_TRANSACTION.value
          })
          expect(hash).toBe(DUMMY_WALLET_TRANSFER.id)
        expect(fee).toBe(0n)
        } finally {
          getNetworkType.mockRestore()
        }
      })

      test('should return a newly appeared outgoing instead of sending again after a timeout', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn()
          .mockResolvedValueOnce(DUMMY_EMPTY_PAGE)
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
          .mockResolvedValueOnce(DUMMY_EMPTY_PAGE)
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

      test('should not treat a same-amount outgoing to a different recipient as the failed send', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn().mockResolvedValue({
          transfers: [DUMMY_OTHER_RECIPIENT_OUTGOING],
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

      test('should not treat an earlier identical outgoing as this send', async () => {
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

      test('should not treat an expired outgoing as the failed send', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn()
          .mockResolvedValueOnce(DUMMY_EMPTY_PAGE)
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

      test('should not treat a returned outgoing as the failed send', async () => {
        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn()
          .mockResolvedValueOnce(DUMMY_EMPTY_PAGE)
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
          .mockResolvedValueOnce(DUMMY_EMPTY_PAGE)
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
          .mockResolvedValueOnce(DUMMY_EMPTY_PAGE)
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

      test('should keep looking past the first 20 transfers for a matching outgoing', async () => {
        const DUMMY_FILLER_TRANSFERS = Array.from({ length: 20 }, (_, i) => ({
          id: `filler-incoming-${i}`,
          transferDirection: 'INCOMING',
          totalValue: DUMMY_TRANSACTION.value,
          receiverIdentityPublicKey: ACCOUNT.keyPair.publicKey,
          status: 'TRANSFER_STATUS_COMPLETED'
        }))

        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn()
          .mockResolvedValueOnce({ transfers: DUMMY_FILLER_TRANSFERS, offset: 20 })
          .mockResolvedValueOnce({ transfers: [], offset: 40 })
          .mockResolvedValueOnce({ transfers: DUMMY_FILLER_TRANSFERS, offset: 20 })
          .mockResolvedValueOnce({ transfers: [DUMMY_OUTGOING_TRANSFER], offset: 40 })

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

      test('should stop paging transfer history after the page cap', async () => {
        const DUMMY_UNRELATED_PAGE = {
          transfers: Array.from({ length: 20 }, (_, i) => ({
            id: `unrelated-incoming-${i}`,
            transferDirection: 'INCOMING',
            totalValue: DUMMY_TRANSACTION.value,
            receiverIdentityPublicKey: ACCOUNT.keyPair.publicKey,
            status: 'TRANSFER_STATUS_COMPLETED'
          })),
          offset: 0
        }

        sparkWallet.transfer = jest.fn().mockRejectedValue(new Error('timeout'))
        sparkWallet.getTransfers = jest.fn().mockResolvedValue(DUMMY_UNRELATED_PAGE)

        await expect(retryAccount.sendTransaction(DUMMY_TRANSACTION)).rejects.toThrow('timeout')

        expect(sparkWallet.transfer).toHaveBeenCalledTimes(1)
        expect(sparkWallet.getTransfers.mock.calls).toEqual([
          [20, 0],
          [20, 20],
          [20, 40],
          [20, 60],
          [20, 80],
          [20, 0],
          [20, 20],
          [20, 40],
          [20, 60],
          [20, 80]
        ])
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

  describe('getClaimStaticDepositQuote', () => {
    const QUOTE = {
      transactionId: 'dummy-transaction-id',
      outputIndex: 1,
      creditAmountSats: 9_750,
      signature: 'dummy-signature'
    }

    test('should calculate the claim fee from the caller-provided deposit amount', async () => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue(QUOTE)

      const result = await account.getClaimStaticDepositQuote({
        txId: 'dummy-transaction-id',
        depositAmountSats: 10_000
      })

      expect(sparkWallet.getClaimStaticDepositQuote).toHaveBeenCalledWith('dummy-transaction-id', undefined)
      expect(result).toEqual({
        transactionId: 'dummy-transaction-id',
        outputIndex: 1,
        depositAmountSats: 10_000,
        creditAmountSats: 9_750,
        claimFeeSats: 250
      })
    })

    test('should pass the output index to the Spark SDK', async () => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue(QUOTE)

      await account.getClaimStaticDepositQuote({
        txId: 'dummy-transaction-id',
        outputIndex: 1,
        depositAmountSats: 10_000
      })

      expect(sparkWallet.getClaimStaticDepositQuote).toHaveBeenCalledWith('dummy-transaction-id', 1)
    })

    test.each([
      [{ txId: '', depositAmountSats: 10_000 }, 'transaction ID'],
      [{ txId: 'dummy-transaction-id', depositAmountSats: 0 }, 'deposit amount'],
      [{ txId: 'dummy-transaction-id', depositAmountSats: -1 }, 'deposit amount'],
      [{ txId: 'dummy-transaction-id', depositAmountSats: 1.5 }, 'deposit amount'],
      [{ txId: 'dummy-transaction-id', depositAmountSats: Number.MAX_SAFE_INTEGER + 1 }, 'deposit amount'],
      [{ txId: 'dummy-transaction-id', depositAmountSats: 10_000, outputIndex: -1 }, 'output index'],
      [{ txId: 'dummy-transaction-id', depositAmountSats: 10_000, outputIndex: 1.5 }, 'output index']
    ])('should reject invalid quote options %#', async (options, message) => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn()

      await expect(account.getClaimStaticDepositQuote(options)).rejects.toThrow(ValueError)
      await expect(account.getClaimStaticDepositQuote(options)).rejects.toThrow(message)

      expect(sparkWallet.getClaimStaticDepositQuote).not.toHaveBeenCalled()
    })

    test.each([
      [{ ...QUOTE, transactionId: 'different-transaction-id' }, 'transaction ID'],
      [{ ...QUOTE, outputIndex: -1 }, 'output index'],
      [{ ...QUOTE, creditAmountSats: 0 }, 'credit'],
      [{ ...QUOTE, creditAmountSats: 10_001 }, 'lower than the SSP quoted credit']
    ])('should reject an inconsistent quote %#', async (quote, message) => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue(quote)

      const promise = account.getClaimStaticDepositQuote({
        txId: 'dummy-transaction-id',
        depositAmountSats: 10_000
      })

      await expect(promise).rejects.toThrow(ValueError)
      await expect(promise).rejects.toThrow(message)
    })

    test('should reject a quote for a different requested output', async () => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue(QUOTE)

      await expect(account.getClaimStaticDepositQuote({
        txId: 'dummy-transaction-id',
        outputIndex: 2,
        depositAmountSats: 10_000
      })).rejects.toThrow('The SSP quote output index does not match')
    })
  })

  describe('claimStaticDeposit', () => {
    test('should successfully claim a static deposit', async () => {
      const DUMMY_CLAIM_STATIC_DEPOSIT_QUOTE = {
        signature: 'dummy-signature',
        creditAmountSats: 1_000
      }

      const DUMMY_CLAIM_RESULT = {
        transferId: 'spark-transfer-id'
      }

      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue(DUMMY_CLAIM_STATIC_DEPOSIT_QUOTE)

      sparkWallet.claimStaticDeposit = jest.fn().mockResolvedValue(DUMMY_CLAIM_RESULT)

      const result = await account.claimStaticDeposit('dummy-transaction-id')

      expect(sparkWallet.getClaimStaticDepositQuote).toHaveBeenCalledWith('dummy-transaction-id')

      expect(sparkWallet.claimStaticDeposit).toHaveBeenCalledWith({
        transactionId: 'dummy-transaction-id',
        creditAmountSats: 1_000,
        sspSignature: 'dummy-signature'
      })

      expect(result).toEqual(DUMMY_CLAIM_RESULT)
    })

    test('should preserve a Spark SDK claim failure', async () => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue({
        signature: 'dummy-signature',
        creditAmountSats: 1_000
      })

      const error = new SparkRequestError('Claim request failed')
      sparkWallet.claimStaticDeposit = jest.fn().mockRejectedValue(error)

      await expect(account.claimStaticDeposit('dummy-transaction-id')).rejects.toBe(error)
    })

    test.each([
      null,
      undefined,
      {},
      { transferId: '' },
      { transferId: '   ' },
      { transferId: 123 }
    ])('should reject malformed claim result %#', async (claimResult) => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue({
        signature: 'dummy-signature',
        creditAmountSats: 1_000
      })

      sparkWallet.claimStaticDeposit = jest.fn().mockResolvedValue(claimResult)

      const promise = account.claimStaticDeposit('dummy-transaction-id')

      await expect(promise).rejects.toThrow(SparkError)
      await expect(promise).rejects.toThrow('The SSP returned an invalid static deposit claim result')
    })

    test('should refuse a quote that credits nothing', async () => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue({
        signature: 'dummy-signature',
        creditAmountSats: 0
      })

      sparkWallet.claimStaticDeposit = jest.fn()

      const promise = account.claimStaticDeposit('dummy-transaction-id')

      await expect(promise).rejects.toThrow(ValueError)
      await expect(promise).rejects.toThrow('The SSP quoted a credit that is not a safe positive integer number of satoshis.')

      expect(sparkWallet.claimStaticDeposit).not.toHaveBeenCalled()
    })

    test('should refuse a quote that credits a negative amount', async () => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue({
        signature: 'dummy-signature',
        creditAmountSats: -1
      })

      sparkWallet.claimStaticDeposit = jest.fn()

      await expect(account.claimStaticDeposit('dummy-transaction-id')).rejects.toThrow(ValueError)

      expect(sparkWallet.claimStaticDeposit).not.toHaveBeenCalled()
    })

    test('should refuse a quote that credits a fractional amount', async () => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue({
        signature: 'dummy-signature',
        creditAmountSats: 1_000.5
      })

      sparkWallet.claimStaticDeposit = jest.fn()

      await expect(account.claimStaticDeposit('dummy-transaction-id')).rejects.toThrow(ValueError)

      expect(sparkWallet.claimStaticDeposit).not.toHaveBeenCalled()
    })

    test('should refuse a quote that credits more than a safe integer', async () => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue({
        signature: 'dummy-signature',
        creditAmountSats: Number.MAX_SAFE_INTEGER + 1
      })

      sparkWallet.claimStaticDeposit = jest.fn()

      await expect(account.claimStaticDeposit('dummy-transaction-id')).rejects.toThrow(ValueError)

      expect(sparkWallet.claimStaticDeposit).not.toHaveBeenCalled()
    })

    test('should refuse a quote whose credit is a string', async () => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue({
        signature: 'dummy-signature',
        creditAmountSats: '1000'
      })

      sparkWallet.claimStaticDeposit = jest.fn()

      await expect(account.claimStaticDeposit('dummy-transaction-id')).rejects.toThrow(ValueError)

      expect(sparkWallet.claimStaticDeposit).not.toHaveBeenCalled()
    })

    test('should refuse a quote that carries no credit amount', async () => {
      sparkWallet.getClaimStaticDepositQuote = jest.fn().mockResolvedValue({
        signature: 'dummy-signature'
      })

      sparkWallet.claimStaticDeposit = jest.fn()

      await expect(account.claimStaticDeposit('dummy-transaction-id')).rejects.toThrow(ValueError)

      expect(sparkWallet.claimStaticDeposit).not.toHaveBeenCalled()
    })
  })

  describe('claimStaticDepositWithMaxFee', () => {
    const CLAIM_RESULT = {
      transferId: 'spark-transfer-id'
    }

    test('should delegate the atomic maximum-fee claim to the Spark SDK', async () => {
      sparkWallet.claimStaticDepositWithMaxFee = jest.fn().mockResolvedValue(CLAIM_RESULT)

      const result = await account.claimStaticDepositWithMaxFee({
        txId: 'dummy-transaction-id',
        outputIndex: 1,
        maxFeeSats: 250
      })

      expect(sparkWallet.claimStaticDepositWithMaxFee).toHaveBeenCalledWith({
        transactionId: 'dummy-transaction-id',
        outputIndex: 1,
        maxFee: 250
      })
      expect(result).toEqual(CLAIM_RESULT)
    })

    test('should allow a zero maximum fee and omit an unspecified output index', async () => {
      sparkWallet.claimStaticDepositWithMaxFee = jest.fn().mockResolvedValue(CLAIM_RESULT)

      await account.claimStaticDepositWithMaxFee({
        txId: 'dummy-transaction-id',
        maxFeeSats: 0
      })

      expect(sparkWallet.claimStaticDepositWithMaxFee).toHaveBeenCalledWith({
        transactionId: 'dummy-transaction-id',
        maxFee: 0
      })
    })

    test('should expose an exact fee rejection as a stable typed error', async () => {
      const sdkError = new SparkValidationError('Fee larger than max fee', {
        field: 'feeCharged',
        value: 251
      })
      sparkWallet.claimStaticDepositWithMaxFee = jest.fn().mockRejectedValue(sdkError)

      const promise = account.claimStaticDepositWithMaxFee({
        txId: 'dummy-transaction-id',
        outputIndex: 1,
        maxFeeSats: 250
      })

      await expect(promise).rejects.toThrow(StaticDepositFeeExceededError)
      await expect(promise).rejects.toMatchObject({
        code: 'STATIC_DEPOSIT_FEE_EXCEEDED',
        claimFeeSats: 251,
        maxFeeSats: 250,
        cause: sdkError
      })
    })

    test('should preserve an ambiguous SDK failure as an unknown claim outcome', async () => {
      const sdkError = new SparkRequestError('Claim request failed')
      sparkWallet.claimStaticDepositWithMaxFee = jest.fn().mockRejectedValue(sdkError)

      const promise = account.claimStaticDepositWithMaxFee({
        txId: 'dummy-transaction-id',
        outputIndex: 1,
        maxFeeSats: 250
      })

      await expect(promise).rejects.toThrow(StaticDepositClaimOutcomeUnknownError)
      await expect(promise).rejects.toMatchObject({
        code: 'STATIC_DEPOSIT_CLAIM_OUTCOME_UNKNOWN',
        transactionId: 'dummy-transaction-id',
        outputIndex: 1,
        cause: sdkError
      })
    })

    test.each([
      null,
      undefined,
      {},
      { transferId: '' },
      { transferId: 123 }
    ])('should treat a malformed bounded claim result as an unknown outcome %#', async (claimResult) => {
      sparkWallet.claimStaticDepositWithMaxFee = jest.fn().mockResolvedValue(claimResult)

      await expect(account.claimStaticDepositWithMaxFee({
        txId: 'dummy-transaction-id',
        maxFeeSats: 250
      })).rejects.toThrow(StaticDepositClaimOutcomeUnknownError)
    })

    test.each([
      [{ txId: '', maxFeeSats: 250 }, 'transaction ID'],
      [{ txId: 'dummy-transaction-id', maxFeeSats: -1 }, 'maximum'],
      [{ txId: 'dummy-transaction-id', maxFeeSats: 1.5 }, 'maximum'],
      [{ txId: 'dummy-transaction-id', maxFeeSats: Number.MAX_SAFE_INTEGER + 1 }, 'maximum'],
      [{ txId: 'dummy-transaction-id', maxFeeSats: 250, outputIndex: -1 }, 'output index'],
      [{ txId: 'dummy-transaction-id', maxFeeSats: 250, outputIndex: 1.5 }, 'output index']
    ])('should reject invalid bounded claim options %#', async (options, message) => {
      sparkWallet.claimStaticDepositWithMaxFee = jest.fn()

      await expect(account.claimStaticDepositWithMaxFee(options)).rejects.toThrow(ValueError)
      await expect(account.claimStaticDepositWithMaxFee(options)).rejects.toThrow(message)

      expect(sparkWallet.claimStaticDepositWithMaxFee).not.toHaveBeenCalled()
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

    describe('with a withdraw max fee', () => {
      const OPTIONS = {
        onchainAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        amountSats: 100_000
      }

      const DUMMY_FEE_QUOTE = {
        id: 'dummy-fee-quote-id',
        l1BroadcastFeeFast: { originalValue: 3_000, originalUnit: 'SATOSHI' },
        userFeeFast: { originalValue: 200, originalUnit: 'SATOSHI' },
        l1BroadcastFeeMedium: { originalValue: 2_000, originalUnit: 'SATOSHI' },
        userFeeMedium: { originalValue: 100, originalUnit: 'SATOSHI' },
        l1BroadcastFeeSlow: { originalValue: 1_000, originalUnit: 'SATOSHI' },
        userFeeSlow: { originalValue: 50, originalUnit: 'SATOSHI' }
      }

      const DUMMY_COOP_EXIT_REQUEST = {
        id: 'dummy-coop-exit-request-id'
      }

      beforeEach(() => {
        sparkWallet.getWithdrawalFeeQuote = jest.fn().mockResolvedValue(DUMMY_FEE_QUOTE)
        sparkWallet.withdraw = jest.fn().mockResolvedValue(DUMMY_COOP_EXIT_REQUEST)
      })

      test('should withdraw if the quoted fee equals the withdraw max fee', async () => {
        const account = new WalletAccountSpark(sparkWallet, { network: 'MAINNET', withdrawMaxFee: 2_100 })

        const coopExitRequest = await account.withdraw({ ...OPTIONS })

        expect(sparkWallet.getWithdrawalFeeQuote).toHaveBeenCalledWith({
          withdrawalAddress: OPTIONS.onchainAddress,
          amountSats: OPTIONS.amountSats
        })

        expect(sparkWallet.withdraw).toHaveBeenCalledWith({
          ...OPTIONS,
          exitSpeed: 'MEDIUM',
          feeQuote: DUMMY_FEE_QUOTE
        })

        expect(coopExitRequest).toEqual(DUMMY_COOP_EXIT_REQUEST)
      })

      test('should throw if the quoted fee exceeds the withdraw max fee', async () => {
        const account = new WalletAccountSpark(sparkWallet, { network: 'MAINNET', withdrawMaxFee: 2_099 })

        const promise = account.withdraw({ ...OPTIONS })

        await expect(promise).rejects.toThrow(MaximumFeeExceededError)
        await expect(promise).rejects.toThrow('Exceeded maximum fee cost for withdraw operation.')

        expect(sparkWallet.getWithdrawalFeeQuote).toHaveBeenCalledWith({
          withdrawalAddress: OPTIONS.onchainAddress,
          amountSats: OPTIONS.amountSats
        })

        expect(sparkWallet.withdraw).not.toHaveBeenCalled()
      })

      test('should throw if the quoted fee for the given exit speed exceeds the withdraw max fee', async () => {
        const account = new WalletAccountSpark(sparkWallet, { network: 'MAINNET', withdrawMaxFee: 3_199 })

        const promise = account.withdraw({ ...OPTIONS, exitSpeed: 'FAST' })

        await expect(promise).rejects.toThrow(MaximumFeeExceededError)
        await expect(promise).rejects.toThrow('Exceeded maximum fee cost for withdraw operation.')

        expect(sparkWallet.getWithdrawalFeeQuote).toHaveBeenCalledWith({
          withdrawalAddress: OPTIONS.onchainAddress,
          amountSats: OPTIONS.amountSats
        })

        expect(sparkWallet.withdraw).not.toHaveBeenCalled()
      })

      test('should throw if the quoted fee exceeds a bigint withdraw max fee', async () => {
        const account = new WalletAccountSpark(sparkWallet, { network: 'MAINNET', withdrawMaxFee: 2_099n })

        const promise = account.withdraw({ ...OPTIONS })

        await expect(promise).rejects.toThrow(MaximumFeeExceededError)
        await expect(promise).rejects.toThrow('Exceeded maximum fee cost for withdraw operation.')

        expect(sparkWallet.getWithdrawalFeeQuote).toHaveBeenCalledWith({
          withdrawalAddress: OPTIONS.onchainAddress,
          amountSats: OPTIONS.amountSats
        })

        expect(sparkWallet.withdraw).not.toHaveBeenCalled()
      })

      test('should throw on any fee if the withdraw max fee is zero', async () => {
        const account = new WalletAccountSpark(sparkWallet, { network: 'MAINNET', withdrawMaxFee: 0 })

        const promise = account.withdraw({ ...OPTIONS })

        await expect(promise).rejects.toThrow(MaximumFeeExceededError)
        await expect(promise).rejects.toThrow('Exceeded maximum fee cost for withdraw operation.')

        expect(sparkWallet.getWithdrawalFeeQuote).toHaveBeenCalledWith({
          withdrawalAddress: OPTIONS.onchainAddress,
          amountSats: OPTIONS.amountSats
        })

        expect(sparkWallet.withdraw).not.toHaveBeenCalled()
      })

      test('should pass a null fee quote through to the sdk', async () => {
        sparkWallet.getWithdrawalFeeQuote = jest.fn().mockResolvedValue(null)

        const account = new WalletAccountSpark(sparkWallet, { network: 'MAINNET', withdrawMaxFee: 2_100 })

        const coopExitRequest = await account.withdraw({ ...OPTIONS })

        expect(sparkWallet.withdraw).toHaveBeenCalledWith({
          ...OPTIONS,
          exitSpeed: 'MEDIUM',
          feeQuote: null
        })

        expect(coopExitRequest).toEqual(DUMMY_COOP_EXIT_REQUEST)
      })

      test('should count a missing fee in the fee quote as zero', async () => {
        const { userFeeMedium, ...feeQuote } = DUMMY_FEE_QUOTE

        sparkWallet.getWithdrawalFeeQuote = jest.fn().mockResolvedValue(feeQuote)

        const account = new WalletAccountSpark(sparkWallet, { network: 'MAINNET', withdrawMaxFee: 2_000 })

        const coopExitRequest = await account.withdraw({ ...OPTIONS })

        expect(sparkWallet.withdraw).toHaveBeenCalledWith({
          ...OPTIONS,
          exitSpeed: 'MEDIUM',
          feeQuote
        })

        expect(coopExitRequest).toEqual(DUMMY_COOP_EXIT_REQUEST)
      })

      test('should throw if the exit speed is not supported', async () => {
        const account = new WalletAccountSpark(sparkWallet, { network: 'MAINNET', withdrawMaxFee: 2_100 })

        const promise = account.withdraw({ ...OPTIONS, exitSpeed: 'FUTURE_VALUE' })

        await expect(promise).rejects.toThrow(ValueError)
        await expect(promise).rejects.toThrow('Invalid exit speed.')

        expect(sparkWallet.getWithdrawalFeeQuote).toHaveBeenCalledWith({
          withdrawalAddress: OPTIONS.onchainAddress,
          amountSats: OPTIONS.amountSats
        })

        expect(sparkWallet.withdraw).not.toHaveBeenCalled()
      })
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
      const TRANSFER_ID = UUID.parse('01890a5d-ac96-774b-bcce-b302099a8057')

      const OPTIONS = { ...DUMMY_OPTIONS, transferId: TRANSFER_ID }

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
        sparkWallet.payLightningInvoice = jest.fn().mockResolvedValue(DUMMY_LIGHTNING_SEND_REQUEST)

        const result = await retryAccount.payLightningInvoice(OPTIONS)

        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledTimes(1)
        expect(sparkWallet.experimental_syncWallet).not.toHaveBeenCalled()
        expect(sparkWallet.isOptimizationInProgress).not.toHaveBeenCalled()
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledWith(OPTIONS)
        expect(result).toEqual(DUMMY_LIGHTNING_SEND_REQUEST)
      })

      test('should retry with the same transferId after a stale-leaf error', async () => {
        sparkWallet.payLightningInvoice = jest.fn()
          .mockRejectedValueOnce(new Error('leaf is not available'))
          .mockResolvedValueOnce(DUMMY_LIGHTNING_SEND_REQUEST)

        const result = await retryAccount.payLightningInvoice(OPTIONS)

        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledTimes(2)
        expect(sparkWallet.payLightningInvoice).toHaveBeenNthCalledWith(1, OPTIONS)
        expect(sparkWallet.payLightningInvoice).toHaveBeenNthCalledWith(2, OPTIONS)
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
        const [[firstParams], [secondParams]] = sparkWallet.payLightningInvoice.mock.calls
        expect(firstParams).toEqual({ ...DUMMY_OPTIONS, transferId: expect.any(UUID) })
        expect(secondParams.transferId).toBe(firstParams.transferId)
        expect(result).toEqual(DUMMY_LIGHTNING_SEND_REQUEST)
      })

      test('should not retry a lightning pay after a timeout', async () => {
        sparkWallet.payLightningInvoice = jest.fn().mockRejectedValue(new Error('timeout'))

        const promise = retryAccount.payLightningInvoice(OPTIONS)

        await expect(promise).rejects.toThrow(LightningPaymentError)
        await expect(promise).rejects.toMatchObject({ transferId: TRANSFER_ID })
        await expect(promise).rejects.toHaveProperty('cause.message', 'timeout')
        expect(sparkWallet.experimental_syncWallet).toHaveBeenCalledTimes(1)
        expect(sparkWallet.isOptimizationInProgress).toHaveBeenCalledTimes(1)
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledTimes(1)
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledWith(OPTIONS)
      })

      test('should attach the generated transferId to a failed payment', async () => {
        sparkWallet.payLightningInvoice = jest.fn().mockRejectedValue(new Error('timeout'))

        const promise = retryAccount.payLightningInvoice(DUMMY_OPTIONS)

        await expect(promise).rejects.toThrow(LightningPaymentError)
        await expect(promise).rejects.toHaveProperty('cause.message', 'timeout')
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledTimes(1)
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledWith({ ...DUMMY_OPTIONS, transferId: expect.any(UUID) })

        const [[params]] = sparkWallet.payLightningInvoice.mock.calls
        await expect(promise).rejects.toMatchObject({ transferId: params.transferId })
      })

      test('should attach the transferId when a stale-leaf retry also fails', async () => {
        sparkWallet.payLightningInvoice = jest.fn()
          .mockRejectedValueOnce(new Error('leaf is not available'))
          .mockRejectedValueOnce(new Error('timeout'))

        const promise = retryAccount.payLightningInvoice(OPTIONS)

        await expect(promise).rejects.toThrow(LightningPaymentError)
        await expect(promise).rejects.toMatchObject({ transferId: TRANSFER_ID })
        await expect(promise).rejects.toHaveProperty('cause.message', 'timeout')
        expect(sparkWallet.payLightningInvoice).toHaveBeenCalledTimes(2)
        expect(sparkWallet.payLightningInvoice).toHaveBeenNthCalledWith(1, OPTIONS)
        expect(sparkWallet.payLightningInvoice).toHaveBeenNthCalledWith(2, OPTIONS)
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
