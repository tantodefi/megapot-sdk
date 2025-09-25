import { useToast } from '@/components/ui/toast';
import { useTokenDecimals, useTokenSymbol } from '@/features/token/queries';
import { useUsersInfo } from '@/features/user/queries';
import { BaseJackpotAbi } from '@/lib/abi';
import { CONTRACT_ADDRESS } from '@/lib/constants';
import { useAccount, useWriteContract } from 'wagmi';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Loading } from '../ui/loading';
import { TxLink } from '../ui/tx-link';

export function WithdrawWinnings() {
    const { toast } = useToast();
    const { address } = useAccount();
    const {
        data: writeData,
        error: writeError,
        isError: isWriteError,
        isPending: isWritePending,
        writeContract,
    } = useWriteContract();

    // Fetch user info, token name, and decimals
    const {
        data: userInfo,
        isLoading: isLoadingInfo,
        error: errorInfo,
    } = useUsersInfo(address);
    // tokenName unused
    const {
        data: tokenSymbol,
        isLoading: isLoadingSymbol,
        error: errorSymbol,
    } = useTokenSymbol();
    const {
        data: tokenDecimals,
        isLoading: isLoadingDecimals,
        error: errorDecimals,
    } = useTokenDecimals();

    const isLoading = isLoadingInfo || isLoadingSymbol || isLoadingDecimals;
    const error = errorInfo || errorSymbol || errorDecimals;

    const displayDecimals = tokenDecimals ?? 18;
    const displayName = tokenSymbol ?? 'TOKEN';
    const winningsWei = userInfo?.winningsClaimable ?? 0n; // Get winnings from userInfo, default to 0n
    const winningsFormatted = (
        Number(winningsWei) /
        10 ** displayDecimals
    ).toLocaleString(undefined, {
        maximumFractionDigits: displayDecimals > 0 ? 2 : 0,
    });

    const handleWithdraw = async () => {
        if (winningsWei === 0n) {
            toast({
                title: 'No winnings',
                description: 'You have no winnings to withdraw.',
                variant: 'warning',
            });
            return;
        }

        writeContract?.({
            address: CONTRACT_ADDRESS as `0x${string}`,
            abi: BaseJackpotAbi,
            functionName: 'withdrawWinnings',
            args: [],
        });
        toast({
            title: 'Withdraw submitted',
            description: 'Confirm the transaction in your wallet.',
            variant: 'success',
        });
    };

    let content;
    if (isLoading) {
        content = (
            <Loading className="h-8 w-8 mx-auto" containerClassName="p-2" />
        );
    } else if (error) {
        content = (
            <p className="text-lg text-red-500">Error loading winnings.</p>
        );
    } else {
        content = (
            <>
                <p className="text-lg">
                    {winningsFormatted} {displayName}
                </p>
                <Button
                    onClick={handleWithdraw}
                    disabled={isWritePending || winningsWei === 0n} // Disable if pending or no winnings
                    className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-gray-400"
                >
                    {isWritePending ? (
                        <Loading
                            className="h-5 w-5 mr-2"
                            containerClassName="p-0 inline-flex"
                        />
                    ) : null}
                    Withdraw
                </Button>
                {isWritePending && (
                    <p className="text-xs text-gray-500 mt-1">
                        Transaction pending...{' '}
                        <TxLink hash={String(writeData || '')} />
                    </p>
                )}
                {!isWritePending && writeData && (
                    <p className="text-xs text-gray-600 mt-1">
                        Submitted <TxLink hash={String(writeData)} />
                    </p>
                )}
                {isWriteError && (
                    <p className="text-xs text-red-500 mt-1">
                        Error: {writeError?.message || 'Transaction failed'}
                    </p>
                )}
            </>
        );
    }

    return (
        <Card className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center space-y-2">
                    <h1 className="text-2xl font-bold">Withdraw Winnings</h1>
                    {content}
                </div>
            </CardContent>
        </Card>
    );
}
