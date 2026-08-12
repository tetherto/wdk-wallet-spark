# @tetherto/wdk-wallet-spark

[![npm version](https://img.shields.io/npm/v/%40tetherto%2Fwdk-wallet-spark?style=flat-square)](https://www.npmjs.com/package/@tetherto/wdk-wallet-spark)
[![npm downloads](https://img.shields.io/npm/dw/%40tetherto%2Fwdk-wallet-spark?style=flat-square)](https://www.npmjs.com/package/@tetherto/wdk-wallet-spark)
[![license](https://img.shields.io/npm/l/%40tetherto%2Fwdk-wallet-spark?style=flat-square)](https://github.com/tetherto/wdk-wallet-spark/blob/main/LICENSE)
[![docs](https://img.shields.io/badge/docs-docs.wdk.tether.io-0A66C2?style=flat-square)](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-spark)

**Note**: This package is currently in beta. Please test thoroughly in development environments before using in production.

A wallet module for creating, managing, and interacting with Spark accounts using BIP-39 seed phrases and BIP-44 derivation paths. It supports Spark transfers and invoices, token transfers, Lightning payments, and Bitcoin layer 1 deposits and withdrawals.

## About WDK

This module is part of the [**WDK (Wallet Development Kit)**](https://docs.wdk.tether.io/) project, which empowers developers to build secure, non-custodial wallets with unified blockchain access, stateless architecture, and complete user control.

For detailed documentation about the complete WDK ecosystem, visit [docs.wdk.tether.io](https://docs.wdk.tether.io).

## Installation

```bash
npm install @tetherto/wdk-wallet-spark
```

## Quick Start

```javascript
import WalletManagerSpark from '@tetherto/wdk-wallet-spark'

const seedPhrase = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'

const wallet = new WalletManagerSpark(seedPhrase, {
  network: 'MAINNET'
})

const account = await wallet.getAccount(0)
const address = await account.getAddress()
console.log('Address:', address)

wallet.dispose()
```

The mnemonic above is for development only. Use a securely generated seed phrase before handling funds.

The Spark SDK selects and manages network endpoints; this module does not expose a custom RPC provider. Optional wallet configuration includes SparkScan balance polling, one sync-and-retry attempt after failed sends or Lightning payments, and Spark SDK logging. See the [Configuration guide](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-spark/configuration) for setup details.

## Key Capabilities

- **BIP-44 Account Derivation**: Derive indexed Spark accounts from one seed phrase using Spark coin type 998; custom derivation paths are not supported
- **Spark Transfers**: Quote and send fee-free sats transfers through the unified wallet API
- **Token and Invoice Support**: Query and transfer Spark tokens, and create or pay Spark sats and token invoices
- **Lightning Payments**: Create and pay BOLT11 invoices, quote routing fees, and inspect payment status
- **Bitcoin Deposits and Withdrawals**: Use single-use or reusable deposit addresses, claim or refund deposits, and quote cooperative withdrawals to Bitcoin layer 1
- **Balances and History**: Query sats and token balances, inspect Spark transfer history, and optionally use SparkScan-backed balance polling
- **Read-Only Accounts and Message Signing**: Monitor an address without private keys, sign messages, and verify signatures
- **Operational Controls**: Enable Spark SDK logging, sync wallet state and retry failed sends or Lightning payments once, and clear private key material when done

## Compatibility

- **Spark Networks**: `MAINNET`, `TESTNET`, `SIGNET`, and `REGTEST` network values supported by the Spark SDK; `MAINNET` is the default
- **Node.js**: Default package entry point backed by `@buildonspark/spark-sdk`
- **Bare and Pear**: Dedicated runtime entry points backed by `@buildonspark/bare`
- **SparkScan**: Optional balance polling on `MAINNET` and `REGTEST`

## Documentation

| Topic | Description | Link |
|-------|-------------|------|
| Overview | Module overview and feature summary | [Wallet Spark Overview](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-spark) |
| Usage | End-to-end integration walkthrough | [Wallet Spark Usage](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-spark/usage) |
| Configuration | Network, SparkScan, and retry configuration | [Wallet Spark Configuration](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-spark/configuration) |
| API Reference | Complete class and type reference | [Wallet Spark API Reference](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-spark/api-reference) |

## Community

Join the [WDK Discord](https://discord.gg/arYXDhHB2w) to connect with other developers.

## Support

For support, please [open an issue](https://github.com/tetherto/wdk-wallet-spark/issues) on GitHub or reach out via [email](mailto:wallet-info@tether.io).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
