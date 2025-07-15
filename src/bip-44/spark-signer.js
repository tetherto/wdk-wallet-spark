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

import { sodium_memzero } from 'sodium-universal'

import Bip44HDKeysGenerator from './hd-keys-generator.js'

export default class Bip44SparkSigner extends DefaultSparkSigner {
  constructor (index) {
    const sparkKeysGenerator = new Bip44HDKeysGenerator(index)

    super({ sparkKeysGenerator })
  }

  get index () {
    return this.keysGenerator.index
  }

  dispose () {
    sodium_memzero(this.identityKey.privateKey)
    sodium_memzero(this.signingKey.privateKey)
    sodium_memzero(this.depositKey.privateKey)
    sodium_memzero(this.staticDepositKey.privateKey)

    this.identityKey = undefined
    this.signingKey = undefined
    this.depositKey = undefined
    this.staticDepositKey = undefined

    this.publicKeyToPrivateKeyMap.clear()
  }
}
