import { AminoSignResponse, OfflineAminoSigner, StdSignature, StdSignDoc } from '@cosmjs/amino';
import { Algo, DirectSignResponse } from '@cosmjs/proto-signing';
import { SignType } from '@cosmos-kit/core';
import { SignOptions, WalletClient } from '@cosmos-kit/core';

import { ChainInfo, CosmjsOfflineSigner, experimentalSuggestChain, signArbitrary } from '@leapwallet/cosmos-snap-provider';
import {
  connectSnap,
  getKey,
  getSnap,
  requestSignAmino,
  requestSignature,
  ProviderLong
} from '@leapwallet/cosmos-snap-provider';
import Long from 'long';

export class CosmosSnapClient implements WalletClient {
  readonly snapInstalled: boolean = false;

  constructor() {
    this.snapInstalled = localStorage.getItem('snapInstalled') === 'true';
  }

  async getSimpleAccount(chainId: string) {
    const { address, username } = await this.getAccount(chainId);
    return {
      namespace: 'cosmos',
      chainId,
      address,
      username,
    };
  }

  async handleConnect() {
    const installedSnap = await getSnap();
    if (!installedSnap) {
      await connectSnap();
    }
  }

  async getAccount(chainId: string) {
    await this.handleConnect();
    const key = await getKey(chainId);
    return {
      username: key?.address,
      address: key.address,
      algo: key.algo as Algo,
      pubkey: key.pubkey,
    };
  }

  getOfflineSigner(chainId: string, preferredSignType?: SignType) {
    switch (preferredSignType) {
      case 'amino':
        return this.getOfflineSignerAmino(chainId);
      case 'direct':
        return this.getOfflineSignerDirect(chainId);
      default:
        return this.getOfflineSignerAmino(chainId);
    }
  }

  getOfflineSignerAmino(chainId: string) {
    return (new CosmjsOfflineSigner(chainId) as unknown) as OfflineAminoSigner;
  }

  getOfflineSignerDirect(chainId: string) {
    return new CosmjsOfflineSigner(chainId);
  }

  async signAmino(
    chainId: string,
    signer: string,
    signDoc: StdSignDoc,
    signOptions?: SignOptions
  ): Promise<AminoSignResponse> {
    return requestSignAmino(chainId, signer, signDoc);
  }

  async signDirect(chainId: string, signer: string, signDoc: {
    bodyBytes?: Uint8Array | null;
    authInfoBytes?: Uint8Array | null;
    chainId?: string | null;
    accountNumber?: ProviderLong | null;
  }) {
    const signature = (requestSignature(
      chainId,
      signer,
      signDoc
    ) as unknown) as DirectSignResponse;

    const accountNumber = signDoc.accountNumber;
    const modifiedAccountNumber = new Long(
      accountNumber!.low,
      accountNumber!.high,
      accountNumber!.unsigned
    );

    return {
      signature: signature.signature,
      signed: {
        ...signature.signed,
        accountNumber: `${modifiedAccountNumber.toString()}`,
        authInfoBytes: new Uint8Array(
          Object.values(signature.signed.authInfoBytes)
        ),
        bodyBytes: new Uint8Array(Object.values(signature.signed.bodyBytes)),
      },
    };
  }

  async signArbitrary(
    chainId: string,
    signer: string,
    data: string
  ): Promise<StdSignature> {
    return (await signArbitrary(
      chainId,
      signer,
      data
    )) as unknown as StdSignature;
  }

  async addChain(chainInfo: ChainInfo) {
    await experimentalSuggestChain(chainInfo);
  }
}
