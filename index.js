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

/** @typedef {import('./src/wallet-account-spark.js').default} WalletAccountSpark */
/** @typedef {import('./src/wallet-account-spark.js').KeyPair} KeyPair */
/** @typedef {import('./src/wallet-account-spark.js').SparkTransaction} SparkTransaction */

/** @typedef {import('./src/wallet-account-spark.js').WalletLeaf} WalletLeaf */
/** @typedef {import('./src/wallet-account-spark.js').CoopExitRequest} CoopExitRequest */
/** @typedef {import('./src/wallet-account-spark.js').LightningReceiveRequest} LightningReceiveRequest */
/** @typedef {import('./src/wallet-account-spark.js').LightningSendRequest} LightningSendRequest */

export { default } from './src/wallet-manager-spark.js'
