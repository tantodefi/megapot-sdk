# MegaPot SDK

A comprehensive TypeScript SDK for interacting with MegaPot lottery system, managing spend permissions, and handling ticket purchases on Base network.

## Features

- 🛡️ **Spend Permission Management**: Approve, revoke, and check spend permissions
- 💰 **USDC Allowance Management**: Get and manage USDC allowances
- 🎫 **Solo Ticket Purchases**: Buy individual lottery tickets
- 🏊 **Pool Ticket Purchases**: Join or create lottery pools
- 📊 **Data API Integration**: Fetch pool statistics and information
- 🔧 **Flexible Configuration**: Works with or without wallet client
- ⚡ **TypeScript Support**: Full type safety and IntelliSense

## Installation

```bash
npm install megapot-sdk
# or
yarn add megapot-sdk
```

## Quick Start

### Basic Setup (Recommended)

#### Option 1: Using Existing Wallet Provider (Recommended)

```typescript
import { MegapotSDK } from 'megapot-sdk'

// For MetaMask, Coinbase Wallet, or other injected providers
const sdk = new MegapotSDK({}, { type: 'injected' })

// For specific wallet types
const sdk = new MegapotSDK({}, { type: 'metaMask' })
const sdk = new MegapotSDK({}, {
  type: 'coinbase',
  appName: 'My App',
  appLogoUrl: 'https://myapp.com/logo.png'
})
```

#### Option 2: Using Private Key (Server-side or Direct Wallet)

```typescript
import { MegapotSDK, createWalletClientFromPrivateKey } from 'megapot-sdk'

// Create wallet client from private key
const walletClient = createWalletClientFromPrivateKey('0x' + privateKey)

// Create SDK instance with default production addresses
const sdk = new MegapotSDK({}, walletClient)
// That's it! SDK automatically uses production contract addresses
```

### Setup with Environment Variables

```typescript
// Only configure your wallet and API key - contracts are handled automatically
const sdk = new MegapotSDK({
  dataApi: {
    apiKey: process.env.MEGAPOT_DATA_API_KEY // Optional
  }
})
```

### Advanced Setup (Custom Contracts)

```typescript
// Only if using testnet or custom deployments
const sdk = new MegapotSDK({
  spendPermissionManagerAddress: '0x...', // Custom address
  megapotContractAddress: '0x...',       // Custom address
  jackpotPoolContractAddress: '0x...',    // Custom address
  dataApi: {
    apiKey: 'your-api-key' // Optional
  }
}, walletClient)
```

## API Reference

### Spend Permission Management

#### Get Spend Permission Manager

```typescript
const spm = sdk.getSpendPermissionManager()
console.log('Manager address:', spm.address)
```

#### Approve Spend Permission

```typescript
const permission = {
  account: '0xUserAddress',
  spender: '0xSpenderAddress',
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
  allowance: BigInt(10 * 1_000_000), // 10 USDC
  periodInDays: 1,
  chainId: 8453
}

const txHash = await sdk.approveSpendPermission(permission)
console.log('Approval tx:', txHash)
```

#### Revoke Spend Permission

```typescript
const txHash = await sdk.revokeSpendPermission(permission)
console.log('Revoke tx:', txHash)
```

#### Get Spend Permission Allowance

```typescript
const allowance = await sdk.getSpendPermissionAllowance(
  '0xUserAddress',
  '0xSpenderAddress',
  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
)
console.log('Remaining allowance:', allowance.toString())
```

### USDC Allowance Management

#### Get USDC Allowance

```typescript
const allowance = await sdk.getUSDCAllowance(
  '0xUserAddress',
  '0xSpenderAddress'
)
console.log('USDC allowance:', allowance.toString())
```

#### Approve USDC Spending

```typescript
const txHash = await sdk.approveUSDC(
  '0xSpenderAddress',
  BigInt(10 * 1_000_000) // 10 USDC
)
console.log('USDC approval tx:', txHash)
```

#### Get All User Allowances

