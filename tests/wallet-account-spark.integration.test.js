// Copyright 2026 Tether Operations Limited
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * Integration tests for WalletAccountSpark using REGTEST network.
 *
 * These tests run against the real Spark REGTEST network and require
 * network connectivity. They test actual wallet operations including
 * address generation, transactions, and balance queries.
 *
 * Run with: npm run test:integration
 */

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'

import WalletManagerSpark from '../index.js'

// Test seed phrases - DO NOT use in production
const SEED_PHRASE_1 = 'joy follow indicate right today betray turtle fetch spoil museum much excess'
const SEED_PHRASE_2 = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

const NETWORK = 'REGTEST'

describe('WalletAccountSpark Integration Tests (REGTEST)', () => {
  let wallet1
  let wallet2
  let account1
  let account2

  beforeAll(async () => {
    // Initialize two wallets for testing transfers
    wallet1 = new WalletManagerSpark(SEED_PHRASE_1, { network: NETWORK })
    wallet2 = new WalletManagerSpark(SEED_PHRASE_2, { network: NETWORK })

    account1 = await wallet1.getAccount(0)
    account2 = await wallet2.getAccount(0)
  })

  afterAll(async () => {
    // Clean up connections
    if (account1) await account1.cleanupConnections()
    if (account2) await account2.cleanupConnections()
  })

  describe('Wallet Initialization', () => {
    test('should initialize wallet and get account', async () => {
      expect(account1).toBeDefined()
      expect(account1.index).toBe(0)
    })

    test('should have correct derivation path format', async () => {
      // Path format: m/44'/998'/{networkId}'/0/{index}
      expect(account1.path).toMatch(/^m\/44'\/998'\/\d+'\/0\/0$/)
    })

    test('should have key pair', async () => {
      const { publicKey, privateKey } = account1.keyPair
      expect(publicKey).toBeInstanceOf(Uint8Array)
      expect(privateKey).toBeInstanceOf(Uint8Array)
      expect(publicKey.length).toBeGreaterThan(0)
      expect(privateKey.length).toBeGreaterThan(0)
    })
  })

  describe('Address Generation', () => {
    test('should get Spark address', async () => {
      const address = await account1.getAddress()

      expect(address).toBeDefined()
      expect(typeof address).toBe('string')
      // REGTEST addresses start with 'sparkrt'
      expect(address).toMatch(/^sparkrt1/)
    })

    test('should get different addresses for different accounts', async () => {
      const address1 = await account1.getAddress()
      const address2 = await account2.getAddress()

      expect(address1).not.toBe(address2)
    })

    test('should get single-use deposit address', async () => {
      const depositAddress = await account1.getSingleUseDepositAddress()

      expect(depositAddress).toBeDefined()
      expect(typeof depositAddress).toBe('string')
      // REGTEST Bitcoin addresses start with 'bcrt1'
      expect(depositAddress).toMatch(/^bcrt1/)
    })

    test('should get static deposit address', async () => {
      const staticAddress = await account1.getStaticDepositAddress()

      expect(staticAddress).toBeDefined()
      expect(typeof staticAddress).toBe('string')
      expect(staticAddress).toMatch(/^bcrt1/)
    })

    test('should get unused deposit addresses', async () => {
      const unusedAddresses = await account1.getUnusedDepositAddresses()

      expect(Array.isArray(unusedAddresses)).toBe(true)
    })
  })

  describe('Message Signing', () => {
    const TEST_MESSAGE = 'Hello, Spark REGTEST!'

    test('should sign a message', async () => {
      const signature = await account1.sign(TEST_MESSAGE)

      expect(signature).toBeDefined()
      expect(typeof signature).toBe('string')
      expect(signature.length).toBeGreaterThan(0)
    })

    test('should verify a valid signature', async () => {
      const signature = await account1.sign(TEST_MESSAGE)
      const isValid = await account1.verify(TEST_MESSAGE, signature)

      expect(isValid).toBe(true)
    })

    test('should reject an invalid signature', async () => {
      const signature = await account1.sign(TEST_MESSAGE)
      const isValid = await account1.verify('Different message', signature)

      expect(isValid).toBe(false)
    })
  })

  describe('Balance Queries', () => {
    test('should get balance', async () => {
      const balance = await account1.getBalance()

      expect(typeof balance).toBe('bigint')
      expect(Number(balance) >= 0).toBe(true)
    })

    test('should get token balance', async () => {
      // Use a dummy token address - will return 0 if token doesn't exist
      const tokenBalance = await account1.getTokenBalance('btkn1dummy')

      expect(typeof tokenBalance).toBe('bigint')
      expect(Number(tokenBalance) >= 0).toBe(true)
    })
  })

  describe('Transfer History', () => {
    test('should get transfers with default options', async () => {
      const transfers = await account1.getTransfers()

      expect(Array.isArray(transfers)).toBe(true)
    })

    test('should get transfers with direction filter', async () => {
      const incomingTransfers = await account1.getTransfers({ direction: 'incoming' })
      const outgoingTransfers = await account1.getTransfers({ direction: 'outgoing' })

      expect(Array.isArray(incomingTransfers)).toBe(true)
      expect(Array.isArray(outgoingTransfers)).toBe(true)
    })

    test('should get transfers with pagination', async () => {
      const transfers = await account1.getTransfers({ limit: 5, skip: 0 })

      expect(Array.isArray(transfers)).toBe(true)
      expect(transfers.length).toBeLessThanOrEqual(5)
    })
  })

  describe('Spark Invoice Operations', () => {
    test('should create a Spark sats invoice', async () => {
      const invoice = await account2.createSparkSatsInvoice({
        amount: 100,
        memo: 'Integration test invoice'
      })

      expect(invoice).toBeDefined()
      expect(typeof invoice).toBe('string')
      // Spark invoices start with 'sparkrt' on REGTEST
      expect(invoice).toMatch(/^sparkrt/)
    })

    test('should query Spark invoice status', async () => {
      const invoice = await account2.createSparkSatsInvoice({
        amount: 100,
        memo: 'Status test invoice'
      })

      const status = await account2.getSparkInvoices([invoice])

      expect(status).toBeDefined()
    })
  })

  describe('Lightning Invoice Operations', () => {
    test('should create a Lightning invoice', async () => {
      const invoiceRequest = await account2.createLightningInvoice({
        amountSats: 500,
        memo: 'Integration test Lightning invoice'
      })

      expect(invoiceRequest).toBeDefined()
      expect(invoiceRequest.invoice).toBeDefined()
      expect(invoiceRequest.invoice.encodedInvoice).toBeDefined()
      // REGTEST Lightning invoices start with 'lnbcrt'
      expect(invoiceRequest.invoice.encodedInvoice).toMatch(/^lnbcrt/)
    })

    test('should get Lightning fee estimate', async () => {
      const invoiceRequest = await account2.createLightningInvoice({
        amountSats: 500,
        memo: 'Fee estimate test'
      })

      const feeEstimate = await account1.quotePayLightningInvoice({
        encodedInvoice: invoiceRequest.invoice.encodedInvoice
      })

      expect(typeof feeEstimate).toBe('bigint')
      expect(Number(feeEstimate) >= 0).toBe(true)
    })

    test('should pay Lightning invoice if account has balance', async () => {
      const balance1 = await account1.getBalance()
      const balance2 = await account2.getBalance()
      const PAYMENT_AMOUNT = 500

      // Use whichever account has funds (need extra for fees)
      const [payer, receiver] = Number(balance1) >= PAYMENT_AMOUNT + 100
        ? [account1, account2]
        : Number(balance2) >= PAYMENT_AMOUNT + 100
          ? [account2, account1]
          : [null, null]

      if (!payer) {
        console.log('Skipping Lightning invoice payment test - no account has sufficient balance')
        console.log('  account1:', Number(balance1), 'sats')
        console.log('  account2:', Number(balance2), 'sats')
        return
      }

      // Create Lightning invoice from receiver
      const invoiceRequest = await receiver.createLightningInvoice({
        amountSats: PAYMENT_AMOUNT,
        memo: 'Lightning payment integration test'
      })

      expect(invoiceRequest).toBeDefined()
      expect(invoiceRequest.invoice.encodedInvoice).toMatch(/^lnbcrt/)

      // Get fee estimate
      const feeEstimate = await payer.quotePayLightningInvoice({
        encodedInvoice: invoiceRequest.invoice.encodedInvoice
      })

      expect(typeof feeEstimate).toBe('bigint')

      // Pay the Lightning invoice
      const result = await payer.payLightningInvoice({
        invoice: invoiceRequest.invoice.encodedInvoice,
        maxFeeSats: Number(feeEstimate) + 100
      })

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
    })
  })

  describe('Read-Only Account', () => {
    test('should create a read-only account', async () => {
      const readOnlyAccount = await account1.toReadOnlyAccount()

      expect(readOnlyAccount).toBeDefined()

      const address = await readOnlyAccount.getAddress()
      const balance = await readOnlyAccount.getBalance()

      expect(address).toBeDefined()
      expect(typeof balance).toBe('bigint')
      expect(Number(balance) >= 0).toBe(true)
    })
  })

  // Conditional tests that require funded accounts
  describe('Transaction Operations (requires funded account)', () => {
    test('should send transaction if account has balance', async () => {
      const balance1 = await account1.getBalance()

      if (Number(balance1) < 1000) {
        console.log('Skipping send test - account1 has insufficient balance:', Number(balance1), 'sats')
        return
      }

      const address2 = await account2.getAddress()

      const result = await account1.sendTransaction({
        to: address2,
        value: 100
      })

      expect(result).toBeDefined()
      expect(result.hash).toBeDefined()
      expect(typeof result.hash).toBe('string')
      expect(Number(result.fee)).toBe(0) // Spark transactions are fee-free
    })

    test('should create and query Spark invoice', async () => {
      // Create invoice from account2
      const invoice = await account2.createSparkSatsInvoice({
        amount: 100,
        memo: 'Integration test invoice'
      })

      expect(invoice).toBeDefined()
      expect(typeof invoice).toBe('string')

      // Query the invoice status
      const status = await account2.getSparkInvoices([invoice])
      expect(status).toBeDefined()
    })

    test('should pay Spark invoice if account has balance', async () => {
      const balance1 = await account1.getBalance()
      const balance2 = await account2.getBalance()
      const PAYMENT_AMOUNT = 100

      // Use whichever account has funds
      const [payer, receiver] = Number(balance1) >= PAYMENT_AMOUNT
        ? [account1, account2]
        : Number(balance2) >= PAYMENT_AMOUNT
          ? [account2, account1]
          : [null, null]

      if (!payer) {
        console.log('Skipping Spark invoice payment test - no account has sufficient balance')
        console.log('  account1:', Number(balance1), 'sats')
        console.log('  account2:', Number(balance2), 'sats')
        return
      }

      // Create invoice from receiver
      const invoice = await receiver.createSparkSatsInvoice({
        amount: PAYMENT_AMOUNT,
        memo: 'Payment integration test'
      })

      expect(invoice).toBeDefined()
      expect(typeof invoice).toBe('string')

      // Pay the invoice from payer
      const result = await payer.paySparkInvoice([
        { invoice, amount: PAYMENT_AMOUNT }
      ])

      expect(result).toBeDefined()
      expect(result.satsTransactionSuccess).toBeDefined()
      expect(Array.isArray(result.satsTransactionSuccess)).toBe(true)
      expect(result.satsTransactionSuccess.length).toBe(1)
      expect(result.satsTransactionErrors).toEqual([])
    })

    test('should pay Spark invoice without amount when invoice has encoded amount', async () => {
      const balance1 = await account1.getBalance()
      const balance2 = await account2.getBalance()
      const PAYMENT_AMOUNT = 50

      // Use whichever account has funds
      const [payer, receiver] = Number(balance1) >= PAYMENT_AMOUNT
        ? [account1, account2]
        : Number(balance2) >= PAYMENT_AMOUNT
          ? [account2, account1]
          : [null, null]

      if (!payer) {
        console.log('Skipping Spark invoice payment test - no account has sufficient balance')
        return
      }

      // Create invoice with encoded amount from receiver
      const invoice = await receiver.createSparkSatsInvoice({
        amount: PAYMENT_AMOUNT,
        memo: 'Invoice with encoded amount'
      })

      // Pay without specifying amount (should use encoded amount)
      const result = await payer.paySparkInvoice([
        { invoice }
      ])

      expect(result).toBeDefined()
      expect(result.satsTransactionSuccess).toBeDefined()
      expect(result.satsTransactionSuccess.length).toBe(1)
    })
  })
})
