/* eslint-disable no-unsafe-optional-chaining */
import { AminoSignResponse, StdSignDoc, StdSignature } from '@cosmjs/amino';
import { SignOptions, WalletAccount, WalletClient } from '@cosmos-kit/core';
import Station from '@terra-money/station-connector';

export class StationClient implements WalletClient {
  readonly client: Station;

  constructor(client: Station) {
    this.client = client;
  }

  async disconnect() {
    return;
  }

  async getSimpleAccount(chainId: string) {
    const { name, addresses } = await this.client.connect();

    const address = addresses[chainId];

    if (!address)
      throw new Error(
        `Requested chainId (${chainId}) is not available, try to switch network on the Station extension.`
      );

    return {
      namespace: 'cosmos',
      chainId,
      address,
      username: name,
    };
  }

  async getAccount(chainId: string): Promise<WalletAccount> {
    const info = (await this.client.info())[chainId];
    if (!info)
      throw new Error(
        `The requested chainID (${chainId}) is not available, try to switch network on the Station extension.`
      );

    let { name, addresses, pubkey: pubkeys } = await this.client.connect();
    if (!pubkeys) {
      pubkeys = (await this.client.getPublicKey()).pubkey;
    }
    const pubkey = pubkeys?.[info.coinType];
    const address = addresses[chainId];

    if (!address || !pubkey)
      throw new Error(
        'The requested account is not available, try to use a different wallet on the Station extension or to import it again.'
      );

    return {
      address,
      pubkey: Buffer.from(pubkey, 'base64'),
      username: name,
      isNanoLedger: true,
      algo: 'secp256k1',
    };
  }

  async signAmino(
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    _signOptions?: SignOptions
  ): Promise<AminoSignResponse> {
    return await this.client.keplr.signAmino(chainId, signer, signDoc);
  }

  async getOfflineSigner(chainId: string) {
    return await this.client.getOfflineSigner(chainId);
  }

  async signArbitrary(
    chainId: string,
    signer: string,
    data: string | Uint8Array
  ): Promise<StdSignature> {
    return await this.client.keplr.signArbitrary(chainId, signer, data);
  }
}
