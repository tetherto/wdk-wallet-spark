export const BIP_44_LBTC_DERIVATION_PATH_PREFIX: "m/44'/998'";
/** @internal */
export default class Bip44HDKeysGenerator {
    constructor(index?: number);
    _index: number;
    get index(): number;
    deriveKeysFromSeed(seed: any, accountNumber: any): Promise<{
        masterPublicKey: Uint8Array<ArrayBufferLike>;
        identityKey: {
            privateKey: Uint8Array<ArrayBufferLike>;
            publicKey: Uint8Array<ArrayBufferLike>;
        };
        signingHDKey: {
            hdKey: HDKey;
            privateKey: Uint8Array<ArrayBufferLike>;
            publicKey: Uint8Array<ArrayBufferLike>;
        };
        depositKey: {
            privateKey: Uint8Array<ArrayBufferLike>;
            publicKey: Uint8Array<ArrayBufferLike>;
        };
        staticDepositHDKey: {
            hdKey: HDKey;
            privateKey: Uint8Array<ArrayBufferLike>;
            publicKey: Uint8Array<ArrayBufferLike>;
        };
    }>;
}
import { HDKey } from '@scure/bip32';
