// Import and re-export the static method
import { MegapotSDK as MegapotSDKClass } from "./MegapotSDK.js";

// Main exports for the MegaPot SDK
export { MegapotSDK } from "./MegapotSDK.js";

export const createWalletClientFromPrivateKey =
  MegapotSDKClass.createWalletClientFromPrivateKey;

export const createWalletClientFromProvider =
  MegapotSDKClass.createWalletClientFromProvider;

export type { WalletProvider } from "./MegapotSDK.js";

// Type exports
export type {
  SpendPermission,
  SpendConfig,
  TicketPurchaseResult,
  PoolPurchaseResult,
  SpendPermissionManager,
  DataApiConfig,
  PoolInfo,
  UserAllowance,
  TransactionCall,
  MegapotConfig,
  ApiResponse,
  PoolStats,
} from "./types.js";

// Constants
export * from "./constants.js";
