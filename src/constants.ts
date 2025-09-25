/**
 * MegaPot SDK Constants
 * These are the default values used by the SDK. Users only need to configure
 * their wallet keys and API keys in .env, not contract addresses.
 */

// Network Constants
export const BASE_CHAIN_ID = 8453;
export const BASE_MAINNET_RPC_URL = "https://mainnet.base.org";

// Contract Addresses (Base Mainnet Production)
export const CONTRACT_ADDRESSES = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  MEGAPOT: "0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95",
  JACKPOT_POOL: "0xfb324c09c16b5f437ff612a4e8bc95b8fd6e6d5a",
  SPEND_PERMISSION_MANAGER: "0xf85210B21cC50302F477BA56686d2019dC9b67Ad",
  REFERRER: "0xa14ce36e7b135b66c3e3cb2584e777f32b15f5dc",
} as const;

// API Configuration
export const API_ENDPOINTS = {
  BASE_URL: "https://api.megapot.io",
} as const;

// Default SDK Configuration
export const DEFAULT_CONFIG = {
  GAS_LIMIT: BigInt(150000),
  MAX_RETRIES: 3,
  TIMEOUT: 15000,
} as const;

// Token Decimals
export const TOKEN_DECIMALS = {
  USDC: 6,
} as const;

// Transaction Constants
export const TX_CONSTANTS = {
  TICKET_PRICE_USD: 1, // 1 USD per ticket
} as const;

// Paymaster Configuration
export const PAYMASTER_CONFIG = {
  // Default Base network paymaster (Pimlico)
  DEFAULT_URL: "https://api.pimlico.io/v1/base/rpc",
  MAX_GAS_LIMIT: BigInt(50000), // Maximum gas to sponsor per transaction
  ENABLED: false, // Paymaster disabled by default
} as const;
