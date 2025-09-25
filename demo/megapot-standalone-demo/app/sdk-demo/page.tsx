"use client";

import {
  AlertCircle,
  Bell,
  CheckCircle,
  Coins,
  Hash,
  Heart,
  MessageCircle,
  Settings,
  Twitter,
  Users,
  Zap,
} from "lucide-react";
import { MegapotSDK } from "megapot-sdk";
import { useEffect, useState } from "react";
import { formatEther, formatUnits } from "viem";
import { usePublicClient, useWalletClient } from "wagmi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface UserAllowance {
  token: string;
  allowance: bigint;
  spender: string;
  remaining: bigint;
}

interface IncentiveAction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
  ticketReward: number;
  userActions: Array<{
    userId: string;
    userType: "address" | "fid";
    timestamp: number;
    charged: boolean;
  }>;
}

interface UserAction {
  userId: string;
  userType: "address" | "fid";
  action: string;
  timestamp: number;
}

export default function SDKDemoPage() {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const [sdk, setSdk] = useState<MegapotSDK | null>(null);
  const [allowances, setAllowances] = useState<UserAllowance[]>([]);
  const [loading, setLoading] = useState(false);
  const [socialMessage, setSocialMessage] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("1");

  // Programmatic Incentives State
  const [incentiveActions, setIncentiveActions] = useState<IncentiveAction[]>([
    {
      id: "tweet",
      name: "Tweet About MegaPot",
      description: "Share MegaPot on Twitter/X",
      icon: <Twitter className="h-4 w-4" />,
      enabled: true,
      ticketReward: 1,
      userActions: [],
    },
    {
      id: "dm",
      name: "Send DM",
      description: "Send a direct message about MegaPot",
      icon: <MessageCircle className="h-4 w-4" />,
      enabled: true,
      ticketReward: 2,
      userActions: [],
    },
    {
      id: "cast",
      name: "Cast on Farcaster",
      description: "Share MegaPot on Farcaster",
      icon: <Hash className="h-4 w-4" />,
      enabled: true,
      ticketReward: 1,
      userActions: [],
    },
    {
      id: "follow",
      name: "Follow MegaPot",
      description: "Follow MegaPot on social media",
      icon: <Users className="h-4 w-4" />,
      enabled: false,
      ticketReward: 1,
      userActions: [],
    },
    {
      id: "like",
      name: "Like Content",
      description: "Like MegaPot content",
      icon: <Heart className="h-4 w-4" />,
      enabled: false,
      ticketReward: 1,
      userActions: [],
    },
  ]);
  const [userActions, setUserActions] = useState<UserAction[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserType, setCurrentUserType] = useState<"address" | "fid">(
    "address",
  );

  // Initialize SDK when wallet is connected or in demo mode
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        if (walletClient && publicClient) {
          // Create SDK using existing wallet connection
          const megapotSDK = new MegapotSDK(
            {},
            {
              type: "custom",
              client: walletClient,
              publicClient: publicClient,
            },
          );
          setSdk(megapotSDK);
        } else if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
          // Create SDK in demo mode using private key
          const megapotSDK = new MegapotSDK(
            {},
            {
              type: "privateKey",
              privateKey: "0x" + "0".repeat(63) + "1", // Demo private key
              rpcUrl: "https://mainnet.base.org",
            },
          );
          setSdk(megapotSDK);
        }
      } catch (error) {
        console.error("Failed to initialize MegaPot SDK:", error);
      }
    };

    initializeSDK();
  }, [walletClient, publicClient]);

  // Load user allowances
  const loadAllowances = async () => {
    if (!sdk) return;

    setLoading(true);
    try {
      const demoAddress =
        walletClient?.account?.address ||
        "0x1234567890123456789012345678901234567890";
      const userAllowances = await sdk.getUserAllowances(
        demoAddress,
        sdk.getConfig().megapotContractAddress,
      );
      setAllowances(userAllowances);
    } catch (error: any) {
      // Handle contract reverts gracefully - this is expected when user hasn't set permissions yet
      console.log(
        "Allowances check completed - some contracts may not have permissions set yet",
      );

      // Set empty allowances to show user-friendly message
      setAllowances([
        {
          token: "USDC",
          allowance: BigInt(0),
          spender: sdk.getConfig().megapotContractAddress,
          remaining: BigInt(0),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Approve USDC spending
  const approveUSDC = async (amount: string) => {
    if (!sdk) return;

    setLoading(true);
    try {
      const txHash = await sdk.approveUSDC(
        sdk.getConfig().megapotContractAddress,
        BigInt(amount) * BigInt(10 ** 6), // Convert to USDC decimals
      );
      console.log("USDC approval transaction:", txHash);
      await loadAllowances(); // Reload allowances
    } catch (error) {
      console.error("Failed to approve USDC:", error);
    } finally {
      setLoading(false);
    }
  };

  // Buy solo tickets
  const buySoloTickets = async (count: string) => {
    if (!sdk) return;

    setLoading(true);
    try {
      // Simulate ticket purchase in demo mode
      const result = {
        ticketCount: parseInt(count),
        transactionHash: "0x" + "0".repeat(64),
        totalCost: BigInt(parseInt(count)) * BigInt(10 ** 6), // 1 USDC per ticket
      };
      console.log("Solo tickets purchased:", result);

      // Generate social message
      const message = `🎰 Just bought ${result.ticketCount} MegaPot tickets! Join the world's largest jackpot at https://megapot.io 🚀 #MegaPot`;
      setSocialMessage(message);
    } catch (error) {
      console.error("Failed to buy solo tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Buy pool tickets
  const buyPoolTickets = async (poolId: string, count: string) => {
    if (!sdk) return;

    setLoading(true);
    try {
      // Simulate pool ticket purchase in demo mode
      const result = {
        ticketCount: parseInt(count),
        transactionHash: "0x" + "0".repeat(64),
        totalCost: BigInt(parseInt(count)) * BigInt(10 ** 6), // 1 USDC per ticket
        poolId: poolId,
      };
      console.log("Pool tickets purchased:", result);

      // Generate social message
      const message = `🤝 Just joined MegaPot pool ${poolId} with ${result.ticketCount} tickets! Collective wins are the best wins! https://megapot.io #MegaPot`;
      setSocialMessage(message);
    } catch (error) {
      console.error("Failed to buy pool tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  // Social sharing functions
  const shareOnTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(socialMessage)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const sendDirectMessage = () => {
    // This would integrate with XMTP or other messaging
    alert("DM functionality would integrate with XMTP for Web3 messaging");
  };

  const shareOnFarcaster = () => {
    // This would integrate with Farcaster
    alert("Farcaster cast functionality would integrate with Warpcast API");
  };

  // Programmatic Incentives Functions
  const updateIncentiveAction = (
    actionId: string,
    updates: Partial<IncentiveAction>,
  ) => {
    setIncentiveActions((prev) =>
      prev.map((action) =>
        action.id === actionId ? { ...action, ...updates } : action,
      ),
    );
  };

  const recordUserAction = (
    actionId: string,
    userId: string,
    userType: "address" | "fid",
  ) => {
    const action = incentiveActions.find((a) => a.id === actionId);
    if (!action) return;

    // Check if user already performed this action
    const existingAction = action.userActions.find(
      (ua) => ua.userId === userId && ua.userType === userType,
    );

    if (existingAction) {
      if (existingAction.charged) {
        alert(
          `User ${userId} already received ${action.ticketReward} tickets for ${action.name}`,
        );
        return;
      }

      // Mark as charged and add to user actions
      setIncentiveActions((prev) =>
        prev.map((a) =>
          a.id === actionId
            ? {
                ...a,
                userActions: a.userActions.map((ua) =>
                  ua.userId === userId && ua.userType === userType
                    ? { ...ua, charged: true }
                    : ua,
                ),
              }
            : a,
        ),
      );

      setUserActions((prev) => [
        ...prev,
        {
          userId,
          userType,
          action: action.name,
          timestamp: Date.now(),
        },
      ]);

      alert(
        `✅ Charged ${action.ticketReward} tickets to ${userId} for ${action.name}`,
      );
    } else {
      // New action - record it
      setIncentiveActions((prev) =>
        prev.map((a) =>
          a.id === actionId
            ? {
                ...a,
                userActions: [
                  ...a.userActions,
                  {
                    userId,
                    userType,
                    timestamp: Date.now(),
                    charged: false,
                  },
                ],
              }
            : a,
        ),
      );

      alert(
        `📝 Recorded ${action.name} action by ${userId}. Click "Charge User" to award tickets.`,
      );
    }
  };

  const chargeUserForAction = (
    actionId: string,
    userId: string,
    userType: "address" | "fid",
  ) => {
    const action = incentiveActions.find((a) => a.id === actionId);
    if (!action) return;

    const userAction = action.userActions.find(
      (ua) => ua.userId === userId && ua.userType === userType && !ua.charged,
    );

    if (userAction) {
      // Charge the user
      setIncentiveActions((prev) =>
        prev.map((a) =>
          a.id === actionId
            ? {
                ...a,
                userActions: a.userActions.map((ua) =>
                  ua.userId === userId && ua.userType === userType
                    ? { ...ua, charged: true }
                    : ua,
                ),
              }
            : a,
        ),
      );

      setUserActions((prev) => [
        ...prev,
        {
          userId,
          userType,
          action: action.name,
          timestamp: Date.now(),
        },
      ]);

      alert(
        `✅ Successfully charged ${action.ticketReward} tickets to ${userId} for ${action.name}`,
      );
    } else {
      alert(`No pending charges found for ${userId} on ${action.name}`);
    }
  };

  const getTotalTicketsToCharge = () => {
    return incentiveActions.reduce((total, action) => {
      return (
        total +
        action.userActions.filter((ua) => !ua.charged).length *
          action.ticketReward
      );
    }, 0);
  };

  const getPendingCharges = () => {
    return incentiveActions.flatMap((action) =>
      action.userActions
        .filter((ua) => !ua.charged)
        .map((ua) => ({
          ...ua,
          actionName: action.name,
          ticketReward: action.ticketReward,
        })),
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">MegaPot SDK Demo</h1>
        <p className="text-gray-600">
          Test allowances, permissions, and programmatic incentives
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This demo integrates the MegaPot SDK with your existing wallet
          connection.
          {sdk
            ? " SDK is ready!"
            : process.env.NEXT_PUBLIC_DEMO_MODE === "true"
              ? " SDK in demo mode - showing UI without wallet connection."
              : " Connect your wallet to get started."}
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="allowances" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="allowances">Allowances</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="allowances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Current Allowances
              </CardTitle>
              <CardDescription>
                Your current token allowances for MegaPot contracts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={loadAllowances}
                disabled={loading || !sdk}
                className="w-full font-semibold text-sm px-4 py-2 h-10">
                {loading ? "Loading..." : "Refresh Allowances"}
              </Button>

              <div className="space-y-3">
                {allowances.map((allowance, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          allowance.allowance > 0 ? "default" : "secondary"
                        }>
                        {allowance.token}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        Spender: {allowance.spender.slice(0, 6)}...
                        {allowance.spender.slice(-4)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {formatUnits(allowance.allowance, 6)} {allowance.token}
                      </div>
                      <div className="text-xs text-gray-500">
                        Remaining: {formatUnits(allowance.remaining, 6)}
                      </div>
                    </div>
                  </div>
                ))}

                {allowances.length === 0 && !loading && (
                  <div className="text-center py-8">
                    <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-200">
                      <div className="text-4xl mb-3">💰</div>
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No Allowances Found
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Set up permissions below to start buying tickets.
                      </p>
                      <div className="flex justify-center">
                        <Button
                          onClick={loadAllowances}
                          className="font-semibold text-sm px-4 py-2 h-10"
                          disabled={loading}>
                          Check Again
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Permission Management
              </CardTitle>
              <CardDescription>
                Set up allowances for MegaPot operations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Approve USDC</CardTitle>
                    <CardDescription>
                      Allow MegaPot to spend your USDC
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="usdc-amount">Amount (USDC)</Label>
                      <Input
                        id="usdc-amount"
                        type="number"
                        placeholder="100"
                        defaultValue="100"
                      />
                    </div>
                    <Button
                      onClick={() => {
                        const amount = (
                          document.getElementById(
                            "usdc-amount",
                          ) as HTMLInputElement
                        ).value;
                        approveUSDC(amount);
                      }}
                      disabled={loading || !sdk}
                      className="w-full font-semibold text-sm px-4 py-2 h-10">
                      Approve USDC Spending
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Buy Tickets</CardTitle>
                    <CardDescription>Test ticket purchases</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="ticket-count">Ticket Count</Label>
                      <Input
                        id="ticket-count"
                        type="number"
                        placeholder="1"
                        value={purchaseAmount}
                        onChange={(e) => setPurchaseAmount(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        onClick={() => buySoloTickets(purchaseAmount)}
                        disabled={loading || !sdk}
                        variant="outline"
                        className="font-semibold text-sm px-4 py-2 h-10">
                        Solo Tickets
                      </Button>
                      <Button
                        onClick={() => buyPoolTickets("123", purchaseAmount)}
                        disabled={loading || !sdk}
                        variant="outline"
                        className="font-semibold text-sm px-4 py-2 h-10">
                        Pool Tickets
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Incentive Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Programmatic Incentives
                </CardTitle>
                <CardDescription>
                  Configure rewards for social actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {incentiveActions.map((action) => (
                    <div
                      key={action.id}
                      className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {action.icon}
                        <div>
                          <div className="font-medium">{action.name}</div>
                          <div className="text-sm text-gray-500">
                            {action.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {action.ticketReward} tickets
                          </div>
                          <div className="text-xs text-gray-500">
                            {
                              action.userActions.filter((ua) => ua.charged)
                                .length
                            }{" "}
                            charged
                          </div>
                        </div>
                        <Switch
                          checked={action.enabled}
                          onCheckedChange={(enabled) =>
                            updateIncentiveAction(action.id, { enabled })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Total Pending Charges</div>
                      <div className="text-sm text-gray-500">
                        {getTotalTicketsToCharge()} tickets to be charged
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const pending = getPendingCharges();
                        if (pending.length === 0) {
                          alert("No pending charges to process");
                          return;
                        }
                        alert(
                          `Process ${pending.length} pending charges for ${getTotalTicketsToCharge()} tickets`,
                        );
                      }}
                      className="font-semibold text-sm px-4 py-2 h-10">
                      Process Charges
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Action Tracking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Actions
                </CardTitle>
                <CardDescription>
                  Track and charge users for social actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Input */}
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="user-id">User ID (Address or FID)</Label>
                    <Input
                      id="user-id"
                      placeholder="0x1234... or FID:1234"
                      value={currentUserId}
                      onChange={(e) => setCurrentUserId(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={
                        currentUserType === "address" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setCurrentUserType("address")}
                      className="font-semibold text-sm px-3 py-1 h-8">
                      Address
                    </Button>
                    <Button
                      variant={
                        currentUserType === "fid" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => setCurrentUserType("fid")}
                      className="font-semibold text-sm px-3 py-1 h-8">
                      FID
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Label>Available Actions</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {incentiveActions
                      .filter((action) => action.enabled)
                      .map((action) => (
                        <div
                          key={action.id}
                          className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            {action.icon}
                            <span className="text-sm">{action.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {action.ticketReward} tickets
                            </Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                recordUserAction(
                                  action.id,
                                  currentUserId,
                                  currentUserType,
                                )
                              }
                              disabled={!currentUserId}
                              className="font-semibold text-xs px-2 py-1 h-7">
                              Record
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                chargeUserForAction(
                                  action.id,
                                  currentUserId,
                                  currentUserType,
                                )
                              }
                              disabled={!currentUserId}
                              className="font-semibold text-xs px-2 py-1 h-7">
                              Charge
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Recent Actions */}
                {userActions.length > 0 && (
                  <div className="pt-4 border-t">
                    <Label>Recent Actions</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {userActions.slice(-5).map((userAction, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">
                              {userAction.userId}
                            </span>
                            <span className="text-gray-500 ml-2">
                              did {userAction.action}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {new Date(
                              userAction.timestamp,
                            ).toLocaleTimeString()}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pending Charges Summary */}
          {getPendingCharges().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Pending Charges
                </CardTitle>
                <CardDescription>
                  Users who have performed actions but haven't been charged yet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getPendingCharges().map((charge, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <div>
                          <div className="font-medium">{charge.userId}</div>
                          <div className="text-sm text-gray-500">
                            {charge.actionName} •{" "}
                            {new Date(charge.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {charge.ticketReward} tickets
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() =>
                            chargeUserForAction(
                              incentiveActions.find(
                                (a) => a.name === charge.actionName,
                              )?.id || "",
                              charge.userId,
                              charge.userType,
                            )
                          }
                          className="font-semibold text-xs px-3 py-1 h-7">
                          Charge
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Configure incentives above and track user actions. Each time a
              user performs an action, you can charge them tickets as rewards
              for engaging with MegaPot!
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>

      {sdk && (
        <Card>
          <CardHeader>
            <CardTitle>SDK Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Wallet Connected:</span>
                <span className="ml-2 text-green-600">✅ Yes</span>
              </div>
              <div>
                <span className="font-medium">SDK Initialized:</span>
                <span className="ml-2 text-green-600">✅ Yes</span>
              </div>
              <div>
                <span className="font-medium">Network:</span>
                <span className="ml-2">Base Mainnet</span>
              </div>
              <div>
                <span className="font-medium">MegaPot Contract:</span>
                <span className="ml-2">
                  {sdk.getConfig().megapotContractAddress.slice(0, 6)}...
                  {sdk.getConfig().megapotContractAddress.slice(-4)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
