import { z } from 'zod';

const serverSchema = z.object({
    BASESCAN_API_KEY: z.string().optional().default(''),
    RPC_URL: z.preprocess(
        (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
        z.string().url().optional()
    ),
});

const clientSchema = z.object({
    NEXT_PUBLIC_PRIVY_APP_ID: z.string().min(1, 'NEXT_PUBLIC_PRIVY_APP_ID is required'),
    NEXT_PUBLIC_CHAIN_ID: z.string().default('8453').transform((v) => Number(v)),
    NEXT_PUBLIC_CONTRACT_ADDRESS: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid contract address'),
    NEXT_PUBLIC_ERC20_TOKEN_ADDRESS: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid ERC20 token address'),
    NEXT_PUBLIC_DEMO_MODE: z
        .string()
        .optional()
        .transform((v) => v === 'true'),
});

export const env = serverSchema.parse({
    BASESCAN_API_KEY: process.env.BASESCAN_API_KEY,
    RPC_URL: process.env.RPC_URL,
});

export const publicEnv = clientSchema.parse({
    NEXT_PUBLIC_PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_ERC20_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_ERC20_TOKEN_ADDRESS,
    NEXT_PUBLIC_DEMO_MODE: process.env.NEXT_PUBLIC_DEMO_MODE,
});


