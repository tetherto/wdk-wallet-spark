# @wdk/wallet-spark

A simple and secure package to manage BIP-44 wallets for the Spark blockchain. This package provides a clean API for creating, managing, and interacting with Spark wallets using BIP-39 seed phrases and Spark-specific derivation paths.

## 🔍 About WDK

This module is part of the [**WDK (Wallet Development Kit)**](https://wallet.tether.io/) project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control. 

For detailed documentation about the complete WDK ecosystem, visit [docs.wallet.tether.io](https://docs.wallet.tether.io).

## 🌟 Features

- **BIP-39 Seed Phrase Support**: Generate and validate BIP-39 mnemonic seed phrases
- **Spark Derivation Paths**: Support for BIP-44 standard derivation paths for Spark
- **Multi-Account Management**: Create and manage multiple accounts from a single seed phrase
- **Spark Address Support**: Generate and manage Spark addresses
- **Message Signing**: Sign and verify messages using Spark cryptography
- **Transaction Management**: Send transactions and get fee estimates
- **Balance Management**: Query native token balances
- **TypeScript Support**: Full TypeScript definitions included
- **Memory Safety**: Secure private key management with memory-safe implementation
- **Network Flexibility**: Support for custom Spark RPC endpoints

## ⬇️ Installation

To install the `@wdk/wallet-spark` package, follow these instructions:

### Public Release

Once the package is publicly available, you can install it using npm:

```bash
npm install @wdk/wallet-spark
```

### Private Access

If you have access to the private repository, install the package from the develop branch on GitHub:

```bash
npm install git+https://github.com/tetherto/wdk-wallet-spark.git#develop
```

After installation, ensure your package.json includes the dependency correctly:

```json
"dependencies": {
  // ... other dependencies ...
  "@wdk/wallet-spark": "git+ssh://git@github.com:tetherto/wdk-wallet-spark.git#develop"
  // ... other dependencies ...
}
```

## 🚀 Quick Start

### Importing from `@wdk/wallet-spark`

1. WalletManagerSpark: Main class for managing wallets
2. WalletAccountSpark: Use this for full access accounts

### Creating a New Wallet

```javascript
import WalletManagerSpark, { WalletAccountSpark } from '@wdk/wallet-spark'

// Use a BIP-39 seed phrase (replace with your own secure phrase)
const seedPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

// Create wallet manager with Spark RPC provider
const wallet = new WalletManagerSpark(seedPhrase, {
  provider: 'https://api.spark.com', // or any Spark RPC endpoint
  network: 'mainnet' // or 'testnet'
})

// Get a full access account
const account = await wallet.getAccount(0)

// Get the account's address
const address = await account.getAddress()
console.log('Account address:', address)
```

### Managing Multiple Accounts

```javascript
import WalletManagerSpark from '@wdk/wallet-spark'

// Assume wallet is already created
// Get the first account (index 0)
const account = await wallet.getAccount(0)
const address = await account.getAddress()
console.log('Account 0 address:', address)

// Get the second account (index 1)
const account1 = await wallet.getAccount(1)
const address1 = await account1.getAddress()
console.log('Account 1 address:', address1)

// Get account by custom derivation path
const customAccount = await wallet.getAccountByPath("0'/0/5")
const customAddress = await customAccount.getAddress()
console.log('Custom account address:', customAddress)
```

### Checking Balances

```javascript
import WalletManagerSpark from '@wdk/wallet-spark'

// Assume wallet and account are already created
// Get native token balance
const balance = await account.getBalance()
console.log('Native balance:', balance)

// Get transaction history
const history = await account.getTransactionHistory()
console.log('Transaction history:', history)
```

### Sending Transactions

```javascript
// Send native tokens
const result = await account.sendTransaction({
  recipient: 'spark...', // Recipient's address
  amount: 1000000, // Amount to send
  memo: 'Payment' // Optional memo
})
console.log('Transaction hash:', result.hash)
console.log('Transaction fee:', result.fee)

// Get transaction fee estimate
const quote = await account.quoteSendTransaction({
  recipient: 'spark...',
  amount: 1000000
})
console.log('Estimated fee:', quote.fee)
```

### Message Signing and Verification

```javascript
// Sign a message
const message = 'Hello, Spark!'
const signature = await account.sign(message)
console.log('Signature:', signature)

// Verify a signature
const isValid = await account.verify(message, signature)
console.log('Signature valid:', isValid)
```

### Memory Management

```javascript
// Dispose wallet accounts to clear private keys from memory
account.dispose()

// Dispose entire wallet manager
wallet.dispose()
```

## 📚 API Reference

### Table of Contents

| Class | Description | Methods |
|-------|-------------|---------|
| [WalletManagerSpark](#walletmanagerspark) | Main class for managing Spark wallets. Extends `WalletManager` from `@wdk/wallet`. | [Constructor](#constructor), [Methods](#methods) |
| [WalletAccountSpark](#walletaccountspark) | Individual Spark wallet account implementation. Implements `IWalletAccount`. | [Constructor](#constructor-1), [Methods](#methods-1), [Properties](#properties) |

### WalletManagerSpark

The main class for managing Spark wallets.  
Extends `WalletManager` from `@wdk/wallet`.

#### Constructor

```javascript
new WalletManagerSpark(seed, config)
```

**Parameters:**
- `seed` (string | Uint8Array): BIP-39 mnemonic seed phrase or seed bytes
- `config` (object): Configuration object
  - `provider` (string): RPC endpoint URL
  - `network` (string, optional): 'mainnet' or 'testnet' (default: 'mainnet')
  - `timeout` (number, optional): Request timeout in milliseconds
  - `retryCount` (number, optional): Number of retry attempts for failed requests

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `initialize()` | Initializes the wallet manager and connects to provider | `Promise<void>` |
| `getAccount(index)` | Returns a wallet account at the specified index | `Promise<WalletAccountSpark>` |
| `getAccountByPath(path)` | Returns a wallet account at the specified BIP-44 derivation path | `Promise<WalletAccountSpark>` |
| `getFeeRates()` | Returns current fee rates for transactions | `Promise<{normal: number, fast: number}>` |
| `dispose()` | Disposes all wallet accounts, clearing private keys from memory | `void` |

##### `getAccount(index)`
Returns a wallet account at the specified index.

**Parameters:**
- `index` (number, optional): The index of the account to get (default: 0)

**Returns:** `Promise<WalletAccountSpark>` - The wallet account

**Example:**
```javascript
const account = await wallet.getAccount(0)
```

##### `getAccountByPath(path)`
Returns a wallet account at the specified BIP-44 derivation path.

**Parameters:**
- `path` (string): The derivation path (e.g., "0'/0/0")

**Returns:** `Promise<WalletAccountSpark>` - The wallet account

**Example:**
```javascript
const account = await wallet.getAccountByPath("0'/0/1")
```

##### `getFeeRates()`
Returns current fee rates for transactions.

**Returns:** `Promise<{normal: number, fast: number}>` - Object containing fee rates

**Example:**
```javascript
const feeRates = await wallet.getFeeRates()
console.log('Normal fee rate:', feeRates.normal)
```

##### `dispose()`
Disposes all wallet accounts and clears sensitive data from memory.

**Returns:** `void`

**Example:**
```javascript
wallet.dispose()
```

### WalletAccountSpark

Represents an individual Spark wallet account. Implements `IWalletAccount` from `@wdk/wallet`.

#### Constructor

```javascript
new WalletAccountSpark(seed, path, config)
```

**Parameters:**
- `seed` (string | Uint8Array): BIP-39 mnemonic seed phrase or seed bytes
- `path` (string): BIP-44 derivation path (e.g., "0'/0/0")
- `config` (object): Configuration object
  - `provider` (string): RPC endpoint URL
  - `network` (string, optional): 'mainnet' or 'testnet'
  - `timeout` (number, optional): Request timeout in milliseconds
  - `retryCount` (number, optional): Number of retry attempts

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getAddress()` | Returns the account's address | `Promise<string>` |
| `sign(message)` | Signs a message using the account's private key | `Promise<string>` |
| `verify(message, signature)` | Verifies a message signature | `Promise<boolean>` |
| `sendTransaction(tx)` | Sends a Spark transaction | `Promise<{hash: string, fee: number}>` |
| `quoteSendTransaction(tx)` | Estimates the fee for a transaction | `Promise<{fee: number}>` |
| `getBalance()` | Returns the native token balance | `Promise<number>` |
| `getTransactionHistory(options?)` | Returns the account's transaction history | `Promise<Transaction[]>` |
| `watchTransactions(callback)` | Subscribes to transaction updates | `Promise<() => void>` |
| `dispose()` | Disposes the wallet account, clearing private keys from memory | `void` |

##### `getAddress()`
Returns the account's address.

**Returns:** `Promise<string>` - The Spark address

**Example:**
```javascript
const address = await account.getAddress()
```

##### `sign(message)`
Signs a message using the account's private key.

**Parameters:**
- `message` (string): The message to sign

**Returns:** `Promise<string>` - The message signature

**Example:**
```javascript
const signature = await account.sign('Hello, Spark!')
```

##### `verify(message, signature)`
Verifies a message signature.

**Parameters:**
- `message` (string): The original message
- `signature` (string): The signature to verify

**Returns:** `Promise<boolean>` - True if the signature is valid

**Example:**
```javascript
const isValid = await account.verify('Hello, Spark!', signature)
```

##### `sendTransaction(tx)`
Sends a Spark transaction.

**Parameters:**
- `tx` (object): Transaction options
  - `recipient` (string): Recipient's Spark address
  - `amount` (number): Amount to send
  - `memo` (string, optional): Transaction memo
  - `fee` (number, optional): Custom fee amount
  - `nonce` (number, optional): Custom nonce value
  - `timeout` (number, optional): Transaction timeout in blocks

**Returns:** `Promise<{hash: string, fee: number}>`

##### `getTransactionHistory(options?)`
Returns the account's transaction history.

**Parameters:**
- `options` (object, optional): History options
  - `limit` (number, optional): Maximum number of transactions
  - `offset` (number, optional): Number of transactions to skip
  - `fromBlock` (number, optional): Starting block number
  - `toBlock` (number, optional): Ending block number

**Returns:** `Promise<Transaction[]>`

##### `quoteSendTransaction(tx)`
Estimates the fee for a transaction.

**Parameters:**
- `tx` (object): Same as sendTransaction options

**Returns:** `Promise<{fee: number}>`
- `fee`: Estimated transaction fee

**Example:**
```javascript
const quote = await account.quoteSendTransaction({
  recipient: 'spark...',
  amount: 1000000
})
```

##### `getBalance()`
Returns the native token balance.

**Returns:** `Promise<number>` - Account balance

**Example:**
```javascript
const balance = await account.getBalance()
```

##### `getTransactionHistory()`
Returns the account's transaction history.

**Returns:** `Promise<Transaction[]>` - Array of transactions

**Example:**
```javascript
const history = await account.getTransactionHistory()
```

##### `dispose()`
Disposes the wallet account and clears sensitive data from memory.

**Returns:** `void`

**Example:**
```javascript
account.dispose()
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `index` | `number` | The derivation path's index of this account |
| `path` | `string` | The full derivation path of this account |
| `network` | `string` | The current network ('mainnet' or 'testnet') |

## 🌐 Supported Networks

This package works with the Spark blockchain, including:

- **Spark Mainnet**
  - RPC: https://api.spark.com
  - Explorer: https://explorer.spark.com
- **Spark Testnet**
  - RPC: https://api.testnet.spark.com
  - Explorer: https://explorer.testnet.spark.com

## 🔒 Security Considerations

- **Seed Phrase Security**: 
  - Always store your seed phrase securely and never share it
  - Use strong entropy for seed generation
  - Keep backups in secure, offline locations

- **Private Key Management**: 
  - The package handles private keys internally with memory safety features
  - Keys are never stored on disk
  - Keys are cleared from memory when `dispose()` is called

- **Network Security**: 
  - Use trusted RPC endpoints
  - Consider running your own node for production
  - Verify SSL certificates when using SSL connections

- **Transaction Validation**:
  - Always verify recipient addresses
  - Double-check transaction amounts and fees
  - Wait for appropriate confirmation count based on amount

## 🛠️ Development

### Building

```bash
# Install dependencies
npm install

# Build TypeScript definitions
npm run build:types

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 💡 Examples

### Complete Wallet Setup

```javascript
import WalletManagerSpark from '@wdk/wallet-spark'

async function setupWallet() {
  // Use a BIP-39 seed phrase (replace with your own secure phrase)
  const seedPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'
  
  // Create wallet manager
  const wallet = new WalletManagerSpark(seedPhrase, {
    provider: 'https://api.spark.com',
    network: 'mainnet'
  })
  
  // Get first account
  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  console.log('Wallet address:', address)
  
  // Check balance
  const balance = await account.getBalance()
  console.log('Balance:', balance)
  
  return { wallet, account, address, balance }
}
```

## 📜 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🆘 Support

For support, please open an issue on the GitHub repository.

---

**Note**: This package is currently in beta. Please test thoroughly in development environments before using in production.