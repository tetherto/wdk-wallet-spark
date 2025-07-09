import { describe, expect, test, beforeEach, beforeAll, jest } from '@jest/globals'

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'

const ACCOUNT0 = {
  index: 0,
  path: "m/44'/998'/0'/0/0",
  address: 'sp1pgss9mdgv7f6cf3lq5a3feh2jtnuypgf2x438tdq79q9jxtnflj9hhq4htem47',
  keyPair: {
    privateKey: '2f6e61273bf7baab873fe2793b150b61f885c0891a50b9b77c5b03ec5fd836c4',
    publicKey: '03f450d51b5c6472daa904467d74d96d78f65acb69034752f789d6b9a01f6a4e51'
  }
}

const ACCOUNT1 = {
  index: 1,
  path: "m/44'/998'/0'/0/1",
  address: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
  keyPair: {
    privateKey: 'b8f67273f2e81f709d6b835d1f7d9b15066c8a5ef8b5c6eae124592116be4b90',
    publicKey: '0372b256eca0c453e08a2a6ca58d5f90e73004c3d8c6db8474542df0494550a086'
  }
}

jest.unstable_mockModule('@buildonspark/spark-sdk', () => {
  const mockKeyPairs = {
    0: {
      privateKey: new Uint8Array([
        ...Buffer.from(ACCOUNT0.keyPair.privateKey, 'hex')
      ]),
      publicKey: new Uint8Array([
        ...Buffer.from(ACCOUNT0.keyPair.publicKey, 'hex')
      ]),
      address: ACCOUNT0.address
    },
    1: {
      privateKey: new Uint8Array([
        ...Buffer.from(ACCOUNT1.keyPair.privateKey, 'hex')
      ]),
      publicKey: new Uint8Array([
        ...Buffer.from(ACCOUNT1.keyPair.publicKey, 'hex')
      ]),
      address: ACCOUNT1.address
    }
  }

  const accountBalances = new Map()
  const initializeBalance = (address) => {
    if (!accountBalances.has(address)) {
      accountBalances.set(address, 10000n)
    }
    return accountBalances.get(address)
  }

  const createMockWalletInstance = (index) => {
    const keyPair = mockKeyPairs[index]

    if (!keyPair) {
      throw new Error(`Mock wallet not configured for index: ${index}`)
    }

    return {
      getSparkAddress: jest.fn().mockResolvedValue(keyPair.address),
      signMessageWithIdentityKey: jest.fn().mockImplementation(async (message) => {
        if (!keyPair.privateKey) throw new TypeError('Uint8Array expected')
        return 'mock-signature'
      }),
      validateMessageWithIdentityKey: jest.fn().mockImplementation(async (message, signature) => {
        if (message === 'Hello, world!' && signature === 'mock-signature') {
          return true
        }
        return false
      }),
      transfer: jest.fn().mockImplementation(async (options) => {
        if (!keyPair.privateKey) throw new TypeError('Uint8Array expected')

        const { receiverSparkAddress, amountSats } = options
        const senderBalance = initializeBalance(keyPair.address)
        const recipientBalance = initializeBalance(receiverSparkAddress)

        accountBalances.set(keyPair.address, senderBalance - BigInt(amountSats))
        accountBalances.set(receiverSparkAddress, recipientBalance + BigInt(amountSats))

        return { id: 'mock-tx-hash' }
      }),
      getBalance: jest.fn().mockImplementation(async () => {
        const balance = initializeBalance(keyPair.address)
        return { balance }
      }),
      config: {
        signer: {
          index,
          identityKey: {
            privateKey: keyPair.privateKey,
            publicKey: keyPair.publicKey
          },
          dispose: jest.fn().mockImplementation(function () {
            this.masterKey = undefined
            this.identityKey = undefined
            this.signingKey = undefined
            this.depositKey = undefined
            this.staticDepositKey = undefined
            if (this.publicKeyToPrivateKeyMap) this.publicKeyToPrivateKeyMap.clear()
            keyPair.privateKey = undefined
            keyPair.publicKey = undefined
          })
        },
        config: {
          network: 'TESTNET'
        }
      },
      masterKey: { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey },
      identityKey: { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey },
      signingKey: { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey },
      depositKey: { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey },
      staticDepositKey: { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey },
      publicKeyToPrivateKeyMap: new Map()
    }
  }

  const initializedWallets = new Map()

  return {
    SparkWallet: {
      initialize: jest.fn().mockImplementation(async ({ signer }) => {
        const index = signer.index
        if (!initializedWallets.has(index)) {
          initializedWallets.set(index, createMockWalletInstance(index))
        }
        return { wallet: initializedWallets.get(index) }
      })
    },
    ValidationError: class ValidationError extends Error {
      constructor (message, context) {
        super(message)
        this.name = 'ValidationError'
        this.context = context
      }
    },
    Network: {
      MAINNET: 0,
      TESTNET: 0
    },
    getLatestDepositTxId: jest.fn().mockResolvedValue('mock-deposit-tx-id')
  }
})

