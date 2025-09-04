import { Badge, Button, Card, Progress } from "@/components/ui";
import { useNativeCapabilities } from "@/hooks/useNativeCapabilities";
import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const cupIcon = require("@/assets/images/cup-icon.jpg");

export default function MobileOptimizedCustomerApp() {
  const [currentTab, setCurrentTab] = useState<"dashboard"|"stores"|"rewards">("dashboard");
  const [userPoints, setUserPoints] = useState<number>(847);
  const { isNative, scheduleNotification, storeData, getData } = useNativeCapabilities();

  useEffect(() => { (async () => {
    const saved = await getData("userPoints");
    const num = typeof saved === "string" ? parseInt(saved) : Number(saved);
    if (!Number.isNaN(num)) setUserPoints(num);
  })(); }, []);

  const handleReturn = async (itemId: string) => {
    const newPoints = userPoints + 15;
    setUserPoints(newPoints);
    await storeData("userPoints", String(newPoints));
    if (isNative) await scheduleNotification("Points Earned! 🎉", `You earned 15 points for returning ${itemId}`, 0);
  };

  const borrowedItems = [
    { id: "BC2U-CUP-001", type: "Coffee Cup", store: "Green Café Downtown", borrowed: "2 hours ago", due: "Tomorrow", deposit: "$2.00" },
    { id: "BC2U-BOX-045", type: "Food Container", store: "EcoEats Plaza", borrowed: "1 day ago", due: "In 6 days", deposit: "$3.00" }
  ];
  const borrowHistory = [
    { id: "H001", type: "Coffee Cup", store: "Green Café", date: "2024-01-15", points: "+10" },
    { id: "H002", type: "Soup Bowl", store: "Eco Deli", date: "2024-01-12", points: "+15" },
    { id: "H003", type: "Food Container", store: "Zero Waste", date: "2024-01-10", points: "+12" }
  ];
  const nearbyStores = [
    { name: "Green Café Downtown", distance: "0.2 km", available: 15, rating: 4.8 },
    { name: "EcoEats Plaza", distance: "0.5 km", available: 8, rating: 4.6 },
    { name: "Sustainable Sips", distance: "0.7 km", available: 22, rating: 4.9 }
  ];
  const rewards = [
    { title: "Free Coffee", points: 100, available: userPoints >= 100 },
    { title: "10% Discount", points: 150, available: userPoints >= 150 },
    { title: "Eco Warrior Badge", points: 250, available: userPoints >= 250 }
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F8FAFC" }} contentContainerStyle={{ paddingBottom: 16 }}>
      <View style={{ alignItems: "center", marginTop: 8 }}>
        <Badge style={{ backgroundColor: "#DCFCE7", alignSelf: "center", marginBottom: 8 }}>
          <Text>{isNative ? "📱 Native App" : "🌐 Web"}</Text>
        </Badge>
        <Text style={{ fontSize: 22, fontWeight: "800" }}>Your <Text style={{ color: "#2563EB" }}>Eco Journey</Text></Text>
        <Text style={{ textAlign: "center", color: "#6B7280", marginTop: 4 }}>
          Track your borrowing history, earn rewards, and see your environmental impact.
        </Text>
      </View>

      <Card style={{ borderRadius: 24, padding: 0, marginTop: 12 }}>
        <View style={styles.hero}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ color: "white", opacity: 0.9, fontSize: 12 }}>Welcome back!</Text>
              <Text style={{ color: "white", fontWeight: "700" }}>Sarah Chen</Text>
            </View>
            <View style={styles.avatarWrap}>
              <Image source={cupIcon} style={{ width: 24, height: 24, borderRadius: 12 }} />
            </View>
          </View>

          <View style={styles.pointsBox}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ color: "white", fontSize: 20, fontWeight: "800" }}>{userPoints}</Text>
                <Text style={{ color: "white", opacity: 0.9, fontSize: 12 }}>Eco Points</Text>
              </View>
              <Feather name="award" size={20} color="white" />
            </View>
          </View>
        </View>

        <View style={{ padding: 12 }}>
          <View style={styles.tabs}>
            {(["dashboard","stores","rewards"] as const).map(key => (
              <Pressable key={key} onPress={() => setCurrentTab(key)} style={[styles.tabItem, currentTab === key && styles.tabItemActive]}>
                <Text style={[styles.tabText, currentTab === key && styles.tabTextActive]}>
                  {key === "dashboard" ? "Dashboard" : key === "stores" ? "Stores" : "Rewards"}
                </Text>
              </Pressable>
            ))}
          </View>

          {currentTab === "dashboard" && (
            <View style={{ gap: 8 }}>
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Currently Borrowed</Text>
                {borrowedItems.map(item => (
                  <View key={item.id} style={styles.rowBetween}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Feather name="coffee" size={16} color="#2563EB" />
                      <View>
                        <Text style={styles.itemTitle}>{item.type}</Text>
                        <Text style={styles.itemSub}>{item.store}</Text>
                      </View>
                    </View>
                    <Button variant="eco" style={{ paddingVertical: 6, paddingHorizontal: 10 }} onPress={() => handleReturn(item.id)}>
                      <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Return</Text>
                    </Button>
                  </View>
                ))}
              </View>

              <View style={[styles.sectionCard, { backgroundColor: "#E6F9EE" }]}>
                <Text style={styles.sectionTitle}>This Month</Text>
                <View style={styles.grid2}>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: "#2563EB", fontSize: 18, fontWeight: "800" }}>23</Text>
                    <Text style={styles.itemSub}>Containers</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={{ color: "#2563EB", fontSize: 18, fontWeight: "800" }}>167</Text>
                    <Text style={styles.itemSub}>Points Earned</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {currentTab === "stores" && (
            <View style={{ gap: 8 }}>
              <Text style={styles.sectionTitle}>Nearby Stores</Text>
              {nearbyStores.map((s, i) => (
                <View key={i} style={styles.storeItem}>
                  <View>
                    <Text style={styles.itemTitle}>{s.name}</Text>
                    <View style={styles.inline}>
                      <Feather name="map-pin" size={12} color="#6B7280" />
                      <Text style={styles.metaText}>{s.distance}</Text>
                      <Feather name="star" size={12} color="#F59E0B" style={{ marginLeft: 6 }} />
                      <Text style={styles.metaText}>{s.rating}</Text>
                    </View>
                  </View>
                  <Badge variant="secondary"><Text>{s.available}</Text></Badge>
                </View>
              ))}
            </View>
          )}

          {currentTab === "rewards" && (
            <View style={{ gap: 8 }}>
              <View style={[styles.sectionCard, { backgroundColor: "#EFF6FF" }]}>
                <View style={styles.rowBetween}>
                  <Text style={styles.sectionTitle}>Available Points</Text>
                  <View style={styles.inline}><Feather name="award" size={16} color="#2563EB" /><Text style={{ marginLeft: 4, fontWeight: "800", color: "#2563EB" }}>{userPoints}</Text></View>
                </View>
                <Progress value={(userPoints / 1000) * 100} />
                <Text style={styles.itemSub}>{1000 - userPoints} points to top tier</Text>
              </View>

              {rewards.map((r, i) => (
                <View key={i} style={[styles.rewardItem, r.available ? styles.rewardAvailable : styles.rewardLocked]}>
                  <View>
                    <Text style={styles.itemTitle}>{r.title}</Text>
                    <Text style={styles.itemSub}>{r.points} points</Text>
                  </View>
                  <Button variant={r.available ? "eco" : "secondary"} disabled={!r.available} style={{ paddingVertical: 6, paddingHorizontal: 10 }}>
                    <Text style={{ color: r.available ? "#fff" : "#111827", fontSize: 12, fontWeight: "700" }}>
                      {r.available ? "Redeem" : "Locked"}
                    </Text>
                  </Button>
                </View>
              ))}
            </View>
          )}
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: "#2563EB", padding: 16, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  avatarWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  pointsBox: { marginTop: 8, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 10 },
  tabs: { flexDirection: "row", backgroundColor: "#F1F5F9", borderRadius: 10, padding: 4, marginBottom: 8 },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8 },
  tabItemActive: { backgroundColor: "#FFFFFF" },
  tabText: { color: "#6B7280", fontWeight: "600", fontSize: 12 },
  tabTextActive: { color: "#111827" },
  sectionCard: { backgroundColor: "#EEF2FF", borderRadius: 12, padding: 12, gap: 8 },
  sectionTitle: { fontWeight: "700", color: "#111827", marginBottom: 6 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  grid2: { flexDirection: "row", gap: 8, justifyContent: "space-between" },
  storeItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 10, backgroundColor: "#F1F5F9", borderRadius: 10 },
  inline: { flexDirection: "row", alignItems: "center" },
  itemTitle: { fontSize: 13, fontWeight: "700", color: "#111827" },
  itemSub: { fontSize: 12, color: "#6B7280" },
  metaText: { fontSize: 12, color: "#6B7280" },
  rewardItem: { padding: 12, borderRadius: 12, borderWidth: 0.5, borderColor: "#E5E7EB", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rewardAvailable: { backgroundColor: "#FFFFFF" },
  rewardLocked: { backgroundColor: "#F3F4F6" }
});