```typescript
const allowances = await sdk.getUserAllowances(
  '0xUserAddress',
  '0xSpenderAddress'
)

allowances.forEach(allowance => {
  console.log(`Token: ${allowance.token}`)
  console.log(`Allowance: ${allowance.allowance.toString()}`)
  console.log(`Remaining: ${allowance.remaining.toString()}`)
})
```

### Ticket Purchases

#### Buy Solo Tickets

```typescript
const result = await sdk.buySoloTickets(5)
console.log(`Bought ${result.ticketCount} solo tickets`)
console.log(`Transaction: ${result.txHash}`)
console.log(`Cost: $${result.cost}`)
console.log(`Receipt: ${result.receiptUrl}`)
```

#### Buy Pool Tickets

```typescript
const result = await sdk.buyPoolTickets('123', 5)
console.log(`Bought ${result.ticketCount} pool tickets for pool ${result.poolId}`)
console.log(`Transaction: ${result.txHash}`)
console.log(`Cost: $${result.cost}`)
console.log(`Receipt: ${result.receiptUrl}`)
```

### Pool Information

#### Get Pool Information

```typescript
const poolInfo = await sdk.getJackpotPoolInfo('123')
if (poolInfo) {
  console.log(`Total tickets: ${poolInfo.totalTickets}`)
  console.log(`Ticket price: ${poolInfo.ticketPrice}`)
  console.log(`Max tickets per user: ${poolInfo.maxTicketsPerUser}`)
  console.log(`End time: ${new Date(Number(poolInfo.endTime) * 1000).toISOString()}`)
  console.log(`Is active: ${poolInfo.isActive}`)
}
```

#### Get User's Tickets in Pool

```typescript
const userTickets = await sdk.getUserTicketsInPool('123', '0xUserAddress')
console.log(`User has ${userTickets} tickets in pool`)
```

### Data API Integration

#### Get Pool Information

```typescript
const poolInfo = await sdk.getPoolInfo('123')
if (poolInfo.success && poolInfo.data) {
  console.log(`Pool participants: ${poolInfo.data.participants}`)
  console.log(`Max participants: ${poolInfo.data.maxParticipants}`)
  console.log(`Ticket price: $${poolInfo.data.ticketPrice}`)
  console.log(`Status: ${poolInfo.data.status}`)
}
```

#### Get Pool Statistics

```typescript
const stats = await sdk.getPoolStats()
if (stats.success && stats.data) {
  console.log(`Total pools: ${stats.data.totalPools}`)
  console.log(`Active pools: ${stats.data.activePools}`)
  console.log(`Total participants: ${stats.data.totalParticipants}`)
  console.log(`Total volume: $${stats.data.totalVolume}`)
}
```

#### Get User Pools

```typescript
const userPools = await sdk.getUserPools('0xUserAddress')
if (userPools.success && userPools.data) {
  userPools.data.forEach(pool => {
    console.log(`Pool ID: ${pool.id}`)
    console.log(`Participants: ${pool.participants}/${pool.maxParticipants}`)
    console.log(`Status: ${pool.status}`)
  })
}
```

#### Get Active Pools

```typescript
const activePools = await sdk.getActivePools(10)
if (activePools.success && activePools.data) {
  activePools.data.forEach(pool => {
    console.log(`Pool ID: ${pool.id} - ${pool.participants}/${pool.maxParticipants} participants`)
  })
}
```

### Configuration Management

#### Update Configuration

```typescript
sdk.updateConfig({
  gasLimit: BigInt(200000),
  maxRetries: 5
})
```

#### Get Current Configuration

```typescript
const config = sdk.getConfig()
console.log('Current config:', config)
```

## Method Signatures

