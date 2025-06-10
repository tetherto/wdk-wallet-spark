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

import { ValidationError } from '@buildonspark/spark-sdk'
import { DefaultSparkSigner } from '@buildonspark/spark-sdk/signer'
import { getMasterHDKeyFromSeed } from '@buildonspark/spark-sdk/utils'

import { hexToBytes, bytesToHex } from '@noble/curves/abstract/utils'

export default class WalletSparkSigner extends DefaultSparkSigner {
  #index

  constructor (index = 0) {
    super()

    this.#index = index
  }

  get index () {
    return this.#index
  }

  async createSparkWalletFromSeed (seed, accountNumber) {
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

    const root = `m/8797555'/${accountNumber}'/${this.index}'`

    const identityKey = hdkey.derive(`${root}/0'`)
    const signingKey = hdkey.derive(`${root}/1'`)
    const depositKey = hdkey.derive(`${root}/2'`)

    if (
      !identityKey.privateKey || 
      !signingKey.privateKey ||
      !depositKey.privateKey || 
      !identityKey.publicKey ||
      !signingKey.publicKey || 
      !depositKey.publicKey
    ) {
      throw new ValidationError(
        'Failed to derive all required keys from seed',
        {
          field: 'derivedKeys'
        }
      )
    }

    this.masterKey = hdkey
    this.identityKey = identityKey
    this.depositKey = depositKey
    this.signingKey = signingKey

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
