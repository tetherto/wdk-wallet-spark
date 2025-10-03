import { describe } from 'noba'
import { spy } from 'noba/spy'

import { WalletAccountSpark } from '@tetherto/wdk-wallet-spark'

const isBare = 'Bare' in global
const shims = isBare ? { imports: 'bare-wdk-runtime/package' } : {}

const { SparkWallet } = await import('../src/libs/spark-sdk.js', {
  with: shims
})

const { mnemonicToSeedSync } = await import('bip39', { with: shims })

const { default: Bip44SparkSigner } = await import('../src/bip-44/spark-signer.js', { with: shims })

const SEED_PHRASE = 'cook voyage document eight skate token alien guide drink uncle term abuse'

const SEED = mnemonicToSeedSync(SEED_PHRASE)

const ACCOUNT = {
  index: 0,
  path: "m/44'/998'/0'/0/0",
  address: 'sp1pgss9mdgv7f6cf3lq5a3feh2jtnuypgf2x438tdq79q9jxtnflj9hhq4htem47',
  keyPair: {
    privateKey: 'd5d117a4be53b177b4ba48fc709539e37e24e72d4a90f1d47daf309ec3e8ae7b',
    publicKey: '02eda86793ac263f053b14e6ea92e7c2050951ab13ada0f1405919734fe45bdc15'
  }
}

