'use client';

import { getActiveChain, getTransports } from '@/config/chains';
import { publicEnv } from '@/config/env';
import { PrivyProvider } from '@privy-io/react-auth';
import { createConfig, WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
// import { injected } from 'wagmi/connectors';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 2,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 5,
        },
        mutations: {
            retry: 0,
        },
    },
});

const activeChain = getActiveChain();
const config = createConfig({
    chains: [activeChain],
    transports: getTransports(),
    connectors: [], // Let Privy handle wallet connections
});

export function Providers({ children }: { children: ReactNode }) {
    return (
        <PrivyProvider
            appId={publicEnv.NEXT_PUBLIC_PRIVY_APP_ID}
            config={{
                loginMethods: ['wallet', 'email'],
                appearance: {
                    theme: 'light',
                    accentColor: '#02C3A0',
                },
                // Explicitly set the default chain for Privy
                defaultChain: activeChain,
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={config}>{children}</WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    );
}
