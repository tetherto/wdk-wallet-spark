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

// Get Spark SDK imports based on the runtime environment
let SparkWallet, DefaultSparkSigner, Network, ValidationError

// Initialize imports immediately and ensure they're available
async function initializeImports () {
  try {
    if (typeof globalThis.Bare !== 'undefined') {
      // In bare environment, import from bare
      const module = await import('@buildonspark/bare')
      SparkWallet = module.SparkWallet
      DefaultSparkSigner = module.BareSparkSigner
      Network = module.Network
      ValidationError = module.ValidationError
    } else {
      // In regular environment, import from regular SDK
      const module = await import('@buildonspark/spark-sdk')
      SparkWallet = module.SparkWallet
      DefaultSparkSigner = module.DefaultSparkSigner
      Network = module.Network
      ValidationError = module.ValidationError
    }
  } catch (error) {
    console.error('Failed to initialize Spark imports:', error)
    throw error
  }
}

// Start initialization immediately
const initPromise = initializeImports()

// Export getter functions that ensure imports are ready
export async function getSparkWallet () {
  await initPromise
  return SparkWallet
}

export async function getDefaultSparkSigner () {
  await initPromise
  return DefaultSparkSigner
}

export async function getNetwork () {
  await initPromise
  return Network
}

export async function getValidationError () {
  await initPromise
  return ValidationError
}
