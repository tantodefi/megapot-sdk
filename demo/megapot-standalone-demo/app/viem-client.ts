import { getActiveChain } from '@/config/chains';
import { env } from '@/config/env';
import { createPublicClient, fallback, http } from 'viem';

const chain = getActiveChain();
const isBaseMainnet = chain.id === 8453;

const primary = env.RPC_URL
    || (isBaseMainnet ? 'https://base.publicnode.com' : 'https://base-sepolia.publicnode.com');

const fallbacks = isBaseMainnet
    ? ['https://base.drpc.org', 'https://base-pokt.nodies.app', 'https://base.llamarpc.com']
    : ['https://base-sepolia.drpc.org', 'https://sepolia.base.org'];

const client = createPublicClient({
    chain,
    transport: fallback([
        http(primary),
        ...fallbacks.map((u) => http(u)),
    ]),
});

if (!client) {
    throw new Error('Failed to create viem client');
}

export default client;