### Core Methods
- `getSpendPermissionManager(): SpendPermissionManager` - Get spend permission manager instance
- `approveSpendPermission(permission: SpendPermission): Promise<Hash>` - Approve spend permission
- `revokeSpendPermission(permission: SpendPermission): Promise<Hash>` - Revoke spend permission
- `getSpendPermissionAllowance(account: Address, spender: Address, token: Address): Promise<bigint>` - Get spend permission allowance
- `getUSDCAllowance(owner: Address, spender: Address): Promise<bigint>` - Get USDC allowance
- `approveUSDC(spender: Address, amount: bigint): Promise<Hash>` - Approve USDC spending
- `getUserAllowances(userAddress: Address, spenderAddress: Address): Promise<UserAllowance[]>` - Get all user allowances
- `buySoloTickets(ticketCount: number, userAddress?: Address): Promise<TicketPurchaseResult>` - Buy solo tickets
- `buyPoolTickets(poolId: string, ticketCount: number, userAddress?: Address): Promise<PoolPurchaseResult>` - Buy pool tickets
- `getJackpotPoolInfo(poolId: string): Promise<PoolInfo | null>` - Get pool information
- `getUserTicketsInPool(poolId: string, userAddress: Address): Promise<bigint>` - Get user's tickets in pool

### Data API Methods
- `getPoolInfo(poolId: string): Promise<ApiResponse<PoolInfo>>` - Get pool information
- `getPoolStats(): Promise<ApiResponse<PoolStats>>` - Get pool statistics
- `getUserPools(userAddress: Address): Promise<ApiResponse<PoolInfo[]>>` - Get user's pools
- `getActivePools(limit?: number): Promise<ApiResponse<PoolInfo[]>>` - Get active pools

### Configuration Methods
- `updateConfig(newConfig: Partial<MegapotConfig>): void` - Update SDK configuration
- `getConfig(): MegapotConfig` - Get current configuration

### Static Utility Methods
- `MegapotSDK.createWalletClientFromPrivateKey(privateKey: string, rpcUrl?: string): WalletClient` - Create wallet client
- `MegapotSDK.createWalletClientFromProvider(provider: WalletProvider): Promise<{walletClient: WalletClient, publicClient: PublicClient}>` - Create clients from provider

## Configuration

### Simplified Configuration (Recommended)

```typescript
// Most users only need to configure their wallet and optional API key
const sdk = new MegapotSDK({
  // Optional: Only needed for custom deployments or testnets
  // spendPermissionManagerAddress: '0x...', // Uses production by default
  // megapotContractAddress: '0x...',       // Uses production by default
  // jackpotPoolContractAddress: '0x...',    // Uses production by default
  // usdcContractAddress: '0x...',          // Uses production by default

  // Optional: Custom configuration
  gasLimit: BigInt(200000), // Custom gas limit
  maxRetries: 5,           // Retry failed requests

  // Optional: API configuration
  dataApi: {
    apiKey: 'your-api-key',  // For pool data queries
    timeout: 15000          // Request timeout
  }
}, walletClient)
```

### Environment-Based Configuration

```typescript
// Load from environment variables (only configure what's different from defaults)
const sdk = new MegapotSDK({
  dataApi: {
    apiKey: process.env.MEGAPOT_DATA_API_KEY // Optional
  }
})
```

### Production Defaults

The SDK automatically uses these production addresses and settings:

```typescript
const sdk = new MegapotSDK({}, walletClient)
// Equivalent to:
const sdk = new MegapotSDK({
  chainId: 8453,                           // Base mainnet
  spendPermissionManagerAddress: '0xf85210B21cC50302F477BA56686d2019dC9b67Ad',
  megapotContractAddress: '0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95',
  jackpotPoolContractAddress: '0xfb324c09c16b5f437ff612a4e8bc95b8fd6e6d5a',
  usdcContractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  gasLimit: BigInt(150000),               // Default gas limit
  maxRetries: 3,                         // Default retry count
  timeout: 15000                         // Default request timeout
}, walletClient)
```

## Error Handling

The SDK provides comprehensive error handling:

```typescript
try {
  const result = await sdk.buySoloTickets(5)
  console.log('Success:', result)
} catch (error) {
  if (error instanceof Error) {
    console.error('Transaction failed:', error.message)
  } else {
    console.error('Unknown error:', error)
  }
}
```

