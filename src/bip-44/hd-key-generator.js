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

import { HDKey } from "@scure/bip32";

export const BIP_44_LBTC_DERIVATION_PATH_PREFIX = "m/44'/998'"

export default class Bip44HDKeyGenerator {
  constructor (index = 0) {
    this._index = index
  }

  get index () {
    return this._index
  }

  async deriveHDKeysFromSeed(seed, accountNumber) {
    const hdkey = HDKey.fromMasterSeed(seed);

    if (!hdkey.privateKey || !hdkey.publicKey) {
      throw new ValidationError("Failed to derive keys from seed", {
        field: "hdkey",
        value: seed,
      });
    }

    const root = `${BIP_44_LBTC_DERIVATION_PATH_PREFIX}/${accountNumber}'/0/${this.index}`

    const identityKey = hdkey.derive(root),
          signingKey = hdkey.derive(`${root}/0'`),
          depositKey = hdkey.derive(`${root}/1'`),
          staticDepositKey = hdkey.derive(`${root}/2'`);

    if (
      !identityKey.privateKey ||
      !depositKey.privateKey ||
      !signingKey.privateKey ||
      !identityKey.publicKey ||
      !depositKey.publicKey ||
      !signingKey.publicKey ||
      !staticDepositKey.privateKey ||
      !staticDepositKey.publicKey
    ) {
      throw new ValidationError(
        "Failed to derive all required keys from seed",
        {
          field: "derivedKeys",
        },
      );
    }

    return {
      masterKey: {
        hdKey: hdkey,
        privateKey: hdkey.privateKey,
        publicKey: hdkey.publicKey,
      },
      identityKey: {
        hdKey: identityKey,
        privateKey: identityKey.privateKey,
        publicKey: identityKey.publicKey,
      },
      signingKey: {
        hdKey: signingKey,
        privateKey: signingKey.privateKey,
        publicKey: signingKey.publicKey,
      },
      depositKey: {
        hdKey: depositKey,
        privateKey: depositKey.privateKey,
        publicKey: depositKey.publicKey,
      },
      staticDepositKey: {
        hdKey: staticDepositKey,
        privateKey: staticDepositKey.privateKey,
        publicKey: staticDepositKey.publicKey,
      },
    };
  }
}
