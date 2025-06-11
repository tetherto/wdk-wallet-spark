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

import { bytesToHex } from '@noble/curves/abstract/utils'
import sodium from 'sodium-universal'
import { getMasterHDKeyFromSeed, Network } from '@buildonspark/spark-sdk'
import { DefaultSparkSigner } from '@buildonspark/spark-sdk/signer'

export default class WalletSparkSigner extends DefaultSparkSigner {
  constructor (index = 0) {
    super()

    this.index = index
    this.masterKey = null
    this.identityKey = null
    this.depositKey = null
    this.signingKey = null
  }

  async createSparkWalletFromSeed (seed, network) {
    this.masterKey = getMasterHDKeyFromSeed(seed)

    const accountType = network === Network.REGTEST ? 0 : 1

    const rootPath = `m/8797555'/${accountType}'/${this.index}'`

    this.identityKey = this.masterKey.derive(`${rootPath}/0'`)
    this.signingKey = this.masterKey.derive(`${rootPath}/1'`)
    this.depositKey = this.masterKey.derive(`${rootPath}/2'`)

    this.path = `${rootPath}/0'`

    const publicKey = bytesToHex(this.identityKey.publicKey)

    return publicKey
  }

  dispose () {
    sodium.sodium_memzero(this.masterKey.privateKey)
    sodium.sodium_memzero(this.masterKey.publicKey)
    sodium.sodium_memzero(this.identityKey.privateKey)
    sodium.sodium_memzero(this.identityKey.publicKey)
    sodium.sodium_memzero(this.depositKey.privateKey)
    sodium.sodium_memzero(this.depositKey.publicKey)
    sodium.sodium_memzero(this.signingKey.privateKey)
    sodium.sodium_memzero(this.signingKey.publicKey)

    this.index = null
    this.masterKey = null
    this.identityKey = null
    this.depositKey = null
    this.signingKey = null
  }
}
