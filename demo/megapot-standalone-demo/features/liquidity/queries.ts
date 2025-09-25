import { getLpPoolStatus, getLpsInfo, getMinLpDeposit } from '@/lib/contract';
import { useQuery } from '@tanstack/react-query';

export const liquidityQueryKeys = {
    lpsInfo: (address: `0x${string}`) => ['liquidity', 'lpsInfo', address] as const,
    status: ['liquidity', 'status'] as const,
    minDeposit: ['liquidity', 'minDeposit'] as const,
};

export function useLpsInfo(address: `0x${string}` | undefined) {
    return useQuery({
        queryKey: liquidityQueryKeys.lpsInfo(address as `0x${string}`),
        queryFn: () => getLpsInfo(address as `0x${string}`),
        enabled: !!address,
        staleTime: 1000 * 15,
        refetchInterval: 1000 * 15,
    });
}

export function useLpPoolStatus() {
    return useQuery({ queryKey: liquidityQueryKeys.status, queryFn: getLpPoolStatus, staleTime: 1000 * 15, refetchInterval: 1000 * 15 });
}

export function useMinLpDeposit() {
    return useQuery({ queryKey: liquidityQueryKeys.minDeposit, queryFn: getMinLpDeposit, staleTime: 1000 * 60 * 5 });
}


