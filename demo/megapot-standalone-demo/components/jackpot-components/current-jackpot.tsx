import { useJackpotAmount } from '@/features/jackpot/queries';
import { useTokenSymbol } from '@/features/token/queries';
import { Card, CardContent } from '../ui/card';
import { Loading } from '../ui/loading';

export function CurrentJackpot() {
    const { data: jackpotAmount, isLoading, error } = useJackpotAmount();
    const {
        data: tokenSymbol,
        isLoading: isLoadingSymbol,
        error: errorSymbol,
    } = useTokenSymbol();
    const displayName = tokenSymbol ?? 'TOKEN'; // Default name

    let content;
    if (isLoading || isLoadingSymbol) {
        // Use Loading component, adjust styling as needed
        content = (
            <Loading className="h-8 w-8 mx-auto" containerClassName="p-0" />
        );
    } else if (error || errorSymbol) {
        content = <p className="text-4xl font-bold text-red-500">Error</p>;
    } else if (jackpotAmount !== undefined) {
        // Format the amount with the token name
        content = (
            <p className="text-4xl font-bold text-emerald-500">
                {jackpotAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}{' '}
                {displayName}
            </p>
        );
    } else {
        // Empty state when no data yet
        content = (
            <div className="text-sm text-gray-500">
                Jackpot amount not available. Please try again shortly.
            </div>
        );
    }

    return (
        <Card className="bg-white rounded-xl shadow-sm">
            <CardContent className="p-6">
                <div className="text-center">
                    <h2 className="text-lg font-medium text-gray-500 mb-2">
                        Current Jackpot
                    </h2>
                    {content}
                </div>
            </CardContent>
        </Card>
    );
}