## Wallet Provider Support

The SDK supports multiple wallet providers out of the box:

### Supported Providers

- **`'injected'`** - MetaMask, Coinbase Wallet, or any injected provider
- **`'metaMask'`** - Specifically for MetaMask
- **`'coinbase'`** - Coinbase Wallet with app branding
- **`'browser'`** - Browser's native injected provider
- **`'privateKey'`** - Direct private key (server-side, testing)
- **`'custom'`** - Your own wallet and public clients

### Provider Examples

```typescript
// MetaMask or other injected wallets
const sdk = new MegapotSDK({}, { type: 'injected' })

// MetaMask specifically
const sdk = new MegapotSDK({}, { type: 'metaMask' })

// Coinbase Wallet with branding
const sdk = new MegapotSDK({}, {
  type: 'coinbase',
  appName: 'My DeFi App',
  appLogoUrl: 'https://myapp.com/logo.png'
})

// Private key (for server-side or testing)
const sdk = new MegapotSDK({}, {
  type: 'privateKey',
  privateKey: '0x...',
  rpcUrl: 'https://mainnet.base.org' // optional
})

// Custom clients (advanced users)
const sdk = new MegapotSDK({}, {
  type: 'custom',
  client: myWalletClient,
  publicClient: myPublicClient
})
```

## 🧪 Comprehensive Testing Suite

The SDK includes a robust test suite that validates all provider integrations:

```bash
# Run comprehensive provider tests
npm run test
```

**Test Coverage:**
- ✅ **Private Key Provider** - Server-side and direct wallet usage
- ✅ **Injected Provider** - MetaMask, Coinbase Wallet, browser extensions
- ✅ **MetaMask Provider** - Specific MetaMask integration
- ✅ **Coinbase Provider** - Coinbase Wallet with app branding
- ✅ **Browser Provider** - Native browser injected providers
- ✅ **Custom Provider** - Advanced users with custom wallet clients
- ✅ **WalletConnect Provider** - Error handling for missing dependencies
- ✅ **Paymaster Integration** - Environment variable and SDK configuration
- ✅ **Configuration Management** - Dynamic config updates
- ✅ **Contract Interactions** - Real blockchain contract calls
- ✅ **Transaction Building** - Proper transaction encoding
- ✅ **Error Handling** - Comprehensive error scenarios

**Test Results:**
- ✅ All provider types initialize correctly
- ✅ Contract reading functions work with all providers
- ✅ Transaction building succeeds across providers
- ✅ Configuration management is seamless
- ✅ Paymaster integration works with environment variables and SDK config
- ⚠️ Expected failures (API 404s, insufficient funds) handled gracefully

## 🛡️ Smart Wallet Integration & Fallbacks

### Spend Permission Manager (SPM) Support

The SDK intelligently handles both Smart Wallets and regular EOA wallets:

#### **Smart Wallet Detection**
- ✅ **Automatic Detection** - Detects Coinbase Smart Wallets vs regular EOAs
- ✅ **SPM for Smart Wallets** - Uses delegation-based permissions for better UX
- ✅ **ERC-20 Fallback** - Automatically falls back to standard approvals for EOAs

#### **Spender Address Resolution**
```typescript
// The SDK automatically determines the correct spender address:

// For Provider-based initialization (MetaMask, Coinbase, etc.)
const sdk = new MegapotSDK({}, { type: "injected" });
const spender = sdk.getSpenderAddress(); // Returns MegaPot contract address

// For Private Key initialization
const sdk = new MegapotSDK({}, { type: "privateKey", privateKey: "0x..." });
const spender = sdk.getSpenderAddress(); // Returns wallet address
```

#### **Smart Approval Logic**
```typescript
// The SDK tries SPM first, then falls back to ERC-20
await sdk.approveUSDC(spender, amount);

// For Smart Wallets: Tries SPM → Falls back to ERC-20
// For EOA Wallets: Uses ERC-20 directly
```

