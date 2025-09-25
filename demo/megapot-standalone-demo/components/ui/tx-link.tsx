'use client';

import Link from 'next/link';

export function TxLink({
    hash,
    label = 'View Tx',
}: {
    hash?: string;
    label?: string;
}) {
    if (!hash) return null;
    const href = `https://basescan.org/tx/${hash}`;
    return (
        <Link
            href={href}
            target="_blank"
            className="text-xs text-blue-600 hover:underline ml-2"
        >
            {label}
        </Link>
    );
}
