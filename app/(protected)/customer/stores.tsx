import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { mockStores } from "../../../lib/mock-data";

export default function CustomerStores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [showStoreDetails, setShowStoreDetails] = useState(false);

  const filteredStores = mockStores.filter((store) =>
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStoreRating = (storeId: string) => {
    // Mock rating calculation
    return (Math.random() * 2 + 3).toFixed(1);
  };

  const getStoreDistance = (storeId: string) => {
    // Mock distance calculation
    return (Math.random() * 5 + 0.5).toFixed(1);
  };

  const handleStorePress = (store: any) => {
    setSelectedStore(store.id);
    setShowStoreDetails(true);
  };

  const handleDirections = (store: any) => {
    Alert.alert("Directions", `Opening directions to ${store.name}`);
  };

  const handleCallStore = (store: any) => {
    Alert.alert("Call Store", `Calling ${store.phone}`);
  };

  const handleStoreDetails = (store: any) => {
    Alert.alert(
      "Store Details",
      `${store.name}\n${store.address}\n${store.phone}\n${store.email}\n\nOperating Hours: ${store.operatingHours}`
    );
  };

  const selectedStoreData = selectedStore ? mockStores.find(s => s.id === selectedStore) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {}}>
          <Ionicons name="arrow-back" size={24} color="#0F4D3A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Stores</Text>
        <TouchableOpacity style={styles.filterButton} onPress={() => Alert.alert("Filter", "Filter options")}>
          <Ionicons name="filter" size={20} color="#0F4D3A" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location or store name..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#6b7280"
          />
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapContainer}>
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map" size={48} color="#6b7280" />
          <Text style={styles.mapText}>Interactive Map</Text>
          <Text style={styles.mapSubtext}>Tap on store markers to view details</Text>
        </View>
        
        {/* Store Markers */}
        {filteredStores.map((store, index) => (
          <TouchableOpacity
            key={store.id}
            style={[
              styles.storeMarker,
              {
                left: `${20 + index * 15}%`,
                top: `${30 + index * 10}%`,
              },
            ]}
            onPress={() => handleStorePress(store)}
          >
            <Ionicons name="location" size={16} color="#0F4D3A" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Store List */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nearby Stores</Text>
          <Text style={styles.sectionSubtitle}>Click on map markers to view details</Text>
          
          {filteredStores.map((store) => (
            <TouchableOpacity
              key={store.id}
              style={styles.storeCard}
              onPress={() => handleStorePress(store)}
            >
              <View style={styles.storeInfo}>
                <View style={styles.storeIcon}>
                  <Ionicons name="storefront" size={20} color="#0F4D3A" />
                </View>
                <View style={styles.storeDetails}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storeAddress}>{store.address}</Text>
                  <View style={styles.storeMeta}>
                    <View style={styles.storeRating}>
                      <Ionicons name="star" size={12} color="#fbbf24" />
                      <Text style={styles.ratingText}>{getStoreRating(store.id)}</Text>
                    </View>
                    <Text style={styles.storeDistance}>{getStoreDistance(store.id)} km</Text>
                    <Text style={styles.storeStatus}>Open</Text>
                  </View>
                </View>
              </View>
              <View style={styles.storeActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDirections(store)}
                >
                  <Ionicons name="navigate" size={16} color="#0F4D3A" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleCallStore(store)}
                >
                  <Ionicons name="call" size={16} color="#0F4D3A" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Store Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Categories</Text>
          <View style={styles.categoryGrid}>
            <CategoryItem icon="restaurant" name="Restaurants" count={12} />
            <CategoryItem icon="storefront" name="Grocery" count={8} />
            <CategoryItem icon="cafe" name="Cafes" count={15} />
            <CategoryItem icon="bag" name="Retail" count={6} />
          </View>
        </View>

        {/* Map Legend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Map Legend</Text>
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#0F4D3A" }]} />
              <Text style={styles.legendText}>Partner Store</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: "#6b7280" }]} />
              <Text style={styles.legendText}>Regular Store</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Store Details Modal */}
      {showStoreDetails && selectedStoreData && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Store Details</Text>
              <TouchableOpacity onPress={() => setShowStoreDetails(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              {/* Store Header */}
              <View style={styles.storeHeader}>
                <View style={styles.storeAvatar}>
                  <Ionicons name="storefront" size={32} color="#0F4D3A" />
                </View>
                <View style={styles.storeHeaderInfo}>
                  <Text style={styles.storeHeaderName}>{selectedStoreData.name}</Text>
                  <View style={styles.storeHeaderRating}>
                    <Ionicons name="star" size={16} color="#fbbf24" />
                    <Text style={styles.storeHeaderRatingText}>{getStoreRating(selectedStoreData.id)}</Text>
                    <Text style={styles.storeHeaderReviews}>({Math.floor(Math.random() * 50 + 10)} reviews)</Text>
                  </View>
                </View>
              </View>

              {/* Store Information */}
              <View style={styles.infoSection}>
                <InfoItem icon="location" label="Address" value={selectedStoreData.address} />
                <InfoItem icon="call" label="Phone" value={selectedStoreData.phone} />
                <InfoItem icon="mail" label="Email" value={selectedStoreData.email} />
                <InfoItem icon="time" label="Hours" value={selectedStoreData.operatingHours} />
              </View>

              {/* Available Items */}
              <View style={styles.itemsSection}>
                <Text style={styles.itemsTitle}>Available Items</Text>
                <View style={styles.itemsList}>
                  {selectedStoreData.packagingTypes.slice(0, 3).map((type, index) => (
                    <View key={index} style={styles.itemTag}>
                      <Text style={styles.itemTagText}>{type}</Text>
                    </View>
                  ))}
                  {selectedStoreData.packagingTypes.length > 3 && (
                    <View style={styles.itemTag}>
                      <Text style={styles.itemTagText}>+{selectedStoreData.packagingTypes.length - 3} more</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.primaryAction}
                  onPress={() => handleDirections(selectedStoreData)}
                >
                  <Ionicons name="navigate" size={16} color="#fff" />
                  <Text style={styles.primaryActionText}>Get Directions</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => handleCallStore(selectedStoreData)}
                >
                  <Ionicons name="call" size={16} color="#0F4D3A" />
                  <Text style={styles.secondaryActionText}>Call Store</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryAction}
                  onPress={() => handleStoreDetails(selectedStoreData)}
                >
                  <Ionicons name="mail" size={16} color="#0F4D3A" />
                  <Text style={styles.secondaryActionText}>Email Store</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
      
    </View>
  );
}

function CategoryItem({ icon, name, count }: { icon: string; name: string; count: number }) {
  return (
    <TouchableOpacity style={styles.categoryItem}>
      <Ionicons name={icon as any} size={20} color="#0F4D3A" />
      <Text style={styles.categoryName}>{name}</Text>
      <Text style={styles.categoryCount}>{count} stores</Text>
    </TouchableOpacity>
  );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Ionicons name={icon as any} size={16} color="#6b7280" />
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  searchSection: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#111827",
  },
  mapContainer: {
    height: 200,
    backgroundColor: "#f3f4f6",
    position: "relative",
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mapText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 8,
  },
  mapSubtext: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  storeMarker: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0F4D3A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  storeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  storeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  storeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  storeDetails: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  storeMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  storeRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#111827",
    fontWeight: "600",
  },
  storeDistance: {
    fontSize: 12,
    color: "#6b7280",
  },
  storeStatus: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "600",
  },
  storeActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryItem: {
    flex: 1,
    minWidth: "45%",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  categoryName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 8,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 12,
    color: "#6b7280",
  },
  legendContainer: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: "#6b7280",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    margin: 20,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  modalBody: {
    padding: 20,
  },
  storeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  storeAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  storeHeaderInfo: {
    flex: 1,
  },
  storeHeaderName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  storeHeaderRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  storeHeaderRatingText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  storeHeaderReviews: {
    fontSize: 12,
    color: "#6b7280",
  },
  infoSection: {
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
  },
  itemsSection: {
    marginBottom: 20,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  itemsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  itemTag: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  itemTagText: {
    fontSize: 12,
    color: "#0F4D3A",
    fontWeight: "600",
  },
  modalActions: {
    gap: 12,
  },
  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0F4D3A",
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  secondaryActionText: {
    color: "#0F4D3A",
    fontSize: 16,
    fontWeight: "600",
  },
});