#### **Wallet Compatibility Matrix**
| Wallet Type | SPM Support | Fallback Method | Status |
|-------------|-------------|-----------------|---------|
| **Coinbase Smart Wallet** | ✅ Native | ERC-20 | **Preferred** |
| **MetaMask** | ❌ | ERC-20 | **Supported** |
| **WalletConnect** | ❌ | ERC-20 | **Supported** |
| **Injected Wallets** | ❌ | ERC-20 | **Supported** |
| **Private Key** | ❌ | ERC-20 | **Supported** |

### 🔧 Latest Fixes & Improvements (v2.1.0)

**Major Fixes:**
- ✅ **Console Warnings Eliminated** - Removed all MetaMask SDK and React Native dependency warnings
- ✅ **Enhanced Allowances UI** - Complete redesign with better spender visibility and information display
- ✅ **Smart Error Handling** - Contract reverts are handled gracefully without console errors
- ✅ **Improved Button Styling** - Consistent fonts, spacing, and visual hierarchy
- ✅ **Provider Optimization** - Removed wagmi connector dependencies, using Privy exclusively

**UI/UX Enhancements:**
- **Allowance Display Overhaul**:
  - Clear spender address visibility with truncated and full address options
  - Visual badges distinguishing SPM vs ERC-20 allowances
  - Status indicators (✅ Active / ❌ None) for quick assessment
  - Better layout with improved readability and information density
- **Button Consistency**:
  - Uniform `font-semibold text-sm px-4 py-2 h-10` styling across all buttons
  - Improved spacing with `gap-3` between button groups
  - Enhanced visual feedback and disabled states

**Technical Improvements:**
- **Smart Wallet Detection**: Advanced bytecode analysis for Smart Wallet vs EOA detection
- **Graceful Fallbacks**: SPM failures handled silently with ERC-20 fallbacks
- **Auto-Approval Logic**: Intelligent allowance checking and automatic approval for purchases
- **Provider Agnostic**: Seamless compatibility with all wallet types (MetaMask, Coinbase, etc.)
- **Error Resilience**: Comprehensive error handling without console pollution

## 💰 Paymaster Integration

The SDK includes optional Paymaster support for sponsoring gas fees on behalf of users.

### Configuration

#### Environment Variables
```bash
# Set your Paymaster URL (optional)
PAYMASTER_URL=https://api.pimlico.io/v1/base/rpc?apikey=YOUR_API_KEY

# Optional settings
PAYMASTER_ENABLED=true          # Enable/disable paymaster (default: false)
PAYMASTER_MAX_GAS_LIMIT=50000   # Max gas to sponsor per transaction
```

#### SDK Configuration
```typescript
import { MegapotSDK } from 'megapot-sdk';

const sdk = new MegapotSDK(
  {
    // ... other config
  },
  {
    paymaster: {
      url: "https://your-paymaster-url.com/rpc",
      maxGasLimit: BigInt(50000),  // Max gas to sponsor
      enabled: true,               // Enable paymaster
    },
  },
);
```

### How It Works

1. **Automatic Detection**: SDK checks if Paymaster is configured and enabled
2. **Gas Limit Check**: Only sponsors transactions within the configured gas limit
3. **Smart Fallback**: Falls back to regular transactions if Paymaster fails
4. **Provider Agnostic**: Works with all wallet types (MetaMask, Coinbase, etc.)

### Paymaster Providers

#### Recommended: Pimlico
```bash
# Sign up at https://pimlico.io/
PAYMASTER_URL=https://api.pimlico.io/v1/base/rpc?apikey=YOUR_API_KEY
PAYMASTER_ENABLED=true
PAYMASTER_MAX_GAS_LIMIT=50000
```

#### Other Providers
- **Alchemy**: `https://your-app-id.g.alchemy.com/v2/`
- **Biconomy**: `https://paymaster.biconomy.io/api/v1/`
- **Custom**: Any ERC-4337 compatible Paymaster RPC

### Usage Examples

#### Basic Usage
```typescript
// SDK automatically uses Paymaster if configured
await sdk.buySoloTickets(5); // Gas fees sponsored if Paymaster enabled
```

