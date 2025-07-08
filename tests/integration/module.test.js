import { describe, expect, test, beforeEach, jest } from '@jest/globals'

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
  address: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf', // this is a mock address
  keyPair: {
    privateKey: 'b8f67273f2e81f709d6b835d1f7d9b15066c8a5ef8b5c6eae124592116be4b90',
    publicKey: '0372b256eca0c453e08a2a6ca58d5f90e73004c3d8c6db8474542df0494550a086'
  }
}

// Mock the Spark SDK BEFORE importing our modules
jest.unstable_mockModule('@buildonspark/spark-sdk', () => {
  // Define different key pairs for different indexes
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

  // Track balances for each account to simulate real balance changes
  const accountBalances = new Map()
  const initializeBalance = (address) => {
    if (!accountBalances.has(address)) {
      accountBalances.set(address, 10000n)
    }
    return accountBalances.get(address)
  }

  // const reInitializeBalance = (address) => {
  //   accountBalances.set(address, 10000n)
  // }

  // Create mock wallet instance factory
  const createMockWalletInstance = (index) => {
    const keyPair = mockKeyPairs[index] || mockKeyPairs[0] // fallback to index 0

    return {
      getSparkAddress: jest.fn().mockResolvedValue(keyPair.address),
      signMessageWithIdentityKey: jest.fn().mockResolvedValue('mock-signature'),
      validateMessageWithIdentityKey: jest.fn().mockResolvedValue(true),
      transfer: jest.fn().mockImplementation(async (options) => {
        // Simulate balance changes
        const { receiverSparkAddress, amountSats } = options
        const senderBalance = initializeBalance(keyPair.address)
        const recipientBalance = initializeBalance(receiverSparkAddress)

        // Update balances
        accountBalances.set(keyPair.address, senderBalance - BigInt(amountSats))
        accountBalances.set(receiverSparkAddress, recipientBalance + BigInt(amountSats))

        return { id: 'mock-tx-hash' }
      }),
      getBalance: jest.fn().mockImplementation(async () => {
        const balance = initializeBalance(keyPair.address)
        return { balance }
      }),
      getSingleUseDepositAddress: jest.fn().mockResolvedValue('mock-deposit-address'),
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
          })
        },
        config: {
          network: 'TESTNET'
        }
      },
      // Add all keys expected by dispose
      masterKey: { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey },
      identityKey: { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey },
      signingKey: { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey },
      depositKey: { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey },
      staticDepositKey: { privateKey: keyPair.privateKey, publicKey: keyPair.publicKey },
      publicKeyToPrivateKeyMap: new Map()
    }
  }

  // Track initialized wallets by index
  const initializedWallets = new Map()

  return {
    SparkWallet: {
      initialize: jest.fn().mockImplementation(async ({ signer }) => {
        const index = signer.index
        if (!initializedWallets.has(index)) {
          initializedWallets.set(index, createMockWalletInstance(index))
        }
        return { wallet: initializedWallets.get(index) }
      }),
      // Optional: If your app calls SparkWallet.getInstance()
      getInstance: jest.fn().mockReturnValue({ wallet: createMockWalletInstance(0) }),
      // Optional: if your app calls `new SparkWallet(...)`
      prototype: {
        initialize: jest.fn().mockImplementation(async ({ signer }) => {
          const index = signer.index
          if (!initializedWallets.has(index)) {
            initializedWallets.set(index, createMockWalletInstance(index))
          }
          return { wallet: initializedWallets.get(index) }
        })
      }
    },
    // Add the missing ValidationError export
    ValidationError: class ValidationError extends Error {
      constructor (message, context) {
        super(message)
        this.name = 'ValidationError'
        this.context = context
      }
    },
    // Add the missing Network export
    Network: {
      MAINNET: 0,
      TESTNET: 0
    },
    // Add the missing getLatestDepositTxId export
    getLatestDepositTxId: jest.fn().mockResolvedValue('mock-deposit-tx-id')
  }
})

// function mockReset () {
//   jest.resetAllMocks()
// }

describe('@wdk/wallet-spark', () => {
  let wallet
  let account0, account1

  let bip39, WalletManagerSpark, walletModule, WalletAccountSpark, Bip44SparkSigner, SEED

  beforeAll(async () => {
    // const { SparkWallet } = await import('@buildonspark/spark-sdk')
    bip39 = await import('bip39')
    walletModule = await import('../../index.js')
    WalletManagerSpark = walletModule.default
    WalletAccountSpark = walletModule.WalletAccountSpark
    Bip44SparkSigner = (await import('../../src/bip-44/spark-signer.js')).default
    SEED = bip39.mnemonicToSeedSync(SEED_PHRASE)
  })

  beforeEach(async () => {
    wallet = new WalletManagerSpark(SEED, {
      provider: 'TESTNET'
    })
    account0 = await wallet.getAccount(0)
    account1 = await wallet.getAccount(1)
  })

  afterEach(async () => {
    // mockReset()
  })

  test('should derive an account, quote the cost of a tx and check the fee', async () => {
    const txAmount = 1_000

    wallet = new WalletManagerSpark(SEED, {
      provider: 'TESTNET'
    })
    account0 = await wallet.getAccount(0)
    account1 = await wallet.getAccount(1)

    // Verify both accounts are instances of WalletAccountSpark
    expect(account0).toBeInstanceOf(WalletAccountSpark)
    expect(account1).toBeInstanceOf(WalletAccountSpark)

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
})
