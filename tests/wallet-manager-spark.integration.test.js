// Copyright 2024 Tether Operations Limited
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
 * Integration tests for WalletManagerSpark using REGTEST network.
 *
 * Run with: npm run test:integration
 */

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals'

import WalletManagerSpark from '../index.js'

// Test seed phrase - DO NOT use in production
// Using a different seed than wallet-account-spark.integration.test.js to avoid conflicts
const SEED_PHRASE = 'amount buzz prefer abstract expose misery basket strike win snap because chest'
const NETWORK = 'REGTEST'

describe('WalletManagerSpark Integration Tests (REGTEST)', () => {
  let wallet
  let accounts = []

  beforeAll(async () => {
    wallet = new WalletManagerSpark(SEED_PHRASE, { network: NETWORK })
  })

  afterAll(async () => {
    // Clean up all account connections
    for (const account of accounts) {
      if (account) {
        await account.cleanupConnections()
      }
    }
  })

  describe('Wallet Manager Initialization', () => {
    test('should create wallet manager with seed phrase', () => {
      expect(wallet).toBeDefined()
    })

    test('should validate seed phrase', () => {
      expect(WalletManagerSpark.isValidSeedPhrase(SEED_PHRASE)).toBe(true)
      expect(WalletManagerSpark.isValidSeedPhrase('invalid seed')).toBe(false)
    })

    test('should generate random seed phrase', () => {
      const randomSeed = WalletManagerSpark.getRandomSeedPhrase()

      expect(randomSeed).toBeDefined()
      expect(typeof randomSeed).toBe('string')
      expect(randomSeed.split(' ').length).toBe(12)
      expect(WalletManagerSpark.isValidSeedPhrase(randomSeed)).toBe(true)
    })
  })

  describe('Account Management', () => {
    test('should get account at index 0', async () => {
      const account = await wallet.getAccount(0)
      accounts.push(account)

      expect(account).toBeDefined()
      expect(account.index).toBe(0)

      const address = await account.getAddress()
      expect(address).toMatch(/^sparkrt1/)
    })

    test('should get account at index 1', async () => {
      const account = await wallet.getAccount(1)
      accounts.push(account)

      expect(account).toBeDefined()
      expect(account.index).toBe(1)

      const address = await account.getAddress()
      expect(address).toMatch(/^sparkrt1/)
    })

    test('should generate different addresses for different account indices', async () => {
      const account0 = await wallet.getAccount(0)
      const account1 = await wallet.getAccount(1)
      accounts.push(account0, account1)

      const address0 = await account0.getAddress()
      const address1 = await account1.getAddress()

      expect(address0).not.toBe(address1)
    })

    test('should get same address for same account index', async () => {
      const account1 = await wallet.getAccount(0)
      const account2 = await wallet.getAccount(0)
      accounts.push(account1, account2)

      const address1 = await account1.getAddress()
      const address2 = await account2.getAddress()

      expect(address1).toBe(address2)
    })
  })

  describe('Network Configuration', () => {
    test('should use REGTEST network', async () => {
      const account = await wallet.getAccount(0)
      accounts.push(account)

      // Verify REGTEST address format
      const address = await account.getAddress()
      expect(address).toMatch(/^sparkrt1/)
    })

    test('should create wallets with different network configs', () => {
      const mainnetWallet = new WalletManagerSpark(SEED_PHRASE, { network: 'MAINNET' })
      const testnetWallet = new WalletManagerSpark(SEED_PHRASE, { network: 'TESTNET' })

      expect(mainnetWallet).toBeDefined()
      expect(testnetWallet).toBeDefined()
    })
  })
})