describe('WalletAccountSpark', ({ describe, beforeAll, afterAll, beforeEach }) => {
  let sparkWallet, account

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
    account = new WalletAccountSpark(sparkWallet, {
      network: 'MAINNET'
    })
  })

  describe('constructor', ({ test }) => {
    test('should successfully initialize an account for the given spark wallet', async ({
      expect
    }) => {
      expect(account.index).toBe(ACCOUNT.index)

      expect(account.path).toBe(ACCOUNT.path)

      expect(account.keyPair).toEqual({
        privateKey: new Uint8Array(Buffer.from(ACCOUNT.keyPair.privateKey, 'hex')),
        publicKey: new Uint8Array(Buffer.from(ACCOUNT.keyPair.publicKey, 'hex'))
      })
    })
  })

  describe('sign', ({ test }) => {
    const MESSAGE = 'Dummy message to sign.'

    const EXPECTED_SIGNATURE =
      '304402206aeb89509bda36572e2f042e9fb6b04bf3c759c0473c6d0e683143680bb363ad02207bd0e9dd8ff98a9a15962722904c71dd074c83ce8717d67d31b1010a4e9c6de6'

    test('should return the correct signature', async ({ expect }) => {
      const signature = await account.sign(MESSAGE)

      expect(signature).toBe(EXPECTED_SIGNATURE)
    })
  })

  describe('verify', ({ test }) => {
    const MESSAGE = 'Dummy message to sign.'

    const SIGNATURE =
      '304402206aeb89509bda36572e2f042e9fb6b04bf3c759c0473c6d0e683143680bb363ad02207bd0e9dd8ff98a9a15962722904c71dd074c83ce8717d67d31b1010a4e9c6de6'

    test('should return true for a valid signature', async ({ expect }) => {
      const result = await account.verify(MESSAGE, SIGNATURE)

      expect(result).toBe(true)
    })

    test('should return false for an invalid signature', async ({ expect }) => {
      const result = await account.verify('Another message.', SIGNATURE)

      expect(result).toBe(false)
    })

    test('should throw on a malformed signature', async ({ expect }) => {
      await expect(async () => {
        await account.verify(MESSAGE, 'A bad signature')
      }).rejects('hex string expected')
    })
  })

  describe('sendTransaction', ({ test }) => {
    const DUMMY_TRANSACTION = {
      to: 'sp1pgssxdn5c2vxkqhetf58ssdy6fxz9hpwqd36uccm772gvudvsmueuxtm2leurf',
      value: 100
    }

    const DUMMY_WALLET_TRANSFER = {
      id: 'dummy-wallet-transfer-1'
    }

    test('should successfully send a transaction', async ({ expect }) => {
      sparkWallet.transfer = spy(() => DUMMY_WALLET_TRANSFER)

      const { hash, fee } = await account.sendTransaction(DUMMY_TRANSACTION)

      expect(sparkWallet.transfer).toHaveBeenCalledWith({
        receiverSparkAddress: DUMMY_TRANSACTION.to,
        amountSats: DUMMY_TRANSACTION.value
      })

      expect(hash).toBe(DUMMY_WALLET_TRANSFER.id)

      expect(fee).toBe(0n)
    })
  })

  describe('transfer', ({ test }) => {
    test('should throw an unsupported operation error', async ({ expect }) => {
      await expect(async () => {
        await account.transfer({})
      }).rejects('Method not supported on the spark blockchain.')
    })
  })

  describe('getSingleUseDepositAddress', ({ test }) => {
    test('should return a valid single use deposit address', async ({ expect }) => {
      const DUMMY_SINGLE_USE_DEPOSIT_ADDRESS =
        'bc1pgljhxntemplmml7xz9gmf7cptw4hualdnf348jmu95k6gzuxgfeslrg6kh'
      sparkWallet.getSingleUseDepositAddress = spy(() => DUMMY_SINGLE_USE_DEPOSIT_ADDRESS)

      const address = await account.getSingleUseDepositAddress()
      expect(sparkWallet.getSingleUseDepositAddress).toHaveBeenCalled()
      expect(address).toBe(DUMMY_SINGLE_USE_DEPOSIT_ADDRESS)
    })
  })

  describe('claimDeposit', ({ test }) => {
    test('should successfully claim a deposit', async ({ expect }) => {
      const DUMMY_TX_ID = 'dummy-tx-id'

      const DUMMY_WALLET_LEAFS = [{ id: 'wallet-leaf-1' }, { id: 'wallet-leaf-2' }]

      sparkWallet.claimDeposit = spy(() => DUMMY_WALLET_LEAFS)

      const nodes = await account.claimDeposit(DUMMY_TX_ID)
      expect(sparkWallet.claimDeposit).toHaveBeenCalledWith(DUMMY_TX_ID)
      expect(nodes).toEqual(DUMMY_WALLET_LEAFS)
    })
  })

  describe('getUtxosForDepositAddress', ({ test }) => {
    test('should return the list of confirmed utxos', async ({ expect }) => {
      const DUMMY_DEPOSIT_ADDRESS = 'bc1pgljhxntemplmml7xz9gmf7cptw4hualdnf348jmu95k6gzuxgfeslrg6kh'

      const DUMMY_LIST_OF_CONFIRMED_UTXOS = [
        { txid: 'utxo-txid-1', vout: 0 },
        { txid: 'utxo-txid-2', vout: 1 }
      ]

      sparkWallet.getUtxosForDepositAddress = spy(() => DUMMY_LIST_OF_CONFIRMED_UTXOS)

      const utxos = await account.getUtxosForDepositAddress(DUMMY_DEPOSIT_ADDRESS)
      expect(sparkWallet.getUtxosForDepositAddress).toHaveBeenCalledWith(
        DUMMY_DEPOSIT_ADDRESS,
        100,
        0
      )
      expect(utxos).toEqual(['utxo-txid-1', 'utxo-txid-2'])
    })
  })

  describe('withdraw', ({ test }) => {
    test('should successfully initialize a withdrawal', async ({ expect }) => {
      const DUMMY_OPTIONS = {
        to: 'tb1qx3fju0uclmp0xmqzhxjcydeal6eky95srd2laj',
        value: 100
      }

      const DUMMY_COOP_EXIT_FEE_QUOTE = {
        id: 'coop-exit-fee-quote-1'
      }

      const DUMMY_COOP_EXIT_REQUEST = {
        id: 'coop-exit-request-1'
      }

      sparkWallet.getWithdrawalFeeQuote = spy(() => DUMMY_COOP_EXIT_FEE_QUOTE)

      sparkWallet.withdraw = spy(() => DUMMY_COOP_EXIT_REQUEST)

      const coopExitRequest = await account.withdraw(DUMMY_OPTIONS)

      expect(sparkWallet.getWithdrawalFeeQuote).toHaveBeenCalledWith({
        withdrawalAddress: DUMMY_OPTIONS.to,
        amountSats: DUMMY_OPTIONS.value
      })

      expect(sparkWallet.withdraw).toHaveBeenCalledWith({
        onchainAddress: DUMMY_OPTIONS.to,
        amountSats: DUMMY_OPTIONS.value,
        feeQuote: DUMMY_COOP_EXIT_FEE_QUOTE,
        exitSpeed: 'MEDIUM'
      })

      expect(coopExitRequest).toEqual(DUMMY_COOP_EXIT_REQUEST)
    })
  })

  describe('createLightningInvoice', ({ test }) => {
    test('should successfully create a lighting invoice', async ({ expect }) => {
      const DUMMY_OPTIONS = {
        value: 1_500,
        memo: 'This is just a test invoice.'
      }

      const DUMMY_LIGHTNING_RECEIVE_REQUEST = {
        id: 'lightining-receive-request-1'
      }

      sparkWallet.createLightningInvoice = spy(() => DUMMY_LIGHTNING_RECEIVE_REQUEST)

      const lightningReceiveRequest = await account.createLightningInvoice(DUMMY_OPTIONS)

      expect(sparkWallet.createLightningInvoice).toHaveBeenCalledWith({
        amountSats: DUMMY_OPTIONS.value,
        memo: DUMMY_OPTIONS.memo
      })

      expect(lightningReceiveRequest).toEqual(DUMMY_LIGHTNING_RECEIVE_REQUEST)
    })
  })

  describe('getLightningReceiveRequest', ({ test }) => {
    test('should successfully return the lightning receive request', async ({ expect }) => {
      const DUMMY_INVOICE_ID = 'dummy-invoice-id'

      const DUMMY_LIGHTING_RECEIVE_REQUEST = {
        id: DUMMY_INVOICE_ID
      }

      sparkWallet.getLightningReceiveRequest = spy(() => DUMMY_LIGHTING_RECEIVE_REQUEST)

      const lightningReceiveRequest = await account.getLightningReceiveRequest(DUMMY_INVOICE_ID)
      expect(sparkWallet.getLightningReceiveRequest).toHaveBeenCalledWith(DUMMY_INVOICE_ID)
      expect(lightningReceiveRequest).toEqual(DUMMY_LIGHTING_RECEIVE_REQUEST)
    })
  })

  describe('payLightningInvoice', ({ test }) => {
    test('should successfully pay a lightning invoice', async ({ expect }) => {
      const DUMMY_OPTIONS = {
        invoice: 'dummy-bolt11-invoice',
        maxFeeSats: 50
      }

      const DUMMY_LIGHTNING_SEND_REQUEST = {
        id: 'lighting-send-request-1'
      }

      sparkWallet.payLightningInvoice = spy(() => DUMMY_LIGHTNING_SEND_REQUEST)

      const lightningSendRequest = await account.payLightningInvoice(DUMMY_OPTIONS)

      expect(sparkWallet.payLightningInvoice).toHaveBeenCalledWith({
        invoice: DUMMY_OPTIONS.invoice,
        maxFeeSats: DUMMY_OPTIONS.maxFeeSats
      })

      expect(lightningSendRequest).toEqual(DUMMY_LIGHTNING_SEND_REQUEST)
    })
  })

  describe('getLightningSendFeeEstimate', ({ test }) => {
    test('should successfully return the fee estimate', async ({ expect }) => {
      const DUMMY_OPTIONS = {
        invoice: 'dummy-bolt11-invoice'
      }

      const DUMMY_FEE_ESTIMATE = 100

      sparkWallet.getLightningSendFeeEstimate = spy(() => DUMMY_FEE_ESTIMATE)

      const feeEstimate = await account.getLightningSendFeeEstimate(DUMMY_OPTIONS)

      expect(sparkWallet.getLightningSendFeeEstimate).toHaveBeenCalledWith({
        encodedInvoice: DUMMY_OPTIONS.invoice
      })

      expect(feeEstimate).toBe(DUMMY_FEE_ESTIMATE)
    })
  })

  describe('getTransfers', ({ test }) => {
    const DUMMY_TRANSFERS = [
      {
        id: 'dummy-transfer-1',
        transferDirection: 'INCOMING',
        totalValue: 1_000
      },
      {
        id: 'dummy-transfer-2',
        transferDirection: 'OUTGOING',
        totalValue: 2_000
      },
      {
        id: 'dummy-transfer-3',
        transferDirection: 'INCOMING',
        totalValue: 3_000
      },
      {
        id: 'dummy-transfer-4',
        transferDirection: 'OUTGOING',
        totalValue: 4_000
      },
      {
        id: 'dummy-transfer-5',
        transferDirection: 'INCOMING',
        totalValue: 5_000
      }
    ]

    test('should return an empty transfer history', async ({ expect }) => {
      sparkWallet.getTransfers = spy(() => ({ transfers: [] }))

      const transfers = await account.getTransfers()
      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(10, 0)
      expect(transfers).toEqual([])
    })

    test('should return the full transfer history', async ({ expect }) => {
      sparkWallet.getTransfers = spy((limit, offset) => {
        const i = offset / limit
        if (i === 0) return { transfers: DUMMY_TRANSFERS }
        return { transfers: [] }
      })

      const transfers = await account.getTransfers()
      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(10, 0)
      expect(transfers).toEqual(DUMMY_TRANSFERS)
    })

    test('should return the incoming transfer history', async ({ expect }) => {
      sparkWallet.getTransfers = spy((limit, offset) => {
        const i = offset / limit
        if (i === 0) return { transfers: DUMMY_TRANSFERS }
        return { transfers: [] }
      })

      const transfers = await account.getTransfers({ direction: 'incoming' })
      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(10, 0)
      expect(transfers).toEqual([DUMMY_TRANSFERS[0], DUMMY_TRANSFERS[2], DUMMY_TRANSFERS[4]])
    })

    test('should return the outgoing transfer history', async ({ expect }) => {
      sparkWallet.getTransfers = spy((limit, offset) => {
        const i = offset / limit
        if (i === 0) return { transfers: DUMMY_TRANSFERS }
        return { transfers: [] }
      })

      const transfers = await account.getTransfers({ direction: 'outgoing' })
      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(10, 0)
      expect(transfers).toEqual([DUMMY_TRANSFERS[1], DUMMY_TRANSFERS[3]])
    })

    test('should correctly paginate the transfer history', async ({ expect }) => {
      sparkWallet.getTransfers = spy((limit, offset) => {
        const i = offset / limit
        if (i === 0) return { transfers: DUMMY_TRANSFERS }
        return { transfers: [] }
      })

      const transfers = await account.getTransfers({ limit: 2, skip: 1 })
      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(3, 0)
      expect(transfers).toEqual([DUMMY_TRANSFERS[1], DUMMY_TRANSFERS[2]])
    })

    test('should correctly filter and paginate the transfer history', async ({ expect }) => {
      sparkWallet.getTransfers = spy((limit, offset) => {
        const i = offset / limit
        if (i === 0) return { transfers: DUMMY_TRANSFERS.slice(0, 3) }
        if (i === 1) return { transfers: DUMMY_TRANSFERS.slice(3) }
        return { transfers: [] }
      })

      const transfers = await account.getTransfers({
        limit: 2,
        skip: 1,
        direction: 'incoming'
      })

      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(3, 0)
      expect(sparkWallet.getTransfers).toHaveBeenCalledWith(3, 3)
      expect(transfers).toEqual([DUMMY_TRANSFERS[2], DUMMY_TRANSFERS[4]])
    })
  })

  describe('cleanupConnections', ({ test }) => {
    test('should close and clean up connections with the blockchain', async ({ expect }) => {
      sparkWallet.cleanupConnections = spy(() => {})

      await account.cleanupConnections()

      expect(sparkWallet.cleanupConnections).toHaveBeenCalled()
    })
  })
})
