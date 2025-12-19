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
'use strict'

/** @typedef {import('@buildonspark/spark-sdk').NetworkType} NetworkType */
/** @typedef {import('@buildonspark/spark-sdk').WithdrawParams} WithdrawParams */
/** @typedef {import('@buildonspark/spark-sdk').CreateLightningInvoiceParams} CreateLightningInvoiceParams */
/** @typedef {import('@buildonspark/spark-sdk/types').WalletLeaf} WalletLeaf */
/** @typedef {import('@buildonspark/spark-sdk/types').CoopExitRequest} CoopExitRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').CoopExitFeeQuote} CoopExitFeeQuote */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningReceiveRequest} LightningReceiveRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').LightningSendRequest} LightningSendRequest */
/** @typedef {import('@buildonspark/spark-sdk/types').WalletTransfer} SparkTransfer */

/** @typedef {import('@sparkscan/api-node-sdk-client').TxV1Response} SparkTransactionReceipt */

/** @typedef {import('@tetherto/wdk-wallet').FeeRates} FeeRates */
/** @typedef {import('@tetherto/wdk-wallet').KeyPair} KeyPair */
/** @typedef {import('@tetherto/wdk-wallet').TransactionResult} TransactionResult */
/** @typedef {import('@tetherto/wdk-wallet').TransferOptions} TransferOptions */
/** @typedef {import('@tetherto/wdk-wallet').TransferResult} TransferResult */

/** @typedef {import('./src/wallet-account-read-only-spark.js').SparkTransaction} SparkTransaction */
/** @typedef {import('./src/wallet-account-read-only-spark.js').SparkWalletConfig} SparkWalletConfig */

/** @typedef {import('./src/wallet-account-spark.js').WithdrawOptions} WithdrawOptions */
/** @typedef {import('./src/wallet-account-spark.js').QuoteWithdrawOptions} QuoteWithdrawOptions */
/** @typedef {import('./src/wallet-account-spark.js').PayLightningInvoiceOptions} PayLightningInvoiceOptions */
/** @typedef {import('./src/wallet-account-spark.js').GetLightningSendFeeEstimateOptions} GetLightningSendFeeEstimateOptions */
/** @typedef {import('./src/wallet-account-spark.js').GetTransfersOptions} GetTransfersOptions */
/** @typedef {import('./src/wallet-account-spark.js').RefundStaticDepositOptions} RefundStaticDepositOptions */

export { default } from './src/wallet-manager-spark.js'

export { default as WalletAccountReadOnlySpark } from './src/wallet-account-read-only-spark.js'

export { default as WalletAccountSpark } from './src/wallet-account-spark.js'
