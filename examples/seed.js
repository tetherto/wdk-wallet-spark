// npm i davi0kprogramsthings/wdk-wallet-spark#develop
// npm i bip39
// npm i libsodium-wrappers-sumo

import WalletManagerSpark from '../index.js'
import { mnemonicToSeedSync } from 'bip39'

const seedPhrase = WalletManagerSpark.getRandomSeedPhrase()

const seedBuffer = mnemonicToSeedSync(seedPhrase)

const walletFromSeed = new WalletManagerSpark(seedBuffer, {})

const accountFromSeed = await walletFromSeed.getAccount(0)
const addressFromSeed = await accountFromSeed.getAddress()

console.log('Derived address:', addressFromSeed)

// try to sign a message
const message = 'Hello, world!'
const signature = await accountFromSeed.sign(message)
console.log('Signature:', signature)

// use wallet verify
console.log('Is the signature valid?', await accountFromSeed.verify(message, signature))

// we can erase seed buffer
await walletFromSeed.close()

const signature2 = await accountFromSeed.sign(message)
console.log('Signature 2:', signature2)

// check that the signature is the same
if (signature === signature2) {
  console.log('Signatures are the same')
} else {
  console.log('Signatures are different')
}

console.log('Signing still works')

console.log('Now we erase private key buffer')
await accountFromSeed.close()

// now try to sign again
try {
  await accountFromSeed.sign(message)
  console.log('Signing is NOT failing | ERROR')
} catch (_) {
  console.log('Signing is failing as expected | OK')
}
