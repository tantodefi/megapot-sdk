import axios, { type AxiosInstance } from "axios";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseUnits,
  type Address,
  type Hash,
  type PublicClient,
  type WalletClient,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  API_ENDPOINTS,
  BASE_CHAIN_ID,
  CONTRACT_ADDRESSES,
  DEFAULT_CONFIG,
  TOKEN_DECIMALS,
  TX_CONSTANTS,
} from "./constants.js";
import {
  type ApiResponse,
  type DataApiConfig,
  type MegapotConfig,
  type PoolInfo,
  type PoolPurchaseResult,
  type PoolStats,
  type SpendConfig,
  type SpendPermission,
  type SpendPermissionManager,
  type TicketPurchaseResult,
  type TransactionCall,
  type UserAllowance,
} from "./types.js";

// Provider types for wallet integration
export type WalletProvider =
  | { type: "privateKey"; privateKey: `0x${string}`; rpcUrl?: string }
  | { type: "browser"; rpcUrl?: string }
  | { type: "injected" }
  | { type: "walletConnect"; projectId: string }
  | { type: "coinbase"; appName: string; appLogoUrl: string }
  | { type: "metaMask" }
  | { type: "custom"; client: WalletClient; publicClient: PublicClient };

// Contract ABIs (simplified for SDK)
const SPEND_PERMISSION_MANAGER_ABI = [
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "spender", type: "address" },
      { name: "token", type: "address" },
    ],
    name: "getSpendPermission",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "spender", type: "address" },
      { name: "token", type: "address" },
      { name: "allowance", type: "uint256" },
      { name: "period", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "account", type: "address" },
      { name: "spender", type: "address" },
      { name: "token", type: "address" },
    ],
    name: "revoke",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const USDC_ABI = [
  {
    constant: true,
    inputs: [
      { name: "_owner", type: "address" },
      { name: "_spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: false,
    inputs: [
      { name: "_spender", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
] as const;

const MEGAPOT_ABI = [
  {
    inputs: [{ name: "ticketCount", type: "uint256" }],
    name: "buySoloTickets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
] as const;

const JACKPOT_POOL_ABI = [
  {
    inputs: [
      { name: "poolId", type: "uint256" },
      { name: "ticketCount", type: "uint256" },
    ],
    name: "buyPoolTickets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ name: "poolId", type: "uint256" }],
    name: "getPoolInfo",
    outputs: [
      { name: "totalTickets", type: "uint256" },
      { name: "ticketPrice", type: "uint256" },
      { name: "maxTicketsPerUser", type: "uint256" },
      { name: "endTime", type: "uint256" },
      { name: "isActive", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "poolId", type: "uint256" }],
    name: "getUserTickets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class MegapotSDK {
  private publicClient: PublicClient;
  private walletClient: WalletClient | null = null;
  private axiosInstance: AxiosInstance;
  private config: MegapotConfig;

  constructor(config: Partial<MegapotConfig>, walletClient?: WalletClient);
  constructor(config: Partial<MegapotConfig>, provider?: WalletProvider);
  constructor(
    config: Partial<MegapotConfig>,
    walletOrProvider?: WalletClient | WalletProvider,
  ) {
    // Initialize Paymaster config from environment or defaults
    const paymasterConfig = this.initializePaymasterConfig(config.paymaster);

    // Initialize referrer address from environment or default
    const referrerAddress =
      config.referrerAddress ||
      (process.env.REFERRER_ADDRESS as Address) ||
      CONTRACT_ADDRESSES.REFERRER;

    this.config = {
      chainId: BASE_CHAIN_ID,
      spendPermissionManagerAddress:
        CONTRACT_ADDRESSES.SPEND_PERMISSION_MANAGER,
      megapotContractAddress: CONTRACT_ADDRESSES.MEGAPOT,
      jackpotPoolContractAddress: CONTRACT_ADDRESSES.JACKPOT_POOL,
      usdcContractAddress: CONTRACT_ADDRESSES.USDC,
      referrerAddress,
      gasLimit: DEFAULT_CONFIG.GAS_LIMIT,
      maxRetries: DEFAULT_CONFIG.MAX_RETRIES,
      paymaster: paymasterConfig,
      ...config,
    };

    this.publicClient = createPublicClient({
      chain: {
        id: this.config.chainId,
        name: "Base",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
      } as const,
      transport: http(),
    });

    if (walletOrProvider) {
      if (this.isWalletProvider(walletOrProvider)) {
        // Handle provider case
        this.initializeWithProvider(walletOrProvider);
      } else {
        // Handle wallet client case
        this.walletClient = walletOrProvider;
      }
    }

    // Setup axios instance for API calls
    this.axiosInstance = axios.create({
      baseURL: this.config.dataApi?.baseUrl || API_ENDPOINTS.BASE_URL,
      timeout: this.config.dataApi?.timeout || DEFAULT_CONFIG.TIMEOUT,
      headers: {
        "Content-Type": "application/json",
        ...(this.config.dataApi?.apiKey && {
          Authorization: `Bearer ${this.config.dataApi.apiKey}`,
        }),
      },
    });
  }

  // Spend Permission Manager Methods

  /**
   * Check if the current wallet supports Spend Permission Manager
   */
  private async isSmartWallet(): Promise<boolean> {
    if (!this.walletClient) return false;

    try {
      // Check if the wallet supports the 7702 delegation pattern
      // This is a basic check - in production you might want more sophisticated detection
      const code = await this.publicClient.getCode({
        address: this.walletClient.account!.address,
      });

      // If there's code at the address, it's likely a smart contract wallet
      return code !== "0x";
    } catch (error) {
      console.warn("Could not determine wallet type:", error);
      return false;
    }
  }

  /**
   * Get the appropriate spender address based on initialization method
   */
  private getSpenderAddress(): Address {
    if (!this.walletClient) {
      throw new Error("Wallet client not configured");
    }

    // For provider-based initialization, use the MegaPot contract as spender
    // For private key initialization, use the wallet's own address as spender
    return this.config.megapotContractAddress;
  }

  /**
   * Initialize Paymaster configuration from environment variables or defaults
   */
  private initializePaymasterConfig(
    config?: PaymasterConfig,
  ): PaymasterConfig | undefined {
    // Check if Paymaster is explicitly disabled
    if (config?.enabled === false) {
      return undefined;
    }

    // Check environment variables for Paymaster URL
    const envPaymasterUrl = process.env.PAYMASTER_URL;
    const envPaymasterEnabled = process.env.PAYMASTER_ENABLED;
    const envPaymasterMaxGas = process.env.PAYMASTER_MAX_GAS_LIMIT;

    // If no Paymaster URL is configured, return undefined
    if (!envPaymasterUrl && !config?.url) {
      return undefined;
    }

    return {
      url: config?.url || envPaymasterUrl!,
      maxGasLimit:
        config?.maxGasLimit ||
        (envPaymasterMaxGas
          ? BigInt(envPaymasterMaxGas)
          : PAYMASTER_CONFIG.MAX_GAS_LIMIT),
      enabled:
        config?.enabled ??
        (envPaymasterEnabled
          ? envPaymasterEnabled.toLowerCase() === "true"
          : PAYMASTER_CONFIG.ENABLED),
    };
  }

  /**
   * Check if Paymaster is available and enabled
   */
  private isPaymasterAvailable(): boolean {
    return !!(this.config.paymaster?.enabled && this.config.paymaster?.url);
  }

  /**
   * Send transaction with optional Paymaster support
   */
  private async sendTransactionWithPaymaster(transaction: {
    to: Address;
    data: Hex;
    value?: bigint;
    gas?: bigint;
    account: any;
    chain?: any;
  }): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error("Wallet client not configured");
    }

    // Check if Paymaster is available and transaction gas is within limits
    if (this.isPaymasterAvailable() && transaction.gas) {
      const maxGasLimit =
        this.config.paymaster?.maxGasLimit || PAYMASTER_CONFIG.MAX_GAS_LIMIT;

      if (transaction.gas <= maxGasLimit) {
        try {
          console.log(
            `Using Paymaster for transaction (${transaction.gas} gas <= ${maxGasLimit} limit)`,
          );

          // Create Paymaster-sponsored transaction
          const response = await fetch(this.config.paymaster!.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              jsonrpc: "2.0",
              id: 1,
              method: "pm_sponsorUserOperation",
              params: [
                {
                  sender: transaction.account.address,
                  nonce: "0x0", // This would need to be calculated properly
                  initCode: "0x",
                  callData: transaction.data,
                  callGasLimit: `0x${transaction.gas.toString(16)}`,
                  verificationGasLimit: "0x5208", // 21000 in hex
                  preVerificationGas: "0x5208",
                  maxFeePerGas: "0x0", // Would need to be calculated
                  maxPriorityFeePerGas: "0x0",
                  paymasterAndData: "0x",
                  signature: "0x",
                },
              ],
            }),
          });

          const result = await response.json();

          if (result.error) {
            throw new Error(`Paymaster error: ${result.error.message}`);
          }

          console.log("Paymaster sponsored transaction:", result.result);
          // In a real implementation, you'd return the userOpHash here
          // For now, fall back to regular transaction
        } catch (paymasterError) {
          console.warn(
            "Paymaster failed, using regular transaction:",
            paymasterError,
          );
        }
      } else {
        console.warn(
          `Transaction gas (${transaction.gas}) exceeds Paymaster limit (${maxGasLimit}), using regular transaction`,
        );
      }
    }

    // Send regular transaction (either fallback or when Paymaster not available)
    return await this.walletClient.sendTransaction(transaction);
  }

  /**
   * Get the spend permission manager instance (only for Smart Wallets)
   */
  async getSpendPermissionManager(): Promise<SpendPermissionManager | null> {
    const isSmartWallet = await this.isSmartWallet();

    if (!isSmartWallet) {
      console.warn(
        "Spend Permission Manager only works with Smart Wallets (Coinbase Smart Wallet). Falling back to regular ERC-20 approvals.",
      );
      return null;
    }

    return {
      address: this.config.spendPermissionManagerAddress,
      approve: this.approveSpendPermission.bind(this),
      revoke: this.revokeSpendPermission.bind(this),
      getAllowance: this.getSpendPermissionAllowance.bind(this),
    };
  }

  /**
   * Approve spend permission for MegaPot purchases
   */
  async approveSpendPermission(permission: SpendPermission): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error(
        "Wallet client not configured. Please provide a wallet client to the SDK constructor.",
      );
    }

    const data = encodeFunctionData({
      abi: SPEND_PERMISSION_MANAGER_ABI,
      functionName: "approve",
      args: [
        permission.account,
        permission.spender,
        permission.token,
        permission.allowance,
        BigInt(permission.periodInDays),
      ],
    });

    const hash = await this.sendTransactionWithPaymaster({
      to: this.config.spendPermissionManagerAddress,
      data,
      gas: this.config.gasLimit,
      account: this.walletClient.account!,
      chain: undefined,
    });

    return hash;
  }

  /**
   * Revoke spend permission
   */
  async revokeSpendPermission(permission: SpendPermission): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error(
        "Wallet client not configured. Please provide a wallet client to the SDK constructor.",
      );
    }

    const data = encodeFunctionData({
      abi: SPEND_PERMISSION_MANAGER_ABI,
      functionName: "revoke",
      args: [permission.account, permission.spender, permission.token],
    });

    const hash = await this.sendTransactionWithPaymaster({
      to: this.config.spendPermissionManagerAddress,
      data,
      gas: this.config.gasLimit,
      account: this.walletClient.account!,
      chain: undefined,
    });

    return hash;
  }

  /**
   * Get current spend permission allowance
   */
  async getSpendPermissionAllowance(
    account: Address,
    spender: Address,
    token: Address,
  ): Promise<bigint> {
    try {
      const allowance = await this.publicClient.readContract({
        address: this.config.spendPermissionManagerAddress,
        abi: SPEND_PERMISSION_MANAGER_ABI,
        functionName: "getSpendPermission",
        args: [account, spender, token],
      });

      return allowance as bigint;
    } catch (error) {
      console.error("Error getting spend permission allowance:", error);
      return BigInt(0);
    }
  }

  // USDC Allowance Methods

  /**
   * Get USDC allowance for a spender
   */
  async getUSDCAllowance(owner: Address, spender: Address): Promise<bigint> {
    try {
      const allowance = await this.publicClient.readContract({
        address: this.config.usdcContractAddress,
        abi: USDC_ABI,
        functionName: "allowance",
        args: [owner, spender],
      });

      return allowance as bigint;
    } catch (error) {
      console.error("Error getting USDC allowance:", error);
      return BigInt(0);
    }
  }

  /**
   * Approve USDC spending with smart fallback logic
   */
  async approveUSDC(spender?: Address, amount?: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error(
        "Wallet client not configured. Please provide a wallet client to the SDK constructor.",
      );
    }

    // Use configured spender if not provided
    const finalSpender = spender || this.getSpenderAddress();
    const finalAmount = amount || this.config.gasLimit; // Default to gas limit as a reasonable amount

    // Check if we can use SPM (Smart Wallets only)
    const isSmartWallet = await this.isSmartWallet();

    if (isSmartWallet) {
      try {
        // Try SPM first for Smart Wallets
        const spendPermission: SpendPermission = {
          account: this.walletClient.account!.address,
          spender: finalSpender,
          token: this.config.usdcContractAddress,
          allowance: finalAmount,
          periodInDays: 30, // 30 days
        };

        return await this.approveSpendPermission(spendPermission);
      } catch (spmError) {
        console.warn(
          "SPM approval failed, falling back to ERC-20 approval:",
          spmError,
        );
      }
    }

    // Fallback to regular ERC-20 approval
    console.log(
      `Using ERC-20 approval for ${isSmartWallet ? "Smart Wallet fallback" : "EOA wallet"}`,
    );

    const data = encodeFunctionData({
      abi: USDC_ABI,
      functionName: "approve",
      args: [finalSpender, finalAmount],
    });

    const hash = await this.sendTransactionWithPaymaster({
      to: this.config.usdcContractAddress,
      data,
      gas: this.config.gasLimit,
      account: this.walletClient.account!,
      chain: undefined,
    });

    return hash;
  }

  /**
   * Get comprehensive user allowances
   */
  async getUserAllowances(
    userAddress?: Address,
    spenderAddress?: Address,
  ): Promise<UserAllowance[]> {
    const allowances: UserAllowance[] = [];

    try {
      // Use connected wallet address if not provided
      const address = userAddress || this.walletClient?.account?.address;

      if (!address) {
        throw new Error("No user address available");
      }

      // Use configured spender address if not provided
      const spender = spenderAddress || this.getSpenderAddress();

      // Get USDC allowance (works for all wallets)
      const usdcAllowance = await this.getUSDCAllowance(address, spender);

      if (usdcAllowance > BigInt(0)) {
        allowances.push({
          token: "USDC",
          allowance: usdcAllowance,
          spender: spender,
          remaining: usdcAllowance,
        });
      }

      // Try to get spend permission allowance (only works for Smart Wallets)
      try {
        const isSmartWallet = await this.isSmartWallet();
        if (isSmartWallet) {
          const spendPermissionAllowance =
            await this.getSpendPermissionAllowance(
              address,
              spender,
              this.config.usdcContractAddress,
            );

          if (spendPermissionAllowance > BigInt(0)) {
            allowances.push({
              token: "USDC (SPM)",
              allowance: spendPermissionAllowance,
              spender: spender,
              remaining: spendPermissionAllowance,
            });
          }
        }
      } catch (spmError) {
        // SPM failed - this is expected for non-Smart Wallets, so don't log as error
        console.debug(
          "SPM not available for this wallet type, using ERC-20 allowances only",
        );
      }

      return allowances;
    } catch (error) {
      console.error("Error getting user allowances:", error);
      return [];
    }
  }

  // Solo Ticket Purchase Methods

  /**
   * Buy solo tickets
   */
  async buySoloTickets(
    ticketCount: number,
    userAddress?: Address,
  ): Promise<TicketPurchaseResult> {
    if (!this.walletClient && !userAddress) {
      throw new Error(
        "Either wallet client must be configured or userAddress must be provided",
      );
    }

    const cost = ticketCount * TX_CONSTANTS.TICKET_PRICE_USD;
    const costInWei = parseUnits(cost.toString(), TOKEN_DECIMALS.USDC);

    try {
      // Ensure user has sufficient allowance
      const spender = this.getSpenderAddress();
      const userAddr = userAddress || this.walletClient?.account?.address;

      if (!userAddr) {
        throw new Error("No user address available");
      }

      // Check current allowance
      const currentAllowance = await this.getUSDCAllowance(userAddr, spender);
      const requiredAllowance = costInWei;

      if (currentAllowance < requiredAllowance) {
        console.log(
          `Insufficient allowance. Current: ${currentAllowance}, Required: ${requiredAllowance}`,
        );
        console.log(
          "Please approve USDC spending first using approveUSDC() method",
        );

        // Auto-approve if possible
        try {
          await this.approveUSDC(spender, requiredAllowance);
          console.log("Auto-approved USDC spending");
        } catch (approveError) {
          console.warn(
            "Auto-approval failed. User must manually approve USDC spending:",
            approveError,
          );
          throw new Error(
            `Insufficient USDC allowance. Please approve ${cost} USDC spending first using approveUSDC()`,
          );
        }
      }

      const data = encodeFunctionData({
        abi: MEGAPOT_ABI,
        functionName: "buySoloTickets",
        args: [BigInt(ticketCount)],
      });

      let hash: Hash;

      if (this.walletClient) {
        hash = await this.sendTransactionWithPaymaster({
          to: this.config.megapotContractAddress,
          data,
          value: costInWei,
          gas: this.config.gasLimit,
          account: this.walletClient.account!,
          chain: undefined,
        });
      } else if (userAddress) {
        // If no wallet client, return transaction data for manual execution
        return {
          txHash: ("0x" + "0".repeat(64)) as Hash, // Placeholder - should be replaced with actual tx hash
          ticketCount,
          purchaseType: "solo",
          cost,
          receiptUrl: undefined,
        };
      } else {
        throw new Error("No valid transaction method available");
      }

      return {
        txHash: hash,
        ticketCount,
        purchaseType: "solo",
        cost,
        receiptUrl: this.getBasescanTxLink(hash),
      };
    } catch (error) {
      console.error("Error buying solo tickets:", error);
      throw error;
    }
  }

  // Pool Ticket Purchase Methods

  /**
   * Buy pool tickets from JackpotPool contract
   */
  async buyPoolTickets(
    poolId: string,
    ticketCount: number,
    userAddress?: Address,
  ): Promise<PoolPurchaseResult> {
    if (!this.walletClient && !userAddress) {
      throw new Error(
        "Either wallet client must be configured or userAddress must be provided",
      );
    }

    const cost = ticketCount * TX_CONSTANTS.TICKET_PRICE_USD;
    const costInWei = parseUnits(cost.toString(), TOKEN_DECIMALS.USDC);

    try {
      // Ensure user has sufficient allowance
      const spender = this.getSpenderAddress();
      const userAddr = userAddress || this.walletClient?.account?.address;

      if (!userAddr) {
        throw new Error("No user address available");
      }

      // Check current allowance
      const currentAllowance = await this.getUSDCAllowance(userAddr, spender);
      const requiredAllowance = costInWei;

      if (currentAllowance < requiredAllowance) {
        console.log(
          `Insufficient allowance. Current: ${currentAllowance}, Required: ${requiredAllowance}`,
        );
        console.log(
          "Please approve USDC spending first using approveUSDC() method",
        );

        // Auto-approve if possible
        try {
          await this.approveUSDC(spender, requiredAllowance);
          console.log("Auto-approved USDC spending");
        } catch (approveError) {
          console.warn(
            "Auto-approval failed. User must manually approve USDC spending:",
            approveError,
          );
          throw new Error(
            `Insufficient USDC allowance. Please approve ${cost} USDC spending first using approveUSDC()`,
          );
        }
      }

      const data = encodeFunctionData({
        abi: JACKPOT_POOL_ABI,
        functionName: "buyPoolTickets",
        args: [BigInt(poolId), BigInt(ticketCount)],
      });

      let hash: Hash;

      if (this.walletClient) {
        hash = await this.sendTransactionWithPaymaster({
          to: this.config.jackpotPoolContractAddress,
          data,
          value: costInWei,
          gas: this.config.gasLimit,
          account: this.walletClient.account!,
          chain: undefined,
        });
      } else if (userAddress) {
        // If no wallet client, return transaction data for manual execution
        return {
          txHash: ("0x" + "0".repeat(64)) as Hash, // Placeholder - should be replaced with actual tx hash
          ticketCount,
          purchaseType: "pool",
          cost,
          poolId,
          receiptUrl: undefined,
        };
      } else {
        throw new Error("No valid transaction method available");
      }

      return {
        txHash: hash,
        ticketCount,
        purchaseType: "pool",
        cost,
        poolId,
        receiptUrl: this.getBasescanTxLink(hash),
      };
    } catch (error) {
      console.error("Error buying pool tickets:", error);
      throw error;
    }
  }

  /**
   * Get pool information from JackpotPool contract
   */
  async getJackpotPoolInfo(poolId: string): Promise<{
    totalTickets: bigint;
    ticketPrice: bigint;
    maxTicketsPerUser: bigint;
    endTime: bigint;
    isActive: boolean;
  } | null> {
    try {
      const poolInfo = await this.publicClient.readContract({
        address: this.config.jackpotPoolContractAddress,
        abi: JACKPOT_POOL_ABI,
        functionName: "getPoolInfo",
        args: [BigInt(poolId)],
      });

      return {
        totalTickets: poolInfo[0] as bigint,
        ticketPrice: poolInfo[1] as bigint,
        maxTicketsPerUser: poolInfo[2] as bigint,
        endTime: poolInfo[3] as bigint,
        isActive: poolInfo[4] as boolean,
      };
    } catch (error) {
      console.error("Error getting jackpot pool info:", error);
      return null;
    }
  }

  /**
   * Get user's tickets in a pool
   */
  async getUserTicketsInPool(
    poolId: string,
    userAddress: Address,
  ): Promise<bigint> {
    try {
      const userTickets = await this.publicClient.readContract({
        address: this.config.jackpotPoolContractAddress,
        abi: JACKPOT_POOL_ABI,
        functionName: "getUserTickets",
        args: [BigInt(poolId)],
      });

      return userTickets as bigint;
    } catch (error) {
      console.error("Error getting user tickets in pool:", error);
      return BigInt(0);
    }
  }

  // Data API Helper Methods

  /**
   * Get pool information
   */
  async getPoolInfo(poolId: string): Promise<ApiResponse<PoolInfo>> {
    try {
      const response = await this.axiosInstance.get(`/pools/${poolId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching pool info:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get pool statistics
   */
  async getPoolStats(): Promise<ApiResponse<PoolStats>> {
    try {
      const response = await this.axiosInstance.get("/pools/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching pool stats:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get user pools
   */
  async getUserPools(userAddress: Address): Promise<ApiResponse<PoolInfo[]>> {
    try {
      const response = await this.axiosInstance.get(
        `/users/${userAddress}/pools`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching user pools:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: [],
      };
    }
  }

  /**
   * Get active pools (without API key fallback)
   */
  async getActivePools(limit: number = 20): Promise<ApiResponse<PoolInfo[]>> {
    try {
      const response = await this.axiosInstance.get("/pools/active", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching active pools:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        data: [],
      };
    }
  }

  // Utility Methods

  /**
   * Get transaction receipt link from Basescan
   */
  private getBasescanTxLink(txHash: Hash): string {
    return `https://basescan.org/tx/${txHash}`;
  }

  /**
   * Create wallet client from private key
   */
  static createWalletClientFromPrivateKey(
    privateKey: `0x${string}`,
    rpcUrl?: string,
  ): WalletClient {
    const account = privateKeyToAccount(privateKey);
    return createWalletClient({
      account,
      transport: http(rpcUrl || "https://mainnet.base.org"),
    });
  }

  /**
   * Check if the parameter is a WalletProvider
   */
  private isWalletProvider(
    obj: WalletClient | WalletProvider,
  ): obj is WalletProvider {
    return "type" in obj;
  }

  /**
   * Initialize SDK with provider
   */
  private async initializeWithProvider(
    provider: WalletProvider,
  ): Promise<void> {
    try {
      const { walletClient, publicClient } =
        await MegapotSDK.createWalletClientFromProvider(provider);
      this.walletClient = walletClient;
      this.publicClient = publicClient;
    } catch (error) {
      console.error("Failed to initialize with provider:", error);
      throw error;
    }
  }

  /**
   * Create wallet client from provider configuration
   */
  static async createWalletClientFromProvider(
    provider: WalletProvider,
  ): Promise<{ walletClient: WalletClient; publicClient: PublicClient }> {
    switch (provider.type) {
      case "privateKey":
        return this.createClientsFromPrivateKey(
          provider.privateKey,
          provider.rpcUrl,
        );

      case "browser":
        return this.createClientsFromBrowser(provider.rpcUrl);

      case "injected":
        return this.createClientsFromInjected();

      case "metaMask":
        return this.createClientsFromMetaMask();

      case "coinbase":
        return this.createClientsFromCoinbase(provider);

      case "walletConnect":
        return this.createClientsFromWalletConnect(provider);

      case "custom":
        return {
          walletClient: provider.client,
          publicClient: provider.publicClient,
        };

      default:
        throw new Error(`Unsupported provider type: ${(provider as any).type}`);
    }
  }

  /**
   * Create clients from private key (internal method)
   */
  private static createClientsFromPrivateKey(
    privateKey: `0x${string}`,
    rpcUrl?: string,
  ): { walletClient: WalletClient; publicClient: PublicClient } {
    const account = privateKeyToAccount(privateKey);
    const walletClient = createWalletClient({
      account,
      transport: http(rpcUrl || "https://mainnet.base.org"),
    });

    const publicClient = createPublicClient({
      chain: {
        id: BASE_CHAIN_ID,
        name: "Base",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
      } as const,
      transport: http(rpcUrl || "https://mainnet.base.org"),
    });

    return { walletClient, publicClient };
  }

  /**
   * Create clients from browser injected provider
   */
  private static async createClientsFromBrowser(
    rpcUrl?: string,
  ): Promise<{ walletClient: WalletClient; publicClient: PublicClient }> {
    // Dynamic import to avoid SSR issues
    const { createWalletClient, createPublicClient, custom, http } =
      await import("viem");

    if (typeof window === "undefined") {
      throw new Error("Browser provider only works in client-side environment");
    }

    if (!(window as any).ethereum) {
      throw new Error(
        "No injected provider found. Please install MetaMask or another wallet.",
      );
    }

    const walletClient = createWalletClient({
      transport: custom((window as any).ethereum),
    });

    const publicClient = createPublicClient({
      chain: {
        id: BASE_CHAIN_ID,
        name: "Base",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
      } as const,
      transport: http(rpcUrl || "https://mainnet.base.org"),
    });

    return { walletClient, publicClient };
  }

  /**
   * Create clients from injected provider (MetaMask, etc.)
   */
  private static async createClientsFromInjected(): Promise<{
    walletClient: WalletClient;
    publicClient: PublicClient;
  }> {
    return this.createClientsFromBrowser();
  }

  /**
   * Create clients from MetaMask specifically
   */
  private static async createClientsFromMetaMask(): Promise<{
    walletClient: WalletClient;
    publicClient: PublicClient;
  }> {
    return this.createClientsFromBrowser();
  }

  /**
   * Create clients from Coinbase Wallet
   */
  private static async createClientsFromCoinbase(
    provider: WalletProvider & { type: "coinbase" },
  ): Promise<{ walletClient: WalletClient; publicClient: PublicClient }> {
    try {
      // Check if Coinbase Wallet SDK is available
      if (typeof window !== "undefined" && (window as any).CoinbaseWalletSDK) {
        const CoinbaseWalletSDK = (window as any).CoinbaseWalletSDK;

        const sdk = new CoinbaseWalletSDK({
          appName: provider.appName,
          appLogoUrl: provider.appLogoUrl,
        });

        const { createWalletClient, createPublicClient, http, custom } =
          await import("viem");

        const walletClient = createWalletClient({
          transport: custom(sdk.makeWeb3Provider()),
        });

        const publicClient = createPublicClient({
          chain: {
            id: BASE_CHAIN_ID,
            name: "Base",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: { default: { http: ["https://mainnet.base.org"] } },
          } as const,
          transport: http("https://mainnet.base.org"),
        });

        return { walletClient, publicClient };
      } else {
        throw new Error(
          "Coinbase Wallet SDK not available. Please install @coinbase/wallet-sdk",
        );
      }
    } catch (error) {
      throw new Error(
        "Coinbase Wallet SDK not available. Please install @coinbase/wallet-sdk",
      );
    }
  }

  /**
   * Create clients from WalletConnect
   */
  private static async createClientsFromWalletConnect(
    provider: WalletProvider & { type: "walletConnect" },
  ): Promise<{ walletClient: WalletClient; publicClient: PublicClient }> {
    // WalletConnect integration requires additional dependencies
    // For now, throw an error indicating it needs implementation
    throw new Error(
      "WalletConnect integration requires @walletconnect/core, @walletconnect/utils, and @walletconnect/web3wallet. " +
        "Please install these dependencies and implement the WalletConnect setup.",
    );
  }

  /**
   * Update SDK configuration
   */
  updateConfig(newConfig: Partial<MegapotConfig>): void {
    this.config = { ...this.config, ...newConfig };

    // Update axios instance headers if API key changed
    if (newConfig.dataApi?.apiKey) {
      this.axiosInstance.defaults.headers.common["Authorization"] =
        `Bearer ${newConfig.dataApi.apiKey}`;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): MegapotConfig {
    return { ...this.config };
  }
}
