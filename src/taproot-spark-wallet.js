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

import { SparkWallet } from '@buildonspark/spark-sdk'

import { DefaultSparkSigner, TaprootOutputKeysGenerator } from '@buildonspark/spark-sdk/signer'

export class TaprootSparkSigner extends DefaultSparkSigner {
  constructor() {
    super({ sparkKeysGenerator: new TaprootOutputKeysGenerator(true) });
  }
}

export default class TaprootSparkWallet extends SparkWallet {
  constructor(options, { accountNumber }) {
    super(options, new TaprootSparkSigner())

    this.accountNumber = accountNumber
  }

  static async initialize({ mnemonicOrSeed, accountNumber, options }) {
    const wallet = new TaprootSparkWallet(options, { accountNumber })

    const initResponse = await wallet.initWallet(mnemonicOrSeed, accountNumber)

    return {
      wallet,
      ...initResponse
    }
  }
}
