import { http } from 'viem';
import { Chain, base, baseSepolia } from 'wagmi/chains';
import { env, publicEnv } from './env';

export function getActiveChain(): Chain {
    if (publicEnv.NEXT_PUBLIC_CHAIN_ID === baseSepolia.id) return baseSepolia;
    return base;
}

export function getTransports() {
    const active = getActiveChain();
    const rpcUrl = env.RPC_URL;
    const primary = rpcUrl || (active.id === base.id
        ? 'https://base.publicnode.com'
        : 'https://base-sepolia.publicnode.com');
    return {
        [active.id]: http(primary),
    } as const;
}


