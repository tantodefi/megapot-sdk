// Quick test of the programmatic incentives functionality
console.log("🧪 Testing Programmatic Incentives...");

// Test data structure
const testIncentiveActions = [
  {
    id: "tweet",
    name: "Tweet About MegaPot",
    description: "Share MegaPot on Twitter/X",
    enabled: true,
    ticketReward: 1,
    userActions: [],
  },
  {
    id: "dm",
    name: "Send DM",
    description: "Send a direct message about MegaPot",
    enabled: true,
    ticketReward: 2,
    userActions: [],
  },
];

console.log("✅ Incentive Actions Structure:", testIncentiveActions);

// Test user action recording
const recordUserAction = (actionId, userId, userType) => {
  const action = testIncentiveActions.find((a) => a.id === actionId);
  if (!action) return null;

  const existingAction = action.userActions.find(
    (ua) => ua.userId === userId && ua.userType === userType,
  );

  if (existingAction) {
    if (existingAction.charged) {
      return `User ${userId} already received ${action.ticketReward} tickets for ${action.name}`;
    }

    // Mark as charged
    action.userActions = action.userActions.map((ua) =>
      ua.userId === userId && ua.userType === userType
        ? { ...ua, charged: true }
        : ua,
    );

    return `✅ Charged ${action.ticketReward} tickets to ${userId} for ${action.name}`;
  } else {
    // New action - record it
    action.userActions.push({
      userId,
      userType,
      timestamp: Date.now(),
      charged: false,
    });

    return `📝 Recorded ${action.name} action by ${userId}. Click "Charge User" to award tickets.`;
  }
};

// Test the functionality
console.log("\n📝 Recording user actions...");

console.log(recordUserAction("tweet", "0x1234", "address"));
console.log(recordUserAction("tweet", "0x1234", "address")); // Should charge
console.log(recordUserAction("dm", "0x5678", "address"));
console.log(recordUserAction("dm", "0x5678", "address")); // Should charge

console.log("\n📊 Final State:");
console.log(JSON.stringify(testIncentiveActions, null, 2));

console.log("\n✅ Programmatic Incentives test completed successfully!");
