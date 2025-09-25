'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useUsersInfo } from '@/features/user/queries';
import { useAccount } from 'wagmi';
import { BuyTickets } from './jackpot-components/buy-tickets';
import { Countdown } from './jackpot-components/countdown';
import { CurrentJackpot } from './jackpot-components/current-jackpot';
import { LastJackpot } from './jackpot-components/last-jackpot';
import { TicketPrice } from './jackpot-components/ticket-price';
import { WinningOdds } from './jackpot-components/winning-odds';
import { WithdrawWinnings } from './jackpot-components/withdraw-winnings';

export function JackpotComponent() {
    const { address, isConnected } = useAccount();

    // Fetch user info here to decide whether to render WithdrawWinnings
    // WithdrawWinnings itself will also fetch this, but we need it here for conditional rendering.
    // TanStack Query will deduplicate the request.
    const { data: userInfo, isLoading: isLoadingUserInfo } =
        useUsersInfo(address);
    const hasWinnings =
        userInfo?.winningsClaimable && userInfo.winningsClaimable > 0n;

    return (
        <div className="space-y-6">
            {/* Conditionally render WithdrawWinnings based on fetched userInfo */}
            {isConnected && address && hasWinnings && !isLoadingUserInfo && (
                <WithdrawWinnings />
            )}

            <CurrentJackpot />

            <Countdown />

            <Card className="bg-white rounded-xl shadow-sm">
                <CardContent className="p-6">
                    <div className="text-center">
                        <TicketPrice />
                        <WinningOdds />
                        <BuyTickets />
                    </div>
                </CardContent>
            </Card>
            <LastJackpot />
        </div>
    );
}
