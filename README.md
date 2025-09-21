# @wdk/wallet-spark

**Note**: This package is currently in beta. Please test thoroughly in development environments before using in production.

A simple and secure package to manage BIP-44 wallets for the Spark blockchain. This package provides a clean API for creating, managing, and interacting with Spark wallets using BIP-39 seed phrases and Liquid Bitcoin (LBTC) derivation paths.

## 🔍 About WDK

This module is part of the [**WDK (Wallet Development Kit)**](https://wallet.tether.io/) project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control. 

For detailed documentation about the complete WDK ecosystem, visit [docs.wallet.tether.io](https://docs.wallet.tether.io).

## 🌟 Features

- **Liquid Bitcoin (LBTC) Derivation Paths**: Support for BIP-44 standard derivation paths (m/44'/998')
- **Multi-Account Management**: Create and manage multiple accounts from a single seed phrase
- **Transaction Management**: Send transactions and get fee estimates with zero fees
- **Lightning Network Integration**: Create invoices, pay Lightning invoices, and manage Lightning payments

## ⬇️ Installation

To install the `@wdk/wallet-spark` package, follow these instructions:

You can install it using npm:

```bash
npm install @wdk/wallet-spark
```

## 🚀 Quick Start

### Importing from `@wdk/wallet-spark`

1. WalletManagerSpark: Main class for managing wallets
2. WalletAccountSpark: Use this for full access accounts

### Creating a New Wallet

```javascript
import WalletManagerSpark from '@wdk/wallet-spark'

// Use a BIP-39 seed phrase (replace with your own secure phrase)
const seedPhrase = 'test only example nut use this real life secret phrase must random'

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
| `getAccountByPath(path)` | Returns a wallet account at a specific BIP-44 derivation path | `Promise<WalletAccountSpark>` |
| `getFeeRates()` | Returns current fee rates for transactions (always zero for Spark) | `Promise<FeeRates>` |
| `dispose()` | Disposes all wallet accounts, clearing private keys from memory | `void` |

##### `getAccount(index)`
Returns a Spark wallet account at the specified index using BIP-44 derivation path.

**Parameters:**
- `index` (number, optional): The index of the account to get (default: 0)

**Returns:** `Promise<WalletAccountSpark>` - The Spark wallet account

**Example:**
```javascript
const account = await wallet.getAccount(0)
const address = await account.getAddress()
console.log('Spark account address:', address)
```

**Note:** Uses derivation path pattern `m/44'/998'/0'/0/{index}` where 998 is the coin type for Liquid Bitcoin.

##### `getAccountByPath(path)`
Returns a Spark wallet account at a specific BIP-44 derivation path.

**Parameters:**
- `path` (string): The derivation path (e.g. "0'/0/0")

**Returns:** `Promise<WalletAccountSpark>` - The Spark wallet account

**Example:**
```javascript
const account = await wallet.getAccountByPath("0'/0/1")
const address = await account.getAddress()
console.log('Account address:', address)
```

**Note:** The path is relative to the base path `m/44'/998'/0'`

##### `getFeeRates()`
Returns current fee rates for Spark transactions from the network.

**Returns:** `Promise<FeeRates>` - Object containing fee rates in satoshis
- `normal`: Standard fee rate for normal confirmation speed (always 0)
- `fast`: Higher fee rate for faster confirmation (always 0)

**Example:**
```javascript
const feeRates = await wallet.getFeeRates()
console.log('Normal fee rate:', feeRates.normal, 'satoshis')
console.log('Fast fee rate:', feeRates.fast, 'satoshis')

// Use in transaction (fees are always 0 on Spark)
const result = await account.sendTransaction({
  to: 'spark1...',
  value: 1000000 // 0.01 BTC in satoshis
})
```

##### `dispose()`
Disposes all Spark wallet accounts and clears sensitive data from memory.

**Returns:** `void`

**Example:**
```javascript
wallet.dispose()
// All accounts and private keys are now securely wiped from memory
```

**Important Notes:**
- All Spark transactions have zero fees
- Network configuration is limited to predefined values
- Uses BIP-44 derivation paths with coin type 998 for Liquid Bitcoin

### WalletAccountSpark

Represents an individual Spark wallet account. Implements `IWalletAccount` from `@wdk/wallet`.

**Note**: WalletAccountSpark instances are created internally by `WalletManagerSpark.getAccount()` and are not intended to be constructed directly.

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getAddress()` | Returns the account's Spark address | `Promise<string>` |
| `sign(message)` | Signs a message using the account's identity key | `Promise<string>` |
| `verify(message, signature)` | Verifies a message signature | `Promise<boolean>` |
| `sendTransaction(tx)` | Sends a Spark transaction | `Promise<{hash: string, fee: bigint}>` |
| `quoteSendTransaction(tx)` | Estimates transaction fee (always 0) | `Promise<{fee: bigint}>` |
| `transfer(options)` | Transfers tokens to another address | `Promise<{hash: string, fee: bigint}>` |
| `quoteTransfer(options)` | Quotes the costs of a transfer operation | `Promise<{fee: bigint}>` |
| `getBalance()` | Returns the native token balance in satoshis | `Promise<bigint>` |
| `getTokenBalance(tokenAddress)` | Returns the balance for a specific token | `Promise<bigint>` |
| `getTransactionReceipt(hash)` | Gets the transaction receipt for a given transaction hash | `Promise<{hash: string, blockNumber: number, status: string, gasUsed: number} | null>` |
| `getTransfers(options?)` | Returns the account's transfer history | `Promise<Array<{hash: string, from: string, to: string, value: bigint, timestamp: number, direction: string}>>` |
| `getSingleUseDepositAddress()` | Generates a single-use Bitcoin deposit address | `Promise<string>` |
| `getUtxosForDepositAddress(depositAddress, limit?, offset?)` | Returns confirmed utxos for a deposit address | `Promise<string[]>` |
| `claimDeposit(txId)` | Claims a Bitcoin deposit to the wallet | `Promise<Array<{id: string, value: bigint, address: string}> | undefined>` |
| `getLatestDepositTxId(depositAddress)` | Checks for a confirmed Bitcoin deposit to the specified address | `Promise<string | null>` |
| `withdraw({to, value})` | Withdraws funds to a Bitcoin address | `Promise<{id: string, to: string, value: number, status: string, fee: number} | null | undefined>` |
| `createLightningInvoice({value, memo?})` | Creates a Lightning invoice | `Promise<{id: string, invoice: string, status: string, value: number, memo?: string}>` |
| `getLightningReceiveRequest(invoiceId)` | Gets Lightning receive request by id | `Promise<{id: string, invoice: string, status: string, value: number, memo?: string} | null>` |
| `payLightningInvoice({invoice, maxFeeSats})` | Pays a Lightning invoice | `Promise<{id: string, invoice: string, status: string, fee: number}>` |
| `getLightningSendFeeEstimate({invoice})` | Gets fee estimate for Lightning payments | `Promise<number>` |
| `toReadOnlyAccount()` | Creates a read-only version of this account | `Promise<WalletAccountReadOnlySpark>` |
| `dispose()` | Disposes the wallet account, clearing private keys | `void` |

##### `getAddress()`
Returns the account's Spark network address.

**Returns:** `Promise<string>` - The account's Spark address

**Example:**
```javascript
const address = await account.getAddress()
console.log('Spark address:', address) // spark1...
```
##### `sign(message)`
Signs a message using the account's identity key.

**Parameters:**
- `message` (string): Message to sign

**Returns:** `Promise<string>` - Signature as hex string

**Example:**
```javascript
const signature = await account.sign('Hello Spark!')
console.log('Signature:', signature)
```
##### `verify(message, signature)`
Verifies a message signature using the account's identity key.

**Parameters:**
- `message` (string): Original message
- `signature` (string): Signature as hex string

**Returns:** `Promise<boolean>` - True if signature is valid

**Example:**
```javascript
const isValid = await account.verify('Hello Spark!', signature)
console.log('Signature valid:', isValid)
```

##### `sendTransaction(tx)`
Sends a Spark transaction and broadcasts it to the network.

**Parameters:**
- `tx` (object): The transaction object
  - `to` (string): Recipient's Spark address
  - `value` (number): Amount in satoshis

**Returns:** `Promise<{hash: string, fee: bigint}>` - Object containing hash and fee (fee is always 0)

**Example:**
```javascript
const result = await account.sendTransaction({
  to: 'spark1...',
  value: 1000000 // 0.01 BTC in satoshis
})
console.log('Transaction hash:', result.hash)
console.log('Fee paid:', Number(result.fee), 'satoshis') // Always 0
```

##### `quoteSendTransaction(tx)`
Estimates the fee for a Spark transaction without broadcasting it.

**Parameters:**
- `tx` (object): Same as sendTransaction parameters
  - `to` (string): Recipient's Spark address
  - `value` (number): Amount in satoshis

**Returns:** `Promise<{fee: bigint}>` - Object containing estimated fee (always 0)

**Example:**
```javascript
const quote = await account.quoteSendTransaction({
  to: 'spark1...',
  value: 1000000 // 0.01 BTC in satoshis
})
console.log('Estimated fee:', Number(quote.fee), 'satoshis') // Always 0
console.log('Estimated fee in BTC:', Number(quote.fee) / 1e8)
```

##### `transfer(options)`
Transfers tokens to another address.

**Parameters:**
- `options` (TransferOptions): Transfer options object

**Returns:** `Promise<{hash: string, fee: bigint}>` - Transfer result containing transaction details

**Example:**
```javascript
const result = await account.transfer({
  to: 'spark1...',
  value: 1000000 // Amount in satoshis
})
console.log('Transfer hash:', result.hash)
```

##### `quoteTransfer(options)`
Quotes the costs of a transfer operation without executing it.

**Parameters:**
- `options` (TransferOptions): Transfer options object

**Returns:** `Promise<{fee: bigint}>` - Transfer quote without transaction hash

**Example:**
```javascript
const quote = await account.quoteTransfer({
  to: 'spark1...',
  value: 1000000
})
console.log('Transfer fee estimate:', Number(quote.fee))
```

##### `getBalance()`
Returns the account's native token balance in satoshis.

**Returns:** `Promise<bigint>` - Balance in satoshis

**Example:**
```javascript
const balance = await account.getBalance()
console.log('Balance:', balance, 'satoshis')
console.log('Balance in BTC:', Number(balance) / 1e8)
```

##### `getTokenBalance(tokenAddress)`
Returns the balance for a specific token.

**Parameters:**
- `tokenAddress` (string): Token contract address

**Returns:** `Promise<bigint>` - Token balance in base unit

**Example:**
```javascript
const tokenBalance = await account.getTokenBalance('token_address...')
console.log('Token balance:', tokenBalance)
```

##### `getTransactionReceipt(hash)`
Gets the transaction receipt for a given transaction hash.

**Parameters:**
- `hash` (string): Transaction hash

**Returns:** `Promise<{hash: string, blockNumber: number, status: string, gasUsed: number} | null>` - Transaction receipt details, or null if not found

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

**Returns:** `Promise<Array<{hash: string, from: string, to: string, value: bigint, timestamp: number, direction: string}>>` - Array of transfer objects

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

##### `getUtxosForDepositAddress(depositAddress, limit?, offset?)`
Returns confirmed utxos for a given Spark deposit address.

**Parameters:**
- `depositAddress` (string): The deposit address to query
- `limit` (number, optional): Maximum number of utxos to return (default: 100)
- `offset` (number, optional): Pagination offset (default: 0)

**Returns:** `Promise<string[]>` - List of confirmed utxos

**Example:**
```javascript
const utxos = await account.getUtxosForDepositAddress(depositAddress, 50, 0)
console.log('Confirmed UTXOs:', utxos)
```

##### `claimDeposit(txId)`
Claims a Bitcoin deposit to add funds to the Spark wallet.

**Parameters:**
- `txId` (string): Bitcoin transaction ID of the deposit

**Returns:** `Promise<Array<{id: string, value: bigint, address: string}> | undefined>` - Wallet leaves created from the deposit

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

**Returns:** `Promise<{id: string, to: string, value: number, status: string, fee: number} | null | undefined>` - Withdrawal request details

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

**Returns:** `Promise<{id: string, invoice: string, status: string, value: number, memo?: string}>` - Lightning invoice details

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

**Returns:** `Promise<{id: string, invoice: string, status: string, value: number, memo?: string} | null>` - Invoice details, or null if not found

**Example:**
```javascript
const request = await account.getLightningReceiveRequest(invoiceId)
if (request) {
  console.log('Invoice status:', request.status)
}
```

##### `payLightningInvoice({invoice, maxFeeSats})`
Pays a Lightning invoice.

**Parameters:**
- `invoice` (string): BOLT11 Lightning invoice
- `maxFeeSats` (number): Maximum fee willing to pay in satoshis

**Returns:** `Promise<{id: string, invoice: string, status: string, fee: number}>` - Payment details

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
Disposes the wallet account, securely erasing the private key from memory.

**Returns:** `void`

**Example:**
```javascript
account.dispose()
// Private key is now securely wiped from memory
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


## 📜 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🆘 Support

For support, please open an issue on the GitHub repository.

---