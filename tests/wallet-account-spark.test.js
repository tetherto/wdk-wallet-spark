import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals'

import { SparkWallet } from '@buildonspark/spark-sdk'

import * as bip39 from 'bip39'

import { WalletAccountSpark } from '../index.js'

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
      to: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
      tokenAddress: 'btkn1qxk5cq74ldm',
      value: 1000n
    }

    const DUMMY_TX_ID = 'dummy-token-transfer-1'

    test('should successfully transfer tokens', async () => {
      sparkWallet.transferTokens = jest.fn().mockResolvedValue(DUMMY_TX_ID)

      const { hash, fee } = await account.transfer(DUMMY_TRANSFER_OPTIONS)

      expect(sparkWallet.transferTokens).toHaveBeenCalledWith({
        tokenIdentifier: DUMMY_TRANSFER_OPTIONS.tokenAddress,
        tokenAmount: BigInt(DUMMY_TRANSFER_OPTIONS.value),
        receiverSparkAddress: DUMMY_TRANSFER_OPTIONS.to
      })

      expect(hash).toBe(DUMMY_TX_ID)

      expect(fee).toBe(0n)
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