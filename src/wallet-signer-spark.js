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

// Import necessary dependencies
import { DefaultSparkSigner } from '@buildonspark/spark-sdk/signer'
import { hexToBytes, bytesToHex } from '@noble/curves/abstract/utils'
import { getMasterHDKeyFromSeed, Network, ValidationError } from '@buildonspark/spark-sdk'

/**
 * CustomSparkSigner extends the DefaultSparkSigner to allow specifying a custom index
 * when creating a wallet from a seed.
 */
export class CustomSparkSigner extends DefaultSparkSigner {
  /**
   * Constructor for WDKSparkSigner
   * @param {number} [index=0] - The index to use for key derivation (default: 0)
   */
  constructor (index = 0) {
    super()
    this.index = index
  }

  /**
   * Creates a Spark wallet from a seed with an optional index parameter.
   * @param {Uint8Array | string} seed - The seed to derive keys from
   * @param {Network} network - The network type
   * @returns {Promise<string>} - The identity public key
   */
  async createSparkWalletFromSeed (
    seed,
    network
  ) {
    if (typeof seed === 'string') {
      seed = hexToBytes(seed)
    }

    const hdkey = getMasterHDKeyFromSeed(seed)

    if (!hdkey.privateKey || !hdkey.publicKey) {
      throw new ValidationError('Failed to derive keys from seed', {
        field: 'hdkey',
        value: seed
      })
    }

    const accountType = network === Network.REGTEST ? 0 : 1

    // Use the provided index for the key derivation paths
    const identityKey = hdkey.derive(`m/8797555'/${accountType}'/${this.index}'/0'`)
    const signingKey = hdkey.derive(`m/8797555'/${accountType}'/${this.index}'/1'`)
    const depositKey = hdkey.derive(`m/8797555'/${accountType}'/${this.index}'/2'`)

    if (
      !identityKey.privateKey ||
      !depositKey.privateKey ||
      !signingKey.privateKey ||
      !identityKey.publicKey ||
      !depositKey.publicKey ||
      !signingKey.publicKey
    ) {
      throw new ValidationError(
        'Failed to derive all required keys from seed',
        {
          field: 'derivedKeys'
        }
      )
    }

    // Set the keys on the signer instance
    this.masterKey = hdkey
    this.identityKey = identityKey
    this.depositKey = depositKey
    this.signingKey = signingKey

    // Add the keys to the map for tracking
    this.publicKeyToPrivateKeyMap.set(
      bytesToHex(identityKey.publicKey),
      bytesToHex(identityKey.privateKey)
    )
    this.publicKeyToPrivateKeyMap.set(
      bytesToHex(depositKey.publicKey),
      bytesToHex(depositKey.privateKey)
    )

    return bytesToHex(identityKey.publicKey)
  }
}
