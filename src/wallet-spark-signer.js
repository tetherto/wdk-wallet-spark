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

import { DefaultSparkSigner } from '@buildonspark/spark-sdk/signer'
import { hexToBytes, bytesToHex } from '@noble/curves/abstract/utils'
import { getMasterHDKeyFromSeed, Network, ValidationError } from '@buildonspark/spark-sdk/utils'

export default class WalletSparkSigner extends DefaultSparkSigner {
  constructor (index = 0) {
    super()

    this.index = index
  }

  async createSparkWalletFromSeed (seed, network) {
    if (typeof seed === 'string') {
      seed = hexToBytes(seed)
    }

    const masterKey = getMasterHDKeyFromSeed(seed)

    if (!masterKey.privateKey || !masterKey.publicKey) {
      throw new ValidationError('Failed to derive keys from seed.', {
        field: 'hdkey',
        value: seed
      })
    }

    const accountType = network === Network.REGTEST ? 0 : 1

    const rootPath = `m/8797555'/${accountType}'/${this.index}'`

    const identityKey = masterKey.derive(`${rootPath}/0'`)
    const signingKey = masterKey.derive(`${rootPath}/1'`)
    const depositKey = masterKey.derive(`${rootPath}/2'`)

    if (
      !identityKey.privateKey || !identityKey.publicKey ||
      !depositKey.privateKey || !depositKey.publicKey ||
      !signingKey.privateKey || !signingKey.publicKey
    ) {
      throw new ValidationError(
        'Failed to derive all required keys from seed.',
        {
          field: 'derivedKeys'
        }
      )
    }

    this.path = `${rootPath}/0'`

    this.masterKey = masterKey

    this.identityKey = identityKey
    this.depositKey = depositKey
    this.signingKey = signingKey

    this.publicKeyToPrivateKeyMap.set(
      bytesToHex(identityKey.publicKey), bytesToHex(identityKey.privateKey))

    this.publicKeyToPrivateKeyMap.set(
      bytesToHex(depositKey.publicKey), bytesToHex(depositKey.privateKey))

    const publicKey = bytesToHex(identityKey.publicKey)

    return publicKey
  }
}
