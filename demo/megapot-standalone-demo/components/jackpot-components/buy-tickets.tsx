import { useToast } from '@/components/ui/toast';
import { publicEnv } from '@/config/env';
import { useTicketPriceInWei } from '@/features/jackpot/queries';
import {
    useTokenAllowance,
    useTokenBalance,
    useTokenSymbol,
} from '@/features/token/queries';
import { BaseJackpotAbi } from '@/lib/abi';
import {
    CONTRACT_ADDRESS,
    ERC20_TOKEN_ADDRESS,
    REFERRER_ADDRESS,
} from '@/lib/constants';
import { useState } from 'react';
import { parseAbi } from 'viem';
import { useAccount, useWriteContract } from 'wagmi';
import { ConnectButton } from '../connect-button';
import { Button } from '../ui/button';
import { Loading } from '../ui/loading';
import { TxLink } from '../ui/tx-link';

export function BuyTickets() {
    const { toast } = useToast();
    const { address, isConnected } = useAccount();
    const {
        data: writeData,
        error: writeError,
        isError: isWriteError,
        isPending: isWritePending,
        writeContract,
    } = useWriteContract();

    const [ticketCount, setTicketCount] = useState<number>(1);

    const { data: balanceWei, isLoading: isLoadingBalance } =
        useTokenBalance(address);
    const { data: allowanceWei, isLoading: isLoadingAllowance } =
        useTokenAllowance(address);
    const { data: ticketPriceWei, isLoading: isLoadingPrice } =
        useTicketPriceInWei();
    // Remove unused hooks to satisfy lints
    const { data: tokenSymbol, isLoading: isLoadingSymbol } = useTokenSymbol();
    const isLoading =
        isLoadingBalance ||
        isLoadingAllowance ||
        isLoadingPrice ||
        isLoadingSymbol;

    const increment = () => setTicketCount((prev) => prev + 1);
    const decrement = () => setTicketCount((prev) => (prev > 1 ? prev - 1 : 1));

    const ticketCostWei =
        ticketPriceWei !== undefined
            ? BigInt(ticketCount) * ticketPriceWei
            : 0n;

    const isWalletFunded =
        balanceWei !== undefined && balanceWei >= ticketCostWei;
    const hasEnoughAllowance =
        allowanceWei !== undefined && allowanceWei >= ticketCostWei;
    const displayTokenName = tokenSymbol ?? 'Token'; // Fallback token name

    const handleApproveToken = async () => {
        try {
            if (publicEnv.NEXT_PUBLIC_DEMO_MODE) {
                toast({
                    title: 'Demo mode',
                    description: 'Writes are disabled.',
                    variant: 'warning',
                });
                return;
            }
            if (!address || ticketCostWei === 0n) {
                throw new Error(
                    'Wallet not connected or ticket price unavailable'
                );
            }

            const approveAbi = parseAbi([
                'function approve(address spender, uint256 amount) returns (bool)',
            ]);

            const approveAmount = ticketCostWei;

            writeContract?.({
                abi: approveAbi,
                address: ERC20_TOKEN_ADDRESS as `0x${string}`,
                functionName: 'approve',
                args: [CONTRACT_ADDRESS, approveAmount],
            });
            toast({
                title: 'Approval submitted',
                description: 'Confirm the transaction in your wallet.',
                variant: 'success',
            });
        } catch {
            toast({
                title: 'Approval failed',
                description: 'Could not submit approval.',
                variant: 'destructive',
            });
        }
    };

    const handleBuyTicket = async () => {
        try {
            if (publicEnv.NEXT_PUBLIC_DEMO_MODE) {
                toast({
                    title: 'Demo mode',
                    description: 'Writes are disabled.',
                    variant: 'warning',
                });
                return;
            }
            if (!address || ticketCostWei === 0n) {
                throw new Error(
                    'Wallet not connected or ticket cost cannot be calculated'
                );
            }

            // This is YOUR wallet to collect referral fees
            const referrerAddress = REFERRER_ADDRESS;

            writeContract?.({
                abi: BaseJackpotAbi,
                address: CONTRACT_ADDRESS as `0x${string}`,
                functionName: 'purchaseTickets',
                // Args: referrer, amount, recipient (buyer)
                args: [referrerAddress, ticketCostWei, address],
            });
            toast({
                title: 'Purchase submitted',
                description: 'Confirm the transaction in your wallet.',
                variant: 'success',
            });
        } catch {
            toast({
                title: 'Purchase failed',
                description: 'Could not submit ticket purchase.',
                variant: 'destructive',
            });
        }
    };

    let buttonContent;
    if (!isConnected) {
        buttonContent = <ConnectButton />;
    } else if (isLoading) {
        buttonContent = (
            <Loading className="h-4 w-4" containerClassName="p-1" />
        );
    } else if (!isWalletFunded) {
        buttonContent = (
            <Button
                disabled
                className="mt-2 w-full bg-orange-500 text-white cursor-not-allowed"
            >
                Not enough {displayTokenName}
            </Button>
        );
    } else if (!hasEnoughAllowance) {
        buttonContent = (
            <Button
                onClick={handleApproveToken}
                disabled={isWritePending}
                className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
                {isWritePending ? (
                    <Loading
                        className="h-5 w-5 mr-2"
                        containerClassName="p-0 inline-flex"
                    />
                ) : null}
                Approve {displayTokenName}
            </Button>
        );
    } else {
        buttonContent = (
            <Button
                onClick={handleBuyTicket}
                disabled={isWritePending}
                className="mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
                {isWritePending ? (
                    <Loading
                        className="h-5 w-5 mr-2"
                        containerClassName="p-0 inline-flex"
                    />
                ) : null}
                Buy Ticket{ticketCount > 1 ? 's' : ''}
            </Button>
        );
    }

    const writeErrorDisplay = isWriteError ? (
        <p className="text-xs text-red-500 mt-1">
            Error: {writeError?.message || 'Transaction failed'}
        </p>
    ) : null;

    return (
        <div className="flex flex-col items-center">
            <div className="flex items-center">
                <button
                    onClick={decrement}
                    disabled={isWritePending || isLoading}
                    className="bg-emerald-500 text-white px-3 py-1 rounded-l hover:bg-emerald-600 disabled:bg-gray-400"
                >
                    -
                </button>
                <input
                    type="number"
                    value={ticketCount}
                    onChange={(e) =>
                        setTicketCount(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="mx-0 w-16 text-center border-t border-b border-emerald-500 py-1 focus:outline-none"
                    min="1"
                    disabled={isWritePending || isLoading}
                    style={{
                        appearance: 'textfield',
                        MozAppearance: 'textfield',
                    }}
                />
                <button
                    onClick={increment}
                    disabled={isWritePending || isLoading}
                    className="bg-emerald-500 text-white px-3 py-1 rounded-r hover:bg-emerald-600 disabled:bg-gray-400"
                >
                    +
                </button>
            </div>
            <div className="mt-2 w-full">
                {buttonContent}
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
                {writeErrorDisplay}
            </div>
        </div>
    );
}
