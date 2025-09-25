import {
    getFeeBps,
    getJackpotAmount,
    getJackpotOdds,
    getLastJackpotResults,
    getTicketPrice,
    getTimeRemaining,
    getTokenDecimals,
} from '@/lib/contract';
import { useQuery } from '@tanstack/react-query';
import { formatUnits } from 'viem';

export const jackpotQueryKeys = {
    priceWei: ['jackpot', 'ticketPriceWei'] as const,
    price: ['jackpot', 'ticketPrice'] as const,
    amountWei: ['jackpot', 'amountWei'] as const,
    amount: ['jackpot', 'amount'] as const,
    timeRemaining: ['jackpot', 'timeRemaining'] as const,
    feeBps: ['jackpot', 'feeBps'] as const,
    odds: ['jackpot', 'odds'] as const,
    last: ['jackpot', 'last'] as const,
};

export function useTicketPriceInWei() {
    return useQuery({ queryKey: jackpotQueryKeys.priceWei, queryFn: getTicketPrice, staleTime: 1000 * 15, refetchInterval: 1000 * 15 });
}

export function useTicketPrice() {
    const { data: ticketPriceInWei, isLoading: isLoadingPrice, error: errorPrice } = useTicketPriceInWei();
    const { data: decimals, isLoading: isLoadingDecimals, error: errorDecimals } = useQuery({ queryKey: ['token', 'decimals'], queryFn: getTokenDecimals, staleTime: Infinity, gcTime: Infinity });
    const isLoading = isLoadingPrice || isLoadingDecimals;
    const error = errorPrice || errorDecimals;
    const data = (ticketPriceInWei !== undefined && decimals !== undefined) ? parseFloat(formatUnits(ticketPriceInWei, decimals)) : undefined;
    return { data, isLoading, error };
}

export function useJackpotAmountInWei() {
    return useQuery({ queryKey: jackpotQueryKeys.amountWei, queryFn: getJackpotAmount, staleTime: 1000 * 10, refetchInterval: 1000 * 10 });
}

export function useJackpotAmount() {
    const { data: jackpotAmountInWei, isLoading: isLoadingAmount, error: errorAmount } = useJackpotAmountInWei();
    const { data: decimals, isLoading: isLoadingDecimals, error: errorDecimals } = useQuery({ queryKey: ['token', 'decimals'], queryFn: getTokenDecimals, staleTime: Infinity, gcTime: Infinity });
    const isLoading = isLoadingAmount || isLoadingDecimals;
    const error = errorAmount || errorDecimals;
    const data = (jackpotAmountInWei !== undefined && decimals !== undefined) ? parseFloat(formatUnits(jackpotAmountInWei, decimals)) : undefined;
    return { data, isLoading, error };
}

export function useTimeRemaining() {
    return useQuery({ queryKey: jackpotQueryKeys.timeRemaining, queryFn: getTimeRemaining, staleTime: 1000 * 1, refetchInterval: 1000 * 1 });
}

export function useFeeBps() {
    return useQuery({ queryKey: jackpotQueryKeys.feeBps, queryFn: getFeeBps, staleTime: 1000 * 60 * 5 });
}

export function useJackpotOdds() {
    return useQuery({ queryKey: jackpotQueryKeys.odds, queryFn: getJackpotOdds, staleTime: 1000 * 30, refetchInterval: 1000 * 30 });
}

export function useLastJackpotResults() {
    return useQuery({ queryKey: jackpotQueryKeys.last, queryFn: async () => (await getLastJackpotResults()) ?? null, staleTime: 1000 * 600 * 1, placeholderData: null, refetchInterval: 1000 * 600 * 1 });
}


