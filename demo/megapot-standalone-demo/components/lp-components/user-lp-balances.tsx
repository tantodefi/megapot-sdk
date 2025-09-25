import { useToast } from '@/components/ui/toast';
import { useLpsInfo } from '@/features/liquidity/queries';
import { CONTRACT_ADDRESS } from '@/lib/constants';
import { useEffect, useState } from 'react';
import { parseAbi } from 'viem';
import { useWriteContract } from 'wagmi';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Loading } from '../ui/loading';
import { TxLink } from '../ui/tx-link';
import { AdjustRiskPercentage } from './user-lp-balance/adjust-risk-percentage';
import { LpBalances } from './user-lp-balance/lp-balances';

export function UserLpBalances({
    walletAddress,
}: {
    walletAddress: `0x${string}` | undefined;
}) {
    const { toast } = useToast();
    const { data: lpInfo, isLoading: isLoadingInfo } =
        useLpsInfo(walletAddress);

    const [newRiskPercent, setNewRiskPercent] = useState<number>(0);

    useEffect(() => {
        if (lpInfo) {
            setNewRiskPercent(Number(lpInfo[2]));
        }
    }, [lpInfo]);

    const {
        data: writeData,
        error: writeError,
        isError: isWriteError,
        isPending: isWritePending,
        writeContract,
    } = useWriteContract();

    const principalWei = lpInfo?.[0] ?? 0n;
    // const inRangeWei = lpInfo?.[1] ?? 0n; // Not currently displayed
    const currentRiskPercent = lpInfo ? Number(lpInfo[2]) : 0;
    const isActive = lpInfo?.[3] ?? false;

    const handleAdjustRisk = async () => {
        if (newRiskPercent < 0 || newRiskPercent > 100) {
            toast({
                title: 'Invalid risk %',
                description: 'Risk must be between 0 and 100.',
                variant: 'warning',
            });
            return;
        }
        try {
            const lpAdjustRiskPercentageAbi = parseAbi([
                'function lpAdjustRiskPercentage(uint256 riskPercentage) returns (bool)',
            ]);
            writeContract?.({
                abi: lpAdjustRiskPercentageAbi,
                address: CONTRACT_ADDRESS as `0x${string}`,
                functionName: 'lpAdjustRiskPercentage',
                args: [BigInt(newRiskPercent)],
            });
            toast({
                title: 'Risk update submitted',
                description: 'Confirm the transaction in your wallet.',
                variant: 'success',
            });
        } catch {
            toast({
                title: 'Risk update failed',
                description: 'Could not submit risk update.',
                variant: 'destructive',
            });
        }
    };

    const handleWithdraw = async () => {
        if (principalWei === 0n) {
            toast({
                title: 'Nothing to withdraw',
                description: 'No LP principal available.',
                variant: 'warning',
            });
            return;
        }

        try {
            const withdrawAbi = parseAbi([
                'function withdrawAllLP() returns (bool)',
            ]);
            writeContract?.({
                abi: withdrawAbi,
                address: CONTRACT_ADDRESS as `0x${string}`,
                functionName: 'withdrawAllLP',
                args: [],
            });
            toast({
                title: 'Withdraw submitted',
                description: 'Confirm the transaction in your wallet.',
                variant: 'success',
            });
        } catch {
            toast({
                title: 'Withdraw failed',
                description: 'Could not submit withdrawal.',
                variant: 'destructive',
            });
        }
    };

    const writeErrorDisplay = isWriteError ? (
        <p className="text-xs text-red-500 mt-1 text-center">
            Error: {writeError?.message || 'Transaction failed'}
        </p>
    ) : null;

    if (!isActive && principalWei === 0n && !isLoadingInfo) {
        return null;
    }

    return (
        <Card className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3 text-center">
                    Your LP Position
                </h3>
                <LpBalances walletAddress={walletAddress} />

                <div className="flex flex-col gap-3 mt-4">
                    <AdjustRiskPercentage
                        newRiskPercent={newRiskPercent}
                        setNewRiskPercent={setNewRiskPercent}
                    />
                    <Button
                        className="bg-emerald-500 text-white hover:bg-emerald-600 disabled:bg-gray-400"
                        onClick={handleAdjustRisk}
                        disabled={
                            isWritePending ||
                            newRiskPercent === currentRiskPercent
                        }
                    >
                        {isWritePending ? (
                            <Loading
                                className="h-5 w-5 mr-2"
                                containerClassName="p-0 inline-flex"
                            />
                        ) : null}
                        Adjust Risk Percentage
                    </Button>

                    {currentRiskPercent !== 0 && principalWei > 0n && (
                        <p className="text-xs text-center text-gray-500">
                            To withdraw, set Risk % to 0 and wait for the next
                            draw.
                        </p>
                    )}
                    <Button
                        onClick={handleWithdraw}
                        disabled={
                            isWritePending ||
                            currentRiskPercent !== 0 ||
                            principalWei === 0n
                        }
                        className="bg-orange-500 text-white hover:bg-orange-600 disabled:bg-gray-400"
                    >
                        {isWritePending ? (
                            <Loading
                                className="h-5 w-5 mr-2"
                                containerClassName="p-0 inline-flex"
                            />
                        ) : null}
                        Withdraw All LP
                    </Button>
                    {isWritePending && (
                        <p className="text-xs text-gray-500 mt-1 text-center">
                            Transaction pending...{' '}
                            <TxLink hash={String(writeData || '')} />
                        </p>
                    )}
                    {!isWritePending && writeData && (
                        <p className="text-xs text-gray-600 mt-1 text-center">
                            Submitted <TxLink hash={String(writeData)} />
                        </p>
                    )}
                    {writeErrorDisplay}
                </div>
            </CardContent>
        </Card>
    );
}
