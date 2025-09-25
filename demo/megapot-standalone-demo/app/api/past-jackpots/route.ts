import { env } from '@/config/env';
import { CONTRACT_ADDRESS, CONTRACT_START_BLOCK, JACKPOT_RUN_TOPIC } from '@/lib/constants';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BodySchema = z.object({
    fromBlock: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).max(1000).optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => ({}));
        BodySchema.safeParse(body || {});
        // We ignore fromBlock/limit for now; schema is parsed to validate shape

        const urlParams = new URLSearchParams({
            module: 'logs',
            action: 'getLogs',
            address: CONTRACT_ADDRESS,
            topic0: JACKPOT_RUN_TOPIC,
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
        // reverse the data
        const reversedData = data.result.reverse();

        return NextResponse.json(reversedData);
    } catch (error) {
        console.error('Error fetching from BaseScan:', error);
        return NextResponse.json(
            { message: 'Error fetching data' },
            { status: 500 }
        );
    }
}