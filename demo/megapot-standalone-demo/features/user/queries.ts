import { getTicketCountForRound, getUsersInfo } from '@/lib/contract';
import { useQuery } from '@tanstack/react-query';

export const userQueryKeys = {
    info: (address: `0x${string}`) => ['user', 'info', address] as const,
    ticketCount: (address: `0x${string}`) => ['user', 'ticketCount', address] as const,
};

export function useUsersInfo(address: `0x${string}` | undefined) {
    return useQuery({
        queryKey: userQueryKeys.info(address as `0x${string}`),
        queryFn: () => getUsersInfo(address as `0x${string}`),
        enabled: !!address,
        staleTime: 1000 * 10,
        refetchInterval: 1000 * 10,
    });
}

export function useTicketCountForRound(address: `0x${string}` | undefined) {
    return useQuery({
        queryKey: userQueryKeys.ticketCount(address as `0x${string}`),
        queryFn: () => getTicketCountForRound(address as `0x${string}`),
        enabled: !!address,
        staleTime: 1000 * 10,
        refetchInterval: 1000 * 10,
    });
}


