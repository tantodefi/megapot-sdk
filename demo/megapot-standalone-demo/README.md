# Megapot Integration Demo

## Quickstart

1. Clone and install
```
git clone <repo-url>
cd megapot-standalone-demo && pnpm install
```

2. Configure environment
```
cp env.example .env.local
```
Fill in required values:
- `NEXT_PUBLIC_PRIVY_APP_ID` (from Privy)
- `NEXT_PUBLIC_CONTRACT_ADDRESS` and `NEXT_PUBLIC_ERC20_TOKEN_ADDRESS`
- Optional: `RPC_URL` and `BASESCAN_API_KEY`

3. Run
```
pnpm dev
```

4. Build
```
pnpm build
```

## Environment Variables

Client-safe:
- `NEXT_PUBLIC_PRIVY_APP_ID` – required
- `NEXT_PUBLIC_CHAIN_ID` – default 8453 (Base)
- `NEXT_PUBLIC_CONTRACT_ADDRESS` – required
- `NEXT_PUBLIC_ERC20_TOKEN_ADDRESS` – required
- `NEXT_PUBLIC_DEMO_MODE` – optional, set `true` to disable writes

Server-only:
- `RPC_URL` – optional; falls back to public RPC
- `BASESCAN_API_KEY` – optional; recommended for higher rate limits

## Notes

- Writes are disabled when `NEXT_PUBLIC_DEMO_MODE=true`.
- Approvals default to the exact required amount.
- On-chain reads use a shared viem client configured per chain.
Want to run your own jackpot?  Or integrate ours into your own app and take a cut of each ticket sold?  We got you covered!

Follow our getting started guide at [docs.megapot.io](https://docs.megapot.io/developers/start-here)

Check out out the live demo: [https://megapot-standalone-demo.vercel.app/](https://megapot-standalone-demo.vercel.app/)

Contact us on Telegram [@megapot_io](https://t.me/megapot_io)

This is a demo of the Megapot standalone integration. It is a simple demo that shows how to integrate the Megapot contract into a Next.js application.

This can be adapted to use for any jackpot contract that uses the MEGAPOT contract.  Just update the contract address in /lib/constants.ts

This does not use the UI Kit, you can view that demo at [https://megapot-standalone-demo.vercel.app/](https://megapot-standalone-demo.vercel.app/) and view the github repo at [https://github.com/coordinationlabs/megapot-standalone-demo](https://github.com/coordinationlabs/megapot-standalone-demo)

## How to earn 10% of each ticket sold

- Update [./lib/constants.ts](./lib/constants.ts) with your own referral address

How this works:

- The purchaseTickets function that is called when a user purchases a ticket has 3 parameters:
  - `recipient`: The address of the user purchasing the ticket
  - `value`: The amount of USDC sent to purchase the tickets (1_000_000 Szabo per ticket)
  - `referrer`: The address of the referrer (you)

- The referrer address will receive 10% of the ticket price as a referral fee

## Getting Started

```bash
# Clone the repository
git clone git@github.com:coordinationlabs/megapot-standalone-demo.git

# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install

# Create a .env.local file and add add your Privy app id
cp env.example .env.local

# Run the development server
pnpm run dev
```

## App Structure

```
/app
    /layout.tsx - Layout for the app
    /page.tsx - Main page/entry point of the app
    /providers.tsx - Providers for the app (Privy, wagmi, viem, etc.)
    /viem-client.ts - Viem public client for querying the contract
    /api - API routes
        /past-jackpots/route.ts - API route for past jackpot results
        /user-purchase-history/route.ts - API route for user purchase history
    /jackpot - Jackpot page
    /liquidity - Liquidity page
    /components - Shared components
        /ui - UI components (cards, etc.)
        /history-component.tsx - History component
        /history-components - History components
            /user-purchase-history.tsx - User purchase history
        /jackpot-component.tsx - Main jackpot page component
        /jackpot-components
            /buy-tickets.tsx - Buy tickets from (quantity, submit button)
            /countdown.tsx - Countdown
            /current-jackpot.tsx - Current jackpot size
            /last-jackpot.tsx - Last jackpot results
            /ticket-price.tsx - Ticket cost
            /winning-odds.tsx - Winning odds
            /withdraw-winnings.tsx - Withdraw winnings
        /lp-component.tsx - Main liquidity page
        /lp-components
            /lp-deposit-form
                /deposit-input.tsx - Deposit input
                /form-button.tsx - Form button
                /min-lp-deposit.tsx - Minimum LP deposit
                /risk-percentage.tsx - Risk percentage select
            /user-lp-balance
                /adjust-risk-percentage.tsx - Adjust risk input
                /lp-balance.tsx - LP balance
            /lp-deposit-form.tsx - LP deposit form
            /lp-pool-status.tsx - LP pool status (Open/Closed)
            /user-lp-balances.tsx - User LP balances
        /lib
            /abi.ts - Contract ABI
            /constants.ts - Contract address and other constants
            /contract.ts - Contract interaction functions
```