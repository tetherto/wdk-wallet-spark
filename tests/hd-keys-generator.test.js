import { afterEach, describe, expect, jest, test } from '@jest/globals'

import { HDKey } from '@scure/bip32'

import Bip44HDKeysGenerator from '../src/bip-44/hd-keys-generator.js'

describe('Bip44HDKeysGenerator', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should not expose the seed in derivation errors', async () => {
    const seed = Uint8Array.from({ length: 32 }, (_, index) => index + 1)
    const seedHex = Buffer.from(seed).toString('hex')

    jest.spyOn(HDKey, 'fromMasterSeed').mockReturnValue({
      privateKey: null,
      publicKey: null
    })

    const error = await new Bip44HDKeysGenerator().deriveKeysFromSeed(seed, 0)
      .catch(error => error)

    expect(error.getContext()).not.toHaveProperty('value')
    expect(error.message).not.toContain(seedHex)
    expect(JSON.stringify(error.toJSON())).not.toContain(seedHex)
  })
})
