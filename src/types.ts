import { type Address, type Hash, type Hex } from "viem";

export interface SpendPermission {
  account: Address;
  spender: Address;
  token: Address;
  allowance: bigint;
  periodInDays: number;
  chainId: number;
  signature?: string;
}

export interface SpendConfig {
  dailyLimit: number; // USD amount
  ticketsPerDay: number;
  purchaseType: "solo" | "pool" | "both" | "alternating";
  duration: number; // days
  soloTicketsPerDay?: number; // For both (combined) purchases
  poolTicketsPerDay?: number; // For both (combined) purchases
}

export interface TicketPurchaseResult {
  txHash: Hash;
  ticketCount: number;
  purchaseType: "solo" | "pool";
  cost: number;
  receiptUrl?: string;
}

export interface PoolPurchaseResult extends TicketPurchaseResult {
  poolId?: string;
  participants?: number;
}

export interface SpendPermissionManager {
  address: Address;
  approve: (permission: SpendPermission) => Promise<Hash>;
  revoke: (permission: SpendPermission) => Promise<Hash>;
  getAllowance: (
    account: Address,
    spender: Address,
    token: Address,
  ) => Promise<bigint>;
}

export interface DataApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface PoolInfo {
  id: string;
  participants: number;
  maxParticipants: number;
  ticketPrice: number;
  status: "open" | "closed" | "completed";
  endTime: number;
}

export interface UserAllowance {
  token: Address;
  allowance: bigint;
  spender: Address;
  remaining: bigint;
}

export interface TransactionCall {
  to: Address;
  data: Hex;
  value: bigint;
  gas?: bigint;
  metadata?: {
    description?: string;
    transactionType?: string;
    source?: string;
    origin?: string;
    hostname?: string;
    faviconUrl?: string;
    title?: string;
  };
}

export interface PaymasterConfig {
  url: string;
  maxGasLimit?: bigint;
  enabled?: boolean;
}

export interface MegapotConfig {
  chainId: number;
  spendPermissionManagerAddress: Address;
  megapotContractAddress: Address;
  jackpotPoolContractAddress: Address;
  usdcContractAddress: Address;
  referrerAddress?: Address;
  dataApi?: DataApiConfig;
  gasLimit?: bigint;
  maxRetries?: number;
  paymaster?: PaymasterConfig;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PoolStats {
  totalPools: number;
  activePools: number;
  totalParticipants: number;
  totalVolume: number;
  averagePoolSize: number;
}
