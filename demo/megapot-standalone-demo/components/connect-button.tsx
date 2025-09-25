'use client';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { getActiveChain } from '@/config/chains';
import { AlertTriangle, ChevronDown, LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { EIP1193Provider } from 'viem';
import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';

export function ConnectButton() {
    const { toast } = useToast();
    const { address, isConnected, chainId } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const { switchChain } = useSwitchChain();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const activeChain = getActiveChain();
    const isWrongNetwork = isConnected && chainId !== activeChain.id;

    const handleConnect = async () => {
        // If connected but on the wrong network, switch chain
        if (isWrongNetwork) {
            switchChain?.({ chainId: activeChain.id });
            toast({
                title: 'Switching network',
                description: `Switching to ${activeChain.name}...`,
                variant: 'warning',
            });
        }
        // If not connected, initiate connection
        else if (!isConnected) {
            try {
                if (connectors.length === 0) {
                    // Fallback: try injected connector directly if present
                    if (typeof window !== 'undefined') {
                        const w = window as Window & {
                            ethereum?: EIP1193Provider;
                        };
                        if (w.ethereum) {
                            const { injected } = await import(
                                'wagmi/connectors'
                            );
                            connect({ connector: injected() });
                            setIsOpen(true);
                            return;
                        }
                    }
                    toast({
                        title: 'No wallet found',
                        description: 'Install a wallet or enable a connector.',
                        variant: 'warning',
                    });
                    return;
                }
                const injected = connectors.find(
                    (c: { id: string; name: string }) =>
                        c.id === 'injected' ||
                        c.name.toLowerCase().includes('injected')
                );
                const preferred = injected ?? connectors[0];
                connect({ connector: preferred });
                setIsOpen(true); // Keep dropdown open after connecting
            } catch {
                toast({
                    title: 'Connection failed',
                    description: 'Unable to connect wallet.',
                    variant: 'destructive',
                });
            }
        }
        // If connected and on the correct network, toggle dropdown
        else {
            setIsOpen(!isOpen);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        setIsOpen(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                onClick={handleConnect}
                className={`font-medium px-4 py-2 rounded-md ${
                    isWrongNetwork
                        ? 'bg-red-100 text-red-600 border-red-200 hover:bg-red-200 hover:text-red-700'
                        : 'bg-emerald-50 text-emerald-500 border-emerald-100 hover:bg-emerald-100 hover:text-emerald-600'
                }`}
            >
                {isWrongNetwork ? (
                    <div className="flex items-center">
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        <span>Switch to {activeChain.name}</span>
                    </div>
                ) : isConnected && address ? (
                    <div className="flex items-center">
                        <span>
                            {address.slice(0, 6)}...
                            {address.slice(-4)}
                        </span>
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </div>
                ) : (
                    'Connect Wallet'
                )}
            </Button>

            {/* Only show dropdown if connected AND on the correct network */}
            {isOpen && isConnected && !isWrongNetwork && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                        <button
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsOpen(false)}
                        >
                            <User className="mr-2 h-4 w-4" />
                            Profile
                        </button>
                        <button
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                            onClick={handleDisconnect}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Disconnect
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