#### Manual Control
```typescript
// Check if Paymaster is available
const isPaymasterAvailable = sdk.isPaymasterAvailable();
if (isPaymasterAvailable) {
  console.log("Paymaster will sponsor gas fees");
} else {
  console.log("User will pay gas fees");
}
```

#### Custom Configuration
```typescript
const sdk = new MegapotSDK(
  { /* config */ },
  {
    paymaster: {
      url: "https://custom-paymaster.com/rpc",
      maxGasLimit: BigInt(75000), // Higher limit for complex transactions
      enabled: true,
    },
  },
);
```

## 🚀 Live Demo Integration

The SDK includes a complete Next.js demo application located at `/demo/megapot-standalone-demo/`:

### Demo Features
- **🔗 Wallet Integration** - Seamless Privy authentication with MetaMask, Coinbase Wallet, etc.
- **💰 Enhanced Allowance UI** - New redesigned interface showing spender addresses clearly
- **🎫 Smart Ticket Purchases** - Auto-approval logic with SPM/ERC-20 fallbacks
- **📱 Social Incentives** - Generate and share purchase messages for rewards
- **🔄 Real-time Contract Calls** - Live Base mainnet interactions with error handling
- **🛡️ Provider Agnostic** - Works with all major wallet types without console errors

### Demo Pages
- **Jackpot** - Main jackpot interface with live prize tracking
- **Liquidity** - LP pool management and participation
- **History** - Purchase history and transaction tracking
- **SDK Demo** - Interactive SDK testing with enhanced allowances UI

### Running the Demo
```bash
# Navigate to the demo directory
cd examples/megapot-sdk/demo/megapot-standalone-demo

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Get your Privy App ID:
# 1. Go to https://privy.io/
# 2. Create a new app or select existing
# 3. Copy your App ID from the dashboard
# 4. Replace YOUR_ACTUAL_PRIVY_APP_ID_HERE in .env.local

# Start the development server
npm run dev
```

### 🚨 Important Setup Notes
- **Privy App ID Required**: The demo requires a valid Privy App ID to function
- **Base Mainnet**: Demo uses Base mainnet for real contract interactions
- **Test Mode Available**: Set `NEXT_PUBLIC_DEMO_MODE=true` for simulated transactions
- **Wallet Support**: Works with MetaMask, Coinbase Wallet, and other injected providers

### Integration Benefits
- ✅ **Zero Configuration** - Automatic wallet detection and setup
- ✅ **Clean Console** - No React Native or MetaMask SDK warnings
- ✅ **Smart Fallbacks** - SPM for Smart Wallets, ERC-20 for EOAs
- ✅ **Enhanced UI** - Professional allowances display with spender visibility
- ✅ **Real Contract Calls** - Production Base mainnet interactions
- ✅ **Error Resilience** - Graceful handling of all failure scenarios
- ✅ **Paymaster Support** - Optional gas fee sponsorship for user transactions

### 🎨 Enhanced Allowance UI Features

The demo includes a completely redesigned allowances interface:

**Visual Improvements:**
- **Clear Spender Display**: Both truncated (10+8 chars) and full address options
- **Smart Badges**: Visual distinction between SPM and ERC-20 allowances
- **Status Indicators**: ✅ Active / ❌ None status for quick assessment
- **Professional Layout**: Card-based design with proper spacing and typography
- **Information Density**: All relevant information visible at a glance

**Technical Features:**
- **Smart Type Detection**: Automatically identifies SPM vs ERC-20 allowances
- **Error Handling**: Contract reverts handled gracefully without console errors
- **Auto-Refresh**: Real-time updates when permissions change
- **Responsive Design**: Works perfectly on all screen sizes

## Configuration Made Easy

### What Was Moved to Constants

The following constants are now automatically handled by the SDK:

