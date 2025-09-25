import { env } from '@/config/env';
import { CONTRACT_ADDRESS, CONTRACT_START_BLOCK, PURCHASE_TICKET_TOPIC } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BodySchema = z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export async function POST(request: NextRequest) {
    const json = await request.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ message: 'Invalid request' }, { status: 400 });
    }
    const { address } = parsed.data;

    const urlParams = new URLSearchParams({
        module: 'logs',
        action: 'getLogs',
        address: CONTRACT_ADDRESS,
        topic0: PURCHASE_TICKET_TOPIC,
        apikey: env.BASESCAN_API_KEY || '',
        fromBlock: CONTRACT_START_BLOCK.toString(),
    });

    const response = await fetch(
        `https://api.basescan.org/api?${urlParams.toString()}`,
        {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }
    );

    const data = await response.json();

    // filter through the data for user address
    type BaseScanLog = {
        topics: string[];
        data: string;
        blockNumber: string;
        transactionHash: string;
    };
    const userPurchaseHistory = (data.result as BaseScanLog[]).filter(
        (log) =>
            `0x${log.topics[1].substring(26, 66).toLowerCase()}` ===
            address.toLowerCase()
    );
    return NextResponse.json(userPurchaseHistory);
}
