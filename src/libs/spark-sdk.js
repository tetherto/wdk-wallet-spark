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

let SparkWallet, Network, ValidationError, DefaultSparkSigner

// Import the appropriate module based on environment
// Use direct string literals so bundler can statically analyze both paths
const imports = await import('@buildonspark/spark-sdk/bare')

DefaultSparkSigner = imports.DefaultSparkSigner
SparkWallet = imports.SparkWallet
Network = imports.Network
ValidationError = imports.ValidationError

export { SparkWallet, Network, ValidationError, DefaultSparkSigner }