**✅ Contract Addresses (Production):**
- MegaPot Contract: `0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95`
- JackpotPool Contract: `0xfb324c09c16b5f437ff612a4e8bc95b8fd6e6d5a`
- Spend Permission Manager: `0xf85210B21cC50302F477BA56686d2019dC9b67Ad`
- USDC Token: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- Referrer Address: `0xa14ce36e7b135b66c3e3cb2584e777f32b15f5dc`

**✅ Network Settings:**
- Base Chain ID: `8453`
- RPC URL: `https://mainnet.base.org`
- API Base URL: `https://api.megapot.io`

**✅ Default Configuration:**
- Gas Limit: `150000`
- Timeout: `15000ms`
- Max Retries: `3`

### What Users Need to Configure

**🔑 Required:**
```bash
# Your wallet private key
WALLET_KEY=0x...

# Your referrer address (for tracking and rewards)
REFERRER_ADDRESS=0x...
```

**🔧 Optional:**
```bash
# Optional: API key for data queries
MEGAPOT_DATA_API_KEY=your_api_key_here
```

**🔧 Optional (for custom deployments only):**
```bash
# Custom RPC URL (if not using mainnet.base.org)
BASE_RPC_URL=https://your-custom-rpc.com

# Custom contract addresses (only if using testnet or custom deployments)
MEGAPOT_CONTRACT_ADDRESS=0x...
JACKPOT_POOL_CONTRACT_ADDRESS=0x...
SPEND_PERMISSION_MANAGER=0x...

# Paymaster configuration (for gas sponsorship)
PAYMASTER_URL=https://api.pimlico.io/v1/base/rpc?apikey=YOUR_API_KEY
PAYMASTER_ENABLED=true
PAYMASTER_MAX_GAS_LIMIT=50000
```

## TypeScript Support

The SDK is fully typed with TypeScript. Import types for better development experience:

```typescript
import type {
  SpendPermission,
  SpendConfig,
  TicketPurchaseResult,
  PoolPurchaseResult,
  PoolInfo,
  PoolStats,
  UserAllowance,
  ApiResponse,
  MegapotConfig,
  SpendPermissionManager,
  WalletProvider
} from 'megapot-sdk'
```

## Utility Functions

### Create Wallet Client from Private Key

```typescript
import { createWalletClientFromPrivateKey } from 'megapot-sdk'

const walletClient = createWalletClientFromPrivateKey(
  '0x' + privateKey,
  'https://mainnet.base.org' // Optional RPC URL
)
```

## Examples

### Complete Purchase Flow

```typescript
import { MegapotSDK, createWalletClientFromPrivateKey } from 'megapot-sdk'

async function completePurchaseFlow() {
  // Initialize SDK
  const walletClient = createWalletClientFromPrivateKey('0x' + privateKey)
  const sdk = new MegapotSDK({
    spendPermissionManagerAddress: '0xSpendPermissionManager',
    megapotContractAddress: '0xMegaPotContract',
    usdcContractAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  }, walletClient)

  // Check current allowances
  const allowances = await sdk.getUserAllowances(userAddress, spenderAddress)
  console.log('Current allowances:', allowances)

  // Approve spend permission if needed
  if (allowances.length === 0 || allowances[0].remaining < BigInt(5 * 1_000_000)) {
    const permission = {
      account: userAddress,
      spender: spenderAddress,
      token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      allowance: BigInt(10 * 1_000_000), // 10 USDC
      periodInDays: 1,
      chainId: 8453
    }

    await sdk.approveSpendPermission(permission)
    console.log('Spend permission approved')
  }

  // Buy tickets
  const result = await sdk.buySoloTickets(5)
  console.log('Tickets purchased:', result)

  // Check pool stats
  const stats = await sdk.getPoolStats()
  if (stats.success) {
    console.log('Pool statistics:', stats.data)
  }
}
```

### Pool Management

