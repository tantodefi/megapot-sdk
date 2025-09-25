import {
    getTokenAllowance,
    getTokenBalance,
    getTokenDecimals,
    getTokenName,
    getTokenSymbol,
} from '@/lib/contract';
import { useQuery } from '@tanstack/react-query';

export const tokenQueryKeys = {
    name: ['token', 'name'] as const,
    symbol: ['token', 'symbol'] as const,
    decimals: ['token', 'decimals'] as const,
    balance: (address: `0x${string}`) => ['token', 'balance', address] as const,
    allowance: (address: `0x${string}`) => ['token', 'allowance', address] as const,
};

export function useTokenName() {
    return useQuery({ queryKey: tokenQueryKeys.name, queryFn: getTokenName, staleTime: Infinity, gcTime: Infinity });
}

export function useTokenSymbol() {
    return useQuery({ queryKey: tokenQueryKeys.symbol, queryFn: getTokenSymbol, staleTime: Infinity, gcTime: Infinity });
}

export function useTokenDecimals() {
    return useQuery({ queryKey: tokenQueryKeys.decimals, queryFn: getTokenDecimals, staleTime: Infinity, gcTime: Infinity });
}

export function useTokenBalance(address: `0x${string}` | undefined) {
    return useQuery({
        queryKey: tokenQueryKeys.balance(address as `0x${string}`),
        queryFn: () => getTokenBalance(address as `0x${string}`),
        enabled: !!address,
        staleTime: 1000 * 5,
        refetchInterval: 1000 * 5,
    });
}

export function useTokenAllowance(address: `0x${string}` | undefined) {
    return useQuery({
        queryKey: tokenQueryKeys.allowance(address as `0x${string}`),
        queryFn: () => getTokenAllowance(address as `0x${string}`),
        enabled: !!address,
        staleTime: 1000 * 30,
        refetchInterval: 1000 * 30,
    });
}


