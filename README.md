# @wdk/wallet-spark

A simple and secure package to manage BIP-44 wallets for the Spark blockchain. This package provides a clean API for creating, managing, and interacting with Spark wallets using BIP-39 seed phrases and Liquid Bitcoin (LBTC) derivation paths.

## 🔍 About WDK

This module is part of the [**WDK (Wallet Development Kit)**](https://wallet.tether.io/) project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control. 

For detailed documentation about the complete WDK ecosystem, visit [docs.wallet.tether.io](https://docs.wallet.tether.io).

## 🌟 Features

- **BIP-39 Seed Phrase Support**: Generate and validate BIP-39 mnemonic seed phrases
- **Liquid Bitcoin (LBTC) Derivation Paths**: Support for BIP-44 standard derivation paths (m/44'/998')
- **Multi-Account Management**: Create and manage multiple accounts from a single seed phrase
- **Bitcoin Address Support**: Generate and manage Bitcoin addresses for Spark network
- **Lightning Network Integration**: Create invoices, pay Lightning invoices, and manage Lightning payments
- **Deposit/Withdrawal Management**: Handle on-chain Bitcoin deposits and withdrawals
- **Message Signing**: Sign and verify messages using wallet cryptography
- **Transaction Management**: Send transactions and get fee estimates
- **Balance Management**: Query native token and Lightning balances
- **TypeScript Support**: Full TypeScript definitions included
- **Memory Safety**: Secure private key management with memory-safe implementation
- **Network Support**: Support for MAINNET, TESTNET, and REGTEST networks

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
import WalletManagerSpark from '@wdk/wallet-spark'

// Use a BIP-39 seed phrase (replace with your own secure phrase)
const seedPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

// Create wallet manager with Spark network configuration
const wallet = new WalletManagerSpark(seedPhrase, {
  network: 'MAINNET' // 'MAINNET', 'TESTNET', or 'REGTEST'
})

// Get a full access account
const account = await wallet.getAccount(0)

// Get the account's Spark address
const address = await account.getAddress()
console.log('Account address:', address)
```

**Note**: The Spark wallet integrates with the Spark network using the `@buildonspark/spark-sdk`. Network configuration is limited to predefined networks, and there's no custom RPC provider option.

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

// Get the third account (index 2)
const account2 = await wallet.getAccount(2)
const address2 = await account2.getAddress()
console.log('Account 2 address:', address2)

// Note: All accounts use BIP-44 derivation paths with pattern:
// m/44'/998'/0'/0/{index} where 998 is the coin type for Liquid Bitcoin
```

**Important Note**: Custom derivation paths via `getAccountByPath()` are not supported on the Spark blockchain. Only indexed accounts using the standard BIP-44 pattern are available.

### Checking Balances

```javascript
import WalletManagerSpark from '@wdk/wallet-spark'

// Assume wallet and account are already created
// Get native token balance (in satoshis)
const balance = await account.getBalance()
console.log('Native balance:', balance, 'satoshis')

// Get transfer history (default: 10 most recent transfers)
const transfers = await account.getTransfers()
console.log('Transfer history:', transfers)

// Get transfer history with options
const recentTransfers = await account.getTransfers({
  direction: 'all', // 'all', 'incoming', or 'outgoing'
  limit: 20,        // Number of transfers to fetch
  skip: 0           // Number of transfers to skip
})
console.log('Recent transfers:', recentTransfers)

// Get only incoming transfers
const incomingTransfers = await account.getTransfers({
  direction: 'incoming',
  limit: 5
})
console.log('Incoming transfers:', incomingTransfers)
```

### Sending Transactions

```javascript
// Send native tokens (satoshis)
const result = await account.sendTransaction({
  to: 'spark1...', // Recipient's Spark address
  value: 1000000   // Amount in satoshis
})
console.log('Transaction hash:', result.hash)
console.log('Transaction fee:', result.fee) // Always 0 for Spark transactions

// Get transaction fee estimate
const quote = await account.quoteSendTransaction({
  to: 'spark1...',
  value: 1000000
})
console.log('Estimated fee:', quote.fee) // Always returns 0

// Example with different amounts
const smallTransaction = await account.sendTransaction({
  to: 'spark1...',
  value: 100000 // 0.001 BTC in satoshis
})

const largeTransaction = await account.sendTransaction({
  to: 'spark1...',
  value: 10000000 // 0.1 BTC in satoshis
})
```
**Important Notes:**
- Spark transactions have zero fees (`fee: 0`)
- Memo/description functionality is not supported in `sendTransaction`
- All amounts are specified in satoshis (1 BTC = 100,000,000 satoshis)
- Addresses should be valid Spark network addresses

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
- `config` (object, optional): Configuration object
  - `network` (string, optional): 'MAINNET', 'TESTNET', or 'REGTEST' (default: 'MAINNET')


#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getAccount(index)` | Returns a wallet account at the specified index | `Promise<WalletAccountSpark>` |
| `getFeeRates()` | Returns current fee rates for transactions (always zero for Spark) | `Promise<{normal: number, fast: number}>` |
| `dispose()` | Disposes all wallet accounts, clearing private keys from memory | `void` |

##### `getAccount(index)`
Returns a wallet account at the specified index using BIP-44 derivation path.

**Parameters:**
- `index` (number, optional): The index of the account to get (default: 0)

**Returns:** `Promise<WalletAccountSpark>` - The wallet account

**Example:**
```javascript
const account = await wallet.getAccount(0)
const account1 = await wallet.getAccount(1)
```

**Note:** Uses derivation path pattern `m/44'/998'/0'/0/{index}` where 998 is the coin type for Liquid Bitcoin.

##### `getFeeRates()`
Returns current fee rates for transactions. On Spark network, transactions have zero fees.

**Returns:** `Promise<{normal: number, fast: number}>` - Object containing fee rates (always `{normal: 0, fast: 0}`)

**Example:**
```javascript
const feeRates = await wallet.getFeeRates()
console.log('Normal fee rate:', feeRates.normal) // Always 0
console.log('Fast fee rate:', feeRates.fast)     // Always 0
```

##### `dispose()`
Disposes all wallet accounts and clears sensitive data from memory.

**Returns:** `void`

**Example:**
```javascript
wallet.dispose()
```

**Important Notes:**
- `getAccountByPath(path)` is not supported and will throw an error
- Custom derivation paths are not available - only indexed accounts
- All Spark transactions have zero fees
- Network configuration is limited to predefined values

### WalletAccountSpark

Represents an individual Spark wallet account. Implements `IWalletAccount` from `@wdk/wallet`.

**Note**: WalletAccountSpark instances are created internally by `WalletManagerSpark.getAccount()` and are not intended to be constructed directly.

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getAddress()` | Returns the account's Spark address | `Promise<string>` |
| `sign(message)` | Signs a message using the account's identity key | `Promise<string>` |
| `verify(message, signature)` | Verifies a message signature | `Promise<boolean>` |
| `sendTransaction(tx)` | Sends a Spark transaction | `Promise<{hash: string, fee: number}>` |
| `quoteSendTransaction(tx)` | Estimates transaction fee (always 0) | `Promise<{fee: number}>` |
| `getBalance()` | Returns the native token balance in satoshis | `Promise<number>` |
| `getTransfers(options?)` | Returns the account's transfer history | `Promise<Transfer[]>` |
| `getSingleUseDepositAddress()` | Generates a single-use Bitcoin deposit address | `Promise<string>` |
| `claimDeposit(txId)` | Claims a Bitcoin deposit to the wallet | `Promise<WalletLeaf[]>` |
| `withdraw({to, value})` | Withdraws funds to a Bitcoin address | `Promise<CoopExitRequest>` |
| `createLightningInvoice({value, memo?})` | Creates a Lightning invoice | `Promise<LightningReceiveRequest>` |
| `payLightningInvoice({invoice, maxFeeSats})` | Pays a Lightning invoice | `Promise<LightningSendRequest>` |
| `toReadOnlyAccount()` | Creates a read-only version of this account | `Promise<WalletAccountReadOnlySpark>` |
| `dispose()` | Disposes the wallet account, clearing private keys | `void` |
##### `getAddress()`
Returns the account's Spark network address.

**Returns:** `Promise<string>` - The Spark address

**Example:**
```javascript
const address = await account.getAddress()
console.log('Spark address:', address)
```
##### `sign(message)`
Signs a message using the account's identity key.

**Parameters:**
- `message` (string): The message to sign

**Returns:** `Promise<string>` - The message signature

**Example:**
```javascript
const signature = await account.sign('Hello, Spark!')
console.log('Signature:', signature)
```

##### `verify(message, signature)`
Verifies a message signature against the account's identity key.

**Parameters:**
- `message` (string): The original message
- `signature` (string): The signature to verify

**Returns:** `Promise<boolean>` - True if the signature is valid

**Example:**
```javascript
const isValid = await account.verify('Hello, Spark!', signature)
console.log('Signature valid:', isValid)
```

##### `sendTransaction({to, value})`
Sends a Spark transaction.

**Parameters:**
- `to` (string): Recipient's Spark address
- `value` (number): Amount in satoshis

**Returns:** `Promise<{hash: string, fee: number}>` (fee is always 0)

**Example:**
```javascript
const result = await account.sendTransaction({
  to: 'spark1...',
  value: 1000000
})
```

##### `quoteSendTransaction({to, value})`
Estimates the fee for a Spark transaction (always returns 0).

**Parameters:**
- `to` (string): Recipient's Spark address
- `value` (number): Amount in satoshis

**Returns:** `Promise<{fee: number}>` - Fee estimate (always 0)

**Example:**
```javascript
const quote = await account.quoteSendTransaction({
  to: 'spark1...',
  value: 1000000
})
console.log('Estimated fee:', quote.fee) // Always 0
```

##### `transfer(options)`
Transfers tokens to another address. Not supported on Spark blockchain.

**Parameters:**
- `options` (object): Transfer options

**Throws:** Error - "Not supported on Spark blockchain"

##### `quoteTransfer(options)`
Quotes the costs of a transfer operation. Not supported on Spark blockchain.

**Parameters:**
- `options` (object): Transfer options

**Throws:** Error - "Not supported on Spark blockchain"

##### `getBalance()`
Returns the account's native token balance in satoshis.

**Returns:** `Promise<number>` - Balance in satoshis

**Example:**
```javascript
const balance = await account.getBalance()
console.log('Balance:', balance, 'satoshis')
```

##### `getTokenBalance(tokenAddress)`
Returns the balance for a specific token. Not supported on Spark blockchain.

**Parameters:**
- `tokenAddress` (string): Token contract address

**Throws:** Error - "Not supported on Spark blockchain"

##### `getTransactionReceipt(hash)`
Gets the transaction receipt for a given transaction hash.

**Parameters:**
- `hash` (string): Transaction hash

**Returns:** `Promise<SparkTransactionReceipt>` - Transaction receipt details

**Example:**
```javascript
const receipt = await account.getTransactionReceipt('0x...')
console.log('Transaction receipt:', receipt)
```

##### `getTransfers(options?)`
Returns the account's transfer history with filtering options.

**Parameters:**
- `options` (object, optional): Filter options
  - `direction` (string): 'all', 'incoming', or 'outgoing' (default: 'all')
  - `limit` (number): Maximum transfers to return (default: 10)
  - `skip` (number): Number of transfers to skip (default: 0)

**Returns:** `Promise<Transfer[]>` - Array of transfer objects

**Example:**
```javascript
const transfers = await account.getTransfers({
  direction: 'incoming',
  limit: 5
})
console.log('Recent incoming transfers:', transfers)
```

##### `getSingleUseDepositAddress()`
Generates a single-use Bitcoin deposit address for funding the Spark wallet.

**Returns:** `Promise<string>` - Bitcoin deposit address

**Example:**
```javascript
const depositAddress = await account.getSingleUseDepositAddress()
console.log('Send Bitcoin to:', depositAddress)
```

##### `claimDeposit(txId)`
Claims a Bitcoin deposit to add funds to the Spark wallet.

**Parameters:**
- `txId` (string): Bitcoin transaction ID of the deposit

**Returns:** `Promise<WalletLeaf[] | undefined>` - Wallet leaves created from the deposit

**Example:**
```javascript
const leaves = await account.claimDeposit('bitcoin_tx_id...')
console.log('Claimed deposit:', leaves)
```

##### `getLatestDepositTxId(depositAddress)`
Checks for a confirmed Bitcoin deposit to the specified address.

**Parameters:**
- `depositAddress` (string): Bitcoin deposit address to check

**Returns:** `Promise<string | null>` - Transaction ID if found, null otherwise

**Example:**
```javascript
const txId = await account.getLatestDepositTxId(depositAddress)
if (txId) {
  console.log('Found deposit:', txId)
}
```

##### `withdraw({to, value})`
Withdraws funds from the Spark network to an on-chain Bitcoin address.

**Parameters:**
- `to` (string): Bitcoin address to withdraw to
- `value` (number): Amount in satoshis

**Returns:** `Promise<CoopExitRequest | null | undefined>` - Withdrawal request details

**Example:**
```javascript
const withdrawal = await account.withdraw({
  to: 'bc1q...',
  value: 1000000
})
console.log('Withdrawal request:', withdrawal)
```

##### `createLightningInvoice({value, memo?})`
Creates a Lightning invoice for receiving payments.

**Parameters:**
- `value` (number): Amount in satoshis
- `memo` (string, optional): Invoice description

**Returns:** `Promise<LightningReceiveRequest>` - Lightning invoice details

**Example:**
```javascript
const invoice = await account.createLightningInvoice({
  value: 100000,
  memo: 'Payment for services'
})
console.log('Invoice:', invoice.invoice)
```

##### `getLightningReceiveRequest(invoiceId)`
Gets details of a previously created Lightning receive request.

**Parameters:**
- `invoiceId` (string): Invoice ID

**Returns:** `Promise<LightningReceiveRequest>` - Invoice details

**Example:**
```javascript
const request = await account.getLightningReceiveRequest(invoiceId)
console.log('Invoice status:', request.status)
```

##### `payLightningInvoice({invoice, maxFeeSats})`
Pays a Lightning invoice.

**Parameters:**
- `invoice` (string): BOLT11 Lightning invoice
- `maxFeeSats` (number): Maximum fee willing to pay in satoshis

**Returns:** `Promise<LightningSendRequest>` - Payment details

**Example:**
```javascript
const payment = await account.payLightningInvoice({
  invoice: 'lnbc...',
  maxFeeSats: 1000
})
console.log('Payment result:', payment)
```

##### `getLightningSendFeeEstimate({invoice})`
Estimates the fee for paying a Lightning invoice.

**Parameters:**
- `invoice` (string): BOLT11 Lightning invoice

**Returns:** `Promise<number>` - Estimated fee in satoshis

**Example:**
```javascript
const feeEstimate = await account.getLightningSendFeeEstimate({
  invoice: 'lnbc...'
})
console.log('Estimated Lightning fee:', feeEstimate, 'satoshis')
```

##### `toReadOnlyAccount()`
Creates a read-only version of this account that can query data but not sign transactions.

**Returns:** `Promise<WalletAccountReadOnlySpark>` - Read-only account instance

**Example:**
```javascript
const readOnlyAccount = await account.toReadOnlyAccount()
const balance = await readOnlyAccount.getBalance()
```

##### `cleanupConnections()`
Cleans up network connections and resources.

**Returns:** `Promise<void>`

**Example:**
```javascript
await account.cleanupConnections()
```

##### `dispose()`
Disposes the wallet account, securely erasing private keys from memory.

**Returns:** `void`

**Example:**
```javascript
account.dispose()
// Private keys are now cleared from memory
```

#### Properties


| Property | Type | Description |
|----------|------|-------------|
| `index` | `number` | The derivation path index of this account |
| `path` | `string` | The full BIP-44 derivation path |
| `keyPair` | `KeyPair` | The account's public and private key pair |


## 🌐 Supported Networks

This package works with the Spark blockchain through the `@buildonspark/spark-sdk`. The following networks are supported:

- **MAINNET** - Spark production network
- **TESTNET** - Spark test network  
- **REGTEST** - Spark regression test network (for development)

### Network Configuration

Networks are configured using the `network` parameter in the wallet configuration:

```javascript
import WalletManagerSpark from '@wdk/wallet-spark'

// Mainnet (default)
const mainnetWallet = new WalletManagerSpark(seedPhrase, {
  network: 'MAINNET' // This is the default
})

// Testnet
const testnetWallet = new WalletManagerSpark(seedPhrase, {
  network: 'TESTNET'
})

// Regtest (for development)
const regtestWallet = new WalletManagerSpark(seedPhrase, {
  network: 'REGTEST'
})
```

**Important Notes:**
- Network connections are handled internally by the Spark SDK
- No custom RPC endpoints are supported - the SDK manages all network communication
- Network selection affects derivation paths and transaction routing
- Default network is `'MAINNET'` if not specified

## 🔒 Security Considerations

- **Seed Phrase Security**: 
  - Always store your seed phrase securely and never share it
  - Use strong entropy for seed generation
  - Keep backups in secure, offline locations

- **Private Key Management**: 
  - The package handles private keys internally with memory safety features
  - Identity keys are managed securely by the underlying Spark signer
  - Keys are never stored on disk
  - Keys are cleared from memory when `dispose()` is called

- **Network Security**: 
  - The Spark SDK handles all network communication internally
  - Network connections are managed by the `@buildonspark/spark-sdk`
  - No custom RPC configuration is needed or supported
  - Trust the Spark network's built-in security mechanisms

- **Transaction Validation**:
  - Always verify recipient Spark addresses before sending
  - Double-check transaction amounts (in satoshis)
  - Spark transactions have zero fees, so no fee validation is needed
  - Transactions are final once broadcast to the Spark network

- **Lightning Network Security**:
  - Verify Lightning invoice details before payment
  - Set appropriate maximum fee limits for Lightning payments
  - Be aware that Lightning payments are typically instant and irreversible
  - Store Lightning invoices securely if needed for record-keeping

- **Deposit/Withdrawal Security**:
  - Verify Bitcoin addresses when withdrawing to on-chain
  - Understand withdrawal timing and confirmation requirements
  - Only claim deposits from trusted Bitcoin transactions
  - Monitor deposit addresses for expected transactions only

- **Memory Management**:
  - Always call `dispose()` on accounts and wallets when finished
  - The Spark signer automatically clears sensitive data
  - Avoid keeping references to disposed wallet instances
  - Use proper error handling to ensure cleanup even on failures

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