```typescript
async function poolManagement() {
  const sdk = new MegapotSDK({
    megapotContractAddress: '0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95',
    jackpotPoolContractAddress: '0xfb324c09c16b5f437ff612a4e8bc95b8fd6e6d5a',
    dataApi: {
      baseUrl: 'https://api.megapot.io',
      apiKey: 'your-api-key'
    }
  })

  // Get active pools
  const activePools = await sdk.getActivePools(5)
  if (activePools.success) {
    console.log(`Found ${activePools.data?.length} active pools`)

    // Buy tickets for the first available pool
    const firstPool = activePools.data?.[0]
    if (firstPool) {
      const result = await sdk.buyPoolTickets(firstPool.id, 5)
      console.log(`Bought ${result.ticketCount} tickets for pool ${firstPool.id}:`, result)
    }
  }

  // Get pool information
  const poolInfo = await sdk.getJackpotPoolInfo('123')
  if (poolInfo) {
    console.log('Pool info:', {
      totalTickets: poolInfo.totalTickets.toString(),
      ticketPrice: poolInfo.ticketPrice.toString(),
      maxTicketsPerUser: poolInfo.maxTicketsPerUser.toString(),
      isActive: poolInfo.isActive,
      endTime: new Date(Number(poolInfo.endTime) * 1000).toISOString()
    })
  }

  // Check user's tickets in pool
  const userTickets = await sdk.getUserTicketsInPool('123', '0xUserAddress')
  console.log(`User has ${userTickets} tickets in pool`)
}
```

## Contract Addresses

### Base Mainnet (Production)
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Spend Permission Manager**: `0xf85210B21cC50302F477BA56686d2019dC9b67Ad`
- **MegaPot Contract**: `0xbEDd4F2beBE9E3E636161E644759f3cbe3d51B95`
- **JackpotPool Contract**: `0xfb324c09c16b5f437ff612a4e8bc95b8fd6e6d5a`
- **Referrer Address**: `0xa14ce36e7b135b66c3e3cb2584e777f32b15f5dc`

### Base Sepolia (Testnet)
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Spend Permission Manager**: Configure via environment variable
- **MegaPot Contract**: Configure via environment variable
- **JackpotPool Contract**: Configure via environment variable

## 📦 Publishing Ready

The SDK is fully tested and ready for NPM publication:

### Publishing Checklist ✅
- ✅ **Comprehensive Testing** - All provider types tested and validated
- ✅ **Documentation Complete** - Full API documentation with examples
- ✅ **Live Demo Integration** - Tested with real Next.js application
- ✅ **TypeScript Support** - Full type safety and IntelliSense
- ✅ **Error Handling** - Robust error scenarios covered
- ✅ **Provider Support** - Works with MetaMask, Coinbase, and more
- ✅ **Backward Compatibility** - Existing private key method still works
- ✅ **Zero Configuration** - Auto-detects production contract addresses

### NPM Publishing
```bash
# Build and test before publishing
npm run build
npm run test

# Publish to NPM (after login)
npm publish

# Or publish with specific tag
npm publish --tag latest
```

### Integration Benefits

#### Compared to Other Web3 SDKs
- **🔗 Seamless Integration** - Works with existing Privy/Wagmi setups
- **🎯 Zero Config** - Auto-detects production contracts and network settings
- **🔄 Provider Agnostic** - Supports MetaMask, Coinbase, WalletConnect, and more
- **📱 Social Ready** - Built-in programmatic incentive features
- **🛡️ Error Resilient** - Comprehensive error handling and fallbacks
- **📊 Real-time Testing** - Live demo with actual blockchain interactions

#### Developer Experience
- **TypeScript First** - Full type safety and IntelliSense support
- **Minimal Setup** - 2 environment variables vs 7+ in other SDKs
- **Backward Compatible** - Existing code continues to work
- **Comprehensive Testing** - All scenarios covered in test suite
- **Live Integration** - Tested with real Next.js application

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm run test
```

### Linting

```bash
npm run lint
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please refer to the [MegaPot documentation](https://docs.megapot.io) or create an issue in this repository.

## References

- [Coinbase Spend Permissions](https://github.com/coinbase/spend-permissions)
- [MegaPot Developer Documentation](https://docs.megapot.io/developers/developer-reference/contract-overview)