describe('@wdk/wallet-spark', () => {
  let wallet
  let account0, account1

  let bip39, WalletManagerSpark, walletModule, WalletAccountSpark, SEED

  beforeAll(async () => {
    bip39 = await import('bip39')
    walletModule = await import('../../index.js')
    WalletManagerSpark = walletModule.default
    WalletAccountSpark = walletModule.WalletAccountSpark
    SEED = bip39.mnemonicToSeedSync(SEED_PHRASE)
  })

  beforeEach(async () => {
    wallet = new WalletManagerSpark(SEED, {
      provider: 'TESTNET'
    })
    account0 = await wallet.getAccount(0)
    account1 = await wallet.getAccount(1)
  })

  test('should derive an account, quote the cost of a tx and check the fee', async () => {
    const txAmount = 1_000

    wallet = new WalletManagerSpark(SEED, {
      provider: 'TESTNET'
    })
    account0 = await wallet.getAccount(0)
    account1 = await wallet.getAccount(1)

    expect(account0.index).toBe(ACCOUNT0.index)
    expect(account0.path).toBe(ACCOUNT0.path)
    expect(account0.keyPair).toEqual({
      privateKey: new Uint8Array(Buffer.from(ACCOUNT0.keyPair.privateKey, 'hex')),
      publicKey: new Uint8Array(Buffer.from(ACCOUNT0.keyPair.publicKey, 'hex'))
    })

    expect(account1.index).toBe(ACCOUNT1.index)
    expect(account1.path).toBe(ACCOUNT1.path)
    expect(account1.keyPair).toEqual({
      privateKey: new Uint8Array(Buffer.from(ACCOUNT1.keyPair.privateKey, 'hex')),
      publicKey: new Uint8Array(Buffer.from(ACCOUNT1.keyPair.publicKey, 'hex'))
    })

    const TRANSACTION = {
      to: await account1.getAddress(),
      value: txAmount
    }
    const EXPECTED_FEE = 0

    const { fee: estimatedFee } = await account0.quoteSendTransaction(TRANSACTION)
    expect(estimatedFee).toBe(EXPECTED_FEE)

    const { fee: actualFee } = await account0.sendTransaction(TRANSACTION)
    expect(actualFee).toBe(estimatedFee)
  })

  test('should send a tx from account 0 to 1 and check the balances', async () => {
    const txAmount = 1_000

    const startBalance0 = await account0.getBalance()
    const startBalance1 = await account1.getBalance()

    const TRANSACTION = {
      to: await account1.getAddress(),
      value: txAmount
    }

    const { fee: actualFee } = await account0.sendTransaction(TRANSACTION)

    const endBalance0 = await account0.getBalance()

    const expectedBalance0 = startBalance0 - txAmount - actualFee
    expect(endBalance0).toEqual(expectedBalance0)

    const endBalance1 = await account1.getBalance()

    expect(endBalance1).toEqual(startBalance1 + txAmount)
  })

  test('should sign a message and verify its signature', async () => {
    const message = 'Hello, world!'

    const signature = await account0.sign(message)
    expect(signature).toBe('mock-signature')
    
    const verified = await account0.verify(message, signature)
    expect(verified).toBe(true)
  })

  test('should dispose the wallet and throw an error when trying to access the private key', async () => {
    const message = 'Hello, world!'

    wallet.dispose()

    expect(() => account0.keyPair).toThrow('Cannot read properties of undefined')
    expect(() => account1.keyPair).toThrow('Cannot read properties of undefined')

    await expect(account0.sendTransaction({ to: await account1.getAddress(), value: 1000 })).rejects.toThrow('Uint8Array expected')
    await expect(account0.sign(message)).rejects.toThrow('Uint8Array expected')
  })
})
