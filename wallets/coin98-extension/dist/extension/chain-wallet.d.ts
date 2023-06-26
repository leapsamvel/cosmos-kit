import { ChainWalletBase, Wallet, ChainRecord } from '@cosmos-kit/core';

declare class ChainCoin98Extension extends ChainWalletBase {
    constructor(walletInfo: Wallet, chainInfo: ChainRecord);
}

export { ChainCoin98Extension };