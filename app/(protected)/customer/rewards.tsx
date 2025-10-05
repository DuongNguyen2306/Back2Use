import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CustomerRewards() {
  const [activeTab, setActiveTab] = useState<"available" | "history" | "achievements">("available");
  
  const customerPoints = 1250;
  const customerLevel = "Gold";
  const userRank = 8;

  const availableRewards = [
    {
      id: "1",
      title: "$5 Store Credit",
      description: "Use at any partner store",
      points: 500,
      discount: "20%",
      icon: "gift",
      canRedeem: true,
    },
    {
      id: "2",
      title: "Free Coffee",
      description: "At participating cafes",
      points: 300,
      discount: "50%",
      icon: "cafe",
      canRedeem: true,
    },
    {
      id: "3",
      title: "10% Discount",
      description: "Next purchase discount",
      points: 800,
      discount: "10%",
      icon: "pricetag",
      canRedeem: true,
    },
    {
      id: "4",
      title: "Premium Item Free",
      description: "Get one premium eco-friendly product completely free",
      points: 1200,
      discount: "100%",
      icon: "diamond",
      canRedeem: false,
    },
  ];

  const rankedRewards = [
    {
      id: "rank1",
      title: "Top 1-5 Ranked Voucher",
      description: "Exclusive 20% discount for top 5 eco champions",
      discount: "20%",
      rank: "1-5",
      canRedeem: userRank >= 1 && userRank <= 5,
    },
    {
      id: "rank2",
      title: "Top 6-10 Ranked Voucher",
      description: "Special 15% discount for top 10 eco champions",
      discount: "15%",
      rank: "6-10",
      canRedeem: userRank >= 6 && userRank <= 10,
    },
  ];

  const rewardHistory = [
    {
      id: "h1",
      title: "$5 Store Credit",
      redeemedAt: "2024-01-15",
      status: "used",
      points: 500,
    },
    {
      id: "h2",
      title: "Free Coffee",
      redeemedAt: "2024-01-10",
      status: "expired",
      points: 300,
    },
    {
      id: "h3",
      title: "10% Discount",
      redeemedAt: "2024-01-05",
      status: "available",
      points: 800,
    },
  ];

  const achievements = [
    {
      id: "a1",
      title: "Eco Warrior",
      description: "Returned 50+ containers",
      icon: "leaf",
      completed: true,
      progress: 50,
      total: 50,
    },
    {
      id: "a2",
      title: "Loyal Customer",
      description: "Used service for 6 months",
      icon: "heart",
      completed: true,
      progress: 6,
      total: 6,
    },
    {
      id: "a3",
      title: "Perfect Return",
      description: "100% return rate this month",
      icon: "trophy",
      completed: false,
      progress: 8,
      total: 10,
    },
    {
      id: "a4",
      title: "Early Bird",
      description: "Return items on time 10 times",
      icon: "time",
      completed: false,
      progress: 7,
      total: 10,
    },
  ];

  const handleRedeemReward = (reward: any) => {
    Alert.alert(
      "Redeem Reward",
      `Redeem "${reward.title}" for ${reward.points} points?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Redeem", onPress: () => Alert.alert("Success", "Reward redeemed successfully!") },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "used":
        return "#16a34a";
      case "expired":
        return "#ef4444";
      case "available":
        return "#0F4D3A";
      default:
        return "#6b7280";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {}}>
          <Ionicons name="arrow-back" size={24} color="#0F4D3A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
        <TouchableOpacity style={styles.notificationButton} onPress={() => Alert.alert("Notifications", "No new notifications")}>
          <Ionicons name="notifications" size={20} color="#0F4D3A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Points Summary */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <View>
              <Text style={styles.pointsValue}>{customerPoints}</Text>
              <Text style={styles.pointsLabel}>Available Points</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{customerLevel}</Text>
            </View>
          </View>
        </View>

        {/* Ranked Rewards */}
        {rankedRewards.some(reward => reward.canRedeem) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ranked Rewards</Text>
            <View style={styles.rankedInfo}>
              <Ionicons name="trophy" size={16} color="#7c3aed" />
              <Text style={styles.rankedText}>
                Your current rank: {userRank === 1 ? "1st" : userRank === 2 ? "2nd" : userRank === 3 ? "3rd" : `${userRank}th`} place
              </Text>
            </View>
            {rankedRewards
              .filter(reward => reward.canRedeem)
              .map((reward) => (
                <View key={reward.id} style={styles.rankedRewardCard}>
                  <View style={styles.rankedRewardInfo}>
                    <Ionicons name="trophy" size={20} color="#7c3aed" />
                    <View style={styles.rankedRewardDetails}>
                      <Text style={styles.rankedRewardTitle}>{reward.title}</Text>
                      <Text style={styles.rankedRewardDescription}>{reward.description}</Text>
                      <Text style={styles.rankedRewardDiscount}>{reward.discount} OFF</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.rankedRedeemButton} onPress={() => handleRedeemReward(reward)}>
                    <Text style={styles.rankedRedeemText}>Redeem</Text>
                  </TouchableOpacity>
                </View>
              ))}
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "available" && styles.activeTab]}
            onPress={() => setActiveTab("available")}
          >
            <Text style={[styles.tabText, activeTab === "available" && styles.activeTabText]}>
              Available ({availableRewards.filter(r => r.canRedeem).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "history" && styles.activeTab]}
            onPress={() => setActiveTab("history")}
          >
            <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>
              History ({rewardHistory.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "achievements" && styles.activeTab]}
            onPress={() => setActiveTab("achievements")}
          >
            <Text style={[styles.tabText, activeTab === "achievements" && styles.activeTabText]}>
              Achievements
            </Text>
          </TouchableOpacity>
        </View>

        {/* Available Rewards */}
        {activeTab === "available" && (
          <View style={styles.section}>
            {availableRewards.map((reward) => (
              <View key={reward.id} style={styles.rewardCard}>
                <View style={styles.rewardInfo}>
                  <View style={styles.rewardIcon}>
                    <Ionicons name={reward.icon as any} size={20} color="#0F4D3A" />
                  </View>
                  <View style={styles.rewardDetails}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                    <View style={styles.rewardMeta}>
                      <Text style={styles.rewardPoints}>{reward.points} points</Text>
                      <Text style={styles.rewardDiscount}>{reward.discount} OFF</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.redeemButton, !reward.canRedeem && styles.disabledButton]}
                  onPress={() => handleRedeemReward(reward)}
                  disabled={!reward.canRedeem}
                >
                  <Text style={[styles.redeemText, !reward.canRedeem && styles.disabledText]}>
                    {reward.canRedeem ? "Redeem" : "Need More Points"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Reward History */}
        {activeTab === "history" && (
          <View style={styles.section}>
            {rewardHistory.map((reward) => (
              <View key={reward.id} style={styles.historyCard}>
                <View style={styles.historyInfo}>
                  <Ionicons name="gift" size={20} color="#6b7280" />
                  <View style={styles.historyDetails}>
                    <Text style={styles.historyTitle}>{reward.title}</Text>
                    <Text style={styles.historyDate}>Redeemed: {reward.redeemedAt}</Text>
                    <Text style={styles.historyPoints}>{reward.points} points</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reward.status) + "20" }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(reward.status) }]}>
                    {reward.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Achievements */}
        {activeTab === "achievements" && (
          <View style={styles.section}>
            {achievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <View style={styles.achievementInfo}>
                  <Ionicons
                    name={achievement.icon as any}
                    size={24}
                    color={achievement.completed ? "#16a34a" : "#6b7280"}
                  />
                  <View style={styles.achievementDetails}>
                    <Text style={[styles.achievementTitle, achievement.completed && styles.completedTitle]}>
                      {achievement.title}
                    </Text>
                    <Text style={styles.achievementDescription}>{achievement.description}</Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${(achievement.progress / achievement.total) * 100}%` },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressText}>
                        {achievement.progress}/{achievement.total}
                      </Text>
                    </View>
                  </View>
                </View>
                {achievement.completed && (
                  <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  notificationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  pointsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pointsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: "800",
    color: "#0F4D3A",
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  levelBadge: {
    backgroundColor: "#0F4D3A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  rankedInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3e8ff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  rankedText: {
    fontSize: 14,
    color: "#7c3aed",
    fontWeight: "600",
  },
  rankedRewardCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#7c3aed",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rankedRewardInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankedRewardDetails: {
    marginLeft: 12,
    flex: 1,
  },
  rankedRewardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  rankedRewardDescription: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  rankedRewardDiscount: {
    fontSize: 12,
    color: "#7c3aed",
    fontWeight: "600",
  },
  rankedRedeemButton: {
    backgroundColor: "#7c3aed",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  rankedRedeemText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#0F4D3A",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  activeTabText: {
    color: "#fff",
  },
  rewardCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rewardInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rewardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rewardDetails: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  rewardDescription: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  rewardMeta: {
    flexDirection: "row",
    gap: 8,
  },
  rewardPoints: {
    fontSize: 12,
    color: "#0F4D3A",
    fontWeight: "600",
  },
  rewardDiscount: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "600",
  },
  redeemButton: {
    backgroundColor: "#0F4D3A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  disabledButton: {
    backgroundColor: "#d1d5db",
  },
  redeemText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  disabledText: {
    color: "#6b7280",
  },
  historyCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  historyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  historyDetails: {
    marginLeft: 12,
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  historyPoints: {
    fontSize: 12,
    color: "#0F4D3A",
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  achievementCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  achievementInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  achievementDetails: {
    marginLeft: 12,
    flex: 1,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  completedTitle: {
    color: "#16a34a",
  },
  achievementDescription: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0F4D3A",
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
});
