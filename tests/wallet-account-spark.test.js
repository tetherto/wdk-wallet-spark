import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'

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
  let wallet,
      account

  beforeEach(async () => {
    ({ wallet } = await SparkWallet.initialize({
      signer: new Bip44SparkSigner(0),
      mnemonicOrSeed: SEED,
      options: {
        network: 'MAINNET'
      }
    }))

    account = new WalletAccountSpark(wallet)
  }, 10_000)

  afterEach(() => {
    account.dispose()
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
    const TRANSACTION = {
      to: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
      value: 100
    }

    const DUMMY_ID = 'dummy-id'

    test('should successfully send a transaction', async () => {
      wallet.transfer = jest.fn(({ receiverSparkAddress, amountSats }) => 
        receiverSparkAddress === TRANSACTION.to &&
        amountSats === TRANSACTION.value &&
        {
          id: DUMMY_ID
        }
      )

      const { hash, fee } = await account.sendTransaction(TRANSACTION)

      expect(hash).toBe(DUMMY_ID)

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
      await expect(account.transfer({ }))
        .rejects.toThrow('Method not supported on the spark blockchain.')
    })
  })

  describe('quoteTransfer', () => {
    test('should throw an unsupported operation error', async () => {
      await expect(account.quoteTransfer({ }))
        .rejects.toThrow('Method not supported on the spark blockchain.')
    })
  })

  describe('getBalance', () => {
    test('should return the correct balance of the account', async () => {
      wallet.getBalance = jest.fn(() => ({
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
})
