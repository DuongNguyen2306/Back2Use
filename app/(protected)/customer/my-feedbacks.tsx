import { Feedback, feedbackApi } from '@/services/api/feedbackService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function MyFeedbacksScreen() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  useEffect(() => {
    loadFeedbacks();
  }, [selectedRating]);

  const loadFeedbacks = async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(1);
      }

      const currentPage = reset ? 1 : page;
      const response = await feedbackApi.getMy({
        page: currentPage,
        limit: 20,
        rating: selectedRating || undefined,
      });

      const feedbacksData = Array.isArray(response.data)
        ? response.data
        : (response.data as any)?.items || [];

      if (reset) {
        setFeedbacks(feedbacksData);
      } else {
        setFeedbacks((prev) => [...prev, ...feedbacksData]);
      }

      setHasMore(feedbacksData.length === 20);
      if (!reset) {
        setPage((prev) => prev + 1);
      }
    } catch (error: any) {
      console.error('Error loading feedbacks:', error);
      Alert.alert('Error', error.message || 'Failed to load feedbacks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFeedbacks(true);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadFeedbacks(false);
    }
  };

  const handleDeleteFeedback = async (feedbackId: string) => {
    Alert.alert(
      'Delete Feedback',
      'Are you sure you want to delete this feedback?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await feedbackApi.delete(feedbackId);
              setFeedbacks((prev) => prev.filter((f) => f._id !== feedbackId));
              Alert.alert('Success', 'Feedback deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete feedback');
            }
          },
        },
      ]
    );
  };

  const renderFeedbackItem = ({ item }: { item: Feedback }) => {
    const business = typeof item.businessId === 'object' ? item.businessId : null;
    const businessName = business?.businessName || 'Business';
    const businessLogo = business?.businessLogoUrl;

    return (
      <View style={styles.feedbackCard}>
        <View style={styles.feedbackHeader}>
          <View style={styles.businessInfo}>
            {businessLogo && (
              <Image source={{ uri: businessLogo }} style={styles.businessLogo} />
            )}
            <View style={styles.businessText}>
              <Text style={styles.businessName}>{businessName}</Text>
              <Text style={styles.feedbackDate}>
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => handleDeleteFeedback(item._id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons
              key={star}
              name={star <= item.rating ? 'star' : 'star-outline'}
              size={20}
              color="#FCD34D"
            />
          ))}
          <Text style={styles.ratingText}>{item.rating}/5</Text>
        </View>

        {item.comment && (
          <Text style={styles.comment}>{item.comment}</Text>
        )}

        <TouchableOpacity
          style={styles.viewTransactionButton}
          onPress={() => {
            router.push({
              pathname: '/(protected)/customer/transaction-detail/[id]',
              params: { id: item.borrowTransactionId },
            });
          }}
        >
          <Ionicons name="receipt-outline" size={16} color="#0F4D3A" />
          <Text style={styles.viewTransactionText}>View Transaction</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterButton,
          selectedRating === null && styles.filterButtonActive,
        ]}
        onPress={() => setSelectedRating(null)}
      >
        <Text
          style={[
            styles.filterButtonText,
            selectedRating === null && styles.filterButtonTextActive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      {[5, 4, 3, 2, 1].map((rating) => (
        <TouchableOpacity
          key={rating}
          style={[
            styles.filterButton,
            selectedRating === rating && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedRating(rating)}
        >
          <Ionicons
            name="star"
            size={16}
            color={selectedRating === rating ? '#FFFFFF' : '#6B7280'}
          />
          <Text
            style={[
              styles.filterButtonText,
              selectedRating === rating && styles.filterButtonTextActive,
            ]}
          >
            {rating}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Feedbacks</Text>
        <View style={{ width: 40 }} />
      </View>

      {renderFilterButtons()}

      {loading && feedbacks.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F4D3A" />
          <Text style={styles.loadingText}>Loading feedbacks...</Text>
        </View>
      ) : feedbacks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>No Feedbacks Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your feedbacks will appear here after you rate businesses
          </Text>
        </View>
      ) : (
        <FlatList
          data={feedbacks}
          renderItem={renderFeedbackItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#0F4D3A" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#0F4D3A',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    gap: 4,
  },
  filterButtonActive: {
    backgroundColor: '#0F4D3A',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  listContent: {
    padding: 16,
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  businessLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  businessText: {
    flex: 1,
  },
  businessName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  feedbackDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F4D3A',
    marginLeft: 8,
  },
  comment: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  viewTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F4EA',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  viewTransactionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F4D3A',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});


