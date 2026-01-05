import { borrowTransactionsApi } from '@/services/api/borrowTransactionService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';



interface TransactionItem {
  _id: string;
  productId: {
    _id: string;
    productGroupId?: {
      name: string;
    };
    co2Reduced?: number;
  };
  customerId?: {
    _id: string;
    fullName: string;
    phone?: string;
  };
  borrowDate?: string;
  createdAt: string;
  co2Changed?: number;
  status: string;
  depositAmount?: number;
}



export default function BusinessCo2ReportScreen() {
  
  // List state (for pagination)
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  // Summary state (for total CO2 calculation)
  const [summaryData, setSummaryData] = useState<TransactionItem[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState<string | null>(null);
  const [tempEndDate, setTempEndDate] = useState<string | null>(null);

 

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const loadSummaryData = useCallback(async () => {
    try {
      setSummaryLoading(true);
      
      // For summary, we need ALL data first, then filter client-side
      // This ensures accurate CO2 calculation
      const params: any = {
        page: 1,
        limit: 10000, // Lấy tất cả để tính tổng CO2
      };

      if (statusFilter !== 'all') {
        // Map UI status to API status
        const statusMap: { [key: string]: string } = {
          borrowing: 'borrowing',
          pending: 'pending_pickup',
          returned: 'returned',
          lost: 'lost',
          rejected: 'rejected',
        };
        params.status = statusMap[statusFilter] || statusFilter;
      }
      // Note: Don't send fromDate/toDate to API for summary - filter client-side instead
      // This ensures we get all data first, then filter accurately
      if (productName) params.productName = productName;

      const response = await borrowTransactionsApi.getBusinessHistory(params);

      if (response.statusCode === 200) {
        let items = response.data?.items || response.data || [];
        
        // Filter by date range (client-side - always apply to ensure accuracy)
        if (fromDate || toDate) {
          items = items.filter((item: TransactionItem) => {
            const itemDate = item.borrowDate || item.createdAt;
            if (!itemDate) return false;
            
            try {
              const transactionDate = new Date(itemDate);
              if (isNaN(transactionDate.getTime())) return false;
              
              const dateStr = formatDateToString(transactionDate);
              
              if (fromDate && toDate) {
                return dateStr >= fromDate && dateStr <= toDate;
              } else if (fromDate) {
                return dateStr >= fromDate;
              } else if (toDate) {
                return dateStr <= toDate;
              }
            } catch (error) {
              console.error('Error parsing date:', itemDate, error);
              return false;
            }
            return true;
          });
        }
        
        // Filter by customer (client-side since API might not support it)
        if (customerFilter !== 'all') {
          items = items.filter((item: TransactionItem) => 
            item.customerId?._id === customerFilter
          );
        }
        
        setSummaryData(items);
      }
    } catch (error: any) {
      console.error('Failed to load summary data:', error?.message || error);
      setSummaryData([]);
    } finally {
      setSummaryLoading(false);
    }
  }, [statusFilter, fromDate, toDate, productName, customerFilter]);

  

  const loadTransactions = useCallback(async (pageNum: number, reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      const params: any = {
        page: pageNum,
        limit: limit * 2, // Load more to account for client-side filtering
      };

      if (statusFilter !== 'all') {
        // Map UI status to API status
        const statusMap: { [key: string]: string } = {
          borrowing: 'borrowing',
          pending: 'pending_pickup',
          returned: 'returned',
          lost: 'lost',
          rejected: 'rejected',
        };
        params.status = statusMap[statusFilter] || statusFilter;
      }
      // Note: We filter by date client-side to ensure accuracy
      // API might not support date filtering or might filter differently
      if (productName) params.productName = productName;

      const response = await borrowTransactionsApi.getBusinessHistory(params);

      if (response.statusCode === 200) {
        let items = response.data?.items || response.data || [];
        
        // Filter by date range (client-side - always apply to ensure accuracy)
        if (fromDate || toDate) {
          items = items.filter((item: TransactionItem) => {
            const itemDate = item.borrowDate || item.createdAt;
            if (!itemDate) return false;
            
            try {
              const transactionDate = new Date(itemDate);
              if (isNaN(transactionDate.getTime())) return false;
              
              const dateStr = formatDateToString(transactionDate);
              
              if (fromDate && toDate) {
                return dateStr >= fromDate && dateStr <= toDate;
              } else if (fromDate) {
                return dateStr >= fromDate;
              } else if (toDate) {
                return dateStr <= toDate;
              }
            } catch (error) {
              console.error('Error parsing date:', itemDate, error);
              return false;
            }
            return true;
          });
        }
        
        // Filter by customer (client-side since API might not support it)
        if (customerFilter !== 'all') {
          items = items.filter((item: TransactionItem) => 
            item.customerId?._id === customerFilter
          );
        }
        
        if (reset) {
          setTransactions(items);
        } else {
          setTransactions((prev) => [...prev, ...items]);
        }
        
        setHasMore(items.length === limit);
      } else {
        if (reset) {
          setTransactions([]);
        }
        setHasMore(false);
      }
    } catch (error: any) {
      console.error('Failed to load transactions:', error?.message || error);
      if (reset) {
        setTransactions([]);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [statusFilter, fromDate, toDate, productName, customerFilter, limit]);

 

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    loadTransactions(1, true);
    loadSummaryData();
  }, [statusFilter, fromDate, toDate, productName, customerFilter]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    loadTransactions(1, true);
    loadSummaryData();
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTransactions(nextPage, false);
    }
  };

  

  const totalCO2 = useMemo(() => {
    if (!summaryData || summaryData.length === 0) {
      return 0;
    }

    const total = summaryData.reduce((sum, transaction) => {
      let co2Value = 0;
      
      if (transaction.co2Changed !== undefined && transaction.co2Changed !== null) {
        co2Value = transaction.co2Changed;
      } else if (transaction.productId?.co2Reduced !== undefined && transaction.productId.co2Reduced !== null) {
        co2Value = transaction.productId.co2Reduced;
      }
      
      return sum + co2Value;
    }, 0);

    return total;
  }, [summaryData]);

  

  const uniqueCustomers = useMemo(() => {
    const customerMap = new Map<string, { id: string; name: string }>();
    
    // Get customers from summary data (all transactions)
    summaryData.forEach((item) => {
      if (item.customerId?._id && item.customerId?.fullName) {
        if (!customerMap.has(item.customerId._id)) {
          customerMap.set(item.customerId._id, {
            id: item.customerId._id,
            name: item.customerId.fullName,
          });
        }
      }
    });
    
    return Array.from(customerMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }, [summaryData]);

  

  const renderTransactionCard = ({ item }: { item: TransactionItem }) => {
    const productName = item.productId?.productGroupId?.name || 'Unknown Product';
    const customerName = item.customerId?.fullName || 'Unknown Customer';
    const date = item.borrowDate || item.createdAt;
    const formattedDate = date ? new Date(date).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) : 'N/A';
    
    let co2Value = 0;
    if (item.co2Changed !== undefined && item.co2Changed !== null) {
      co2Value = item.co2Changed;
    } else if (item.productId?.co2Reduced !== undefined && item.productId.co2Reduced !== null) {
      co2Value = item.productId.co2Reduced;
    }

    const statusColors: { [key: string]: string } = {
      completed: '#10B981',
      returned: '#10B981',
      borrowing: '#3B82F6',
      pending_pickup: '#F59E0B',
      pending: '#F59E0B',
      lost: '#EF4444',
      rejected: '#9CA3AF',
      cancelled: '#EF4444',
    };

    const statusColor = statusColors[item.status] || '#6B7280';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          router.push({
            pathname: '/(protected)/business/transaction-processing',
            params: { transactionId: item._id },
          });
        }}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="leaf" size={20} color="#10B981" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.productName} numberOfLines={1}>
              {productName}
            </Text>
            <View style={styles.customerRow}>
              <Ionicons name="person" size={14} color="#6B7280" />
              <Text style={styles.customerName} numberOfLines={1}>
                {customerName}
              </Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>Date:</Text>
              <Text style={styles.cardValue}>{formattedDate}</Text>
            </View>
            <View style={styles.cardRow}>
              <Text style={styles.cardLabel}>CO₂:</Text>
              <Text style={[styles.cardValue, styles.co2Value]}>
                {co2Value > 0 ? `+${co2Value.toFixed(2)}` : co2Value.toFixed(2)} kg
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {item.status === 'pending_pickup' ? 'PENDING' : 
               item.status === 'completed' ? 'RETURNED' : 
               item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date): number => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const day = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    // Convert to Monday-based week (0 = Monday, 6 = Sunday)
    return day === 0 ? 6 : day - 1;
  };

  const parseDateString = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  const isDateInRange = (date: Date, start: string | null, end: string | null): boolean => {
    if (!start || !end) return false;
    const dateStr = formatDateToString(date);
    return dateStr > start && dateStr < end;
  };

  const isDateSelected = (date: Date): boolean => {
    const dateStr = formatDateToString(date);
    const start = tempStartDate || fromDate;
    const end = tempEndDate || toDate;
    if (start && end) {
      return dateStr === start || dateStr === end;
    }
    return dateStr === start || dateStr === end;
  };

  const handleDatePress = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = formatDateToString(selectedDate);
    
    if (!tempStartDate) {
      // First selection - set as start date
      setTempStartDate(dateStr);
      setTempEndDate(null);
    } else if (!tempEndDate) {
      // Second selection - set as end date
      if (dateStr < tempStartDate) {
        // If selected date is before start, swap them
        setTempEndDate(tempStartDate);
        setTempStartDate(dateStr);
      } else {
        setTempEndDate(dateStr);
      }
    } else {
      // Reset and start new selection
      setTempStartDate(dateStr);
      setTempEndDate(null);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    const weekDays = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const start = tempStartDate || fromDate;
    const end = tempEndDate || toDate;
    
    return (
      <View style={styles.calendarContainer}>
        {/* Week day headers */}
        <View style={styles.weekDayRow}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.weekDayCell}>
              <Text style={styles.weekDayText}>{day}</Text>
            </View>
          ))}
        </View>
        
        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {days.map((day, index) => {
            if (day === null) {
              return <View key={index} style={styles.calendarCell} />;
            }
            
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateStr = formatDateToString(date);
            const isSelected = isDateSelected(date);
            const isInRange = isDateInRange(date, start, end);
            const isToday = dateStr === formatDateToString(new Date());
            const isOtherMonth = false; // All days shown are in current month
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarCell,
                  isInRange && styles.calendarCellInRange,
                  isSelected && styles.calendarCellSelected,
                ]}
                onPress={() => handleDatePress(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    isOtherMonth && styles.calendarDayTextOtherMonth,
                    isSelected && styles.calendarDayTextSelected,
                    isToday && !isSelected && styles.calendarDayTextToday,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                               Format Date Range                            */
  /* -------------------------------------------------------------------------- */

  const formatDateRange = (): string => {
    if (!fromDate && !toDate) {
      return 'Select Date Range';
    }
    
    const formatDate = (dateStr: string): string => {
      try {
        const date = new Date(dateStr);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
      } catch {
        return dateStr;
      }
    };
    
    if (fromDate && toDate) {
      return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
    } else if (fromDate) {
      return `From ${formatDate(fromDate)}`;
    } else if (toDate) {
      return `Until ${formatDate(toDate)}`;
    }
    
    return 'Select Date Range';
  };

  /* -------------------------------------------------------------------------- */
  /*                               Render Filter Section                         */
  /* -------------------------------------------------------------------------- */

  const renderFilterSection = () => {
    return (
      <View style={styles.filterSection}>
        {/* Search Bar - At Top */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by product name..."
            value={productName}
            onChangeText={setProductName}
            placeholderTextColor="#9CA3AF"
          />
          {productName.length > 0 && (
            <TouchableOpacity onPress={() => setProductName('')} style={styles.searchClearButton}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterChipsContainer}
        >
          {['all', 'borrowing', 'pending', 'returned', 'lost', 'rejected'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.filterChip, statusFilter === status && styles.filterChipActive]}
              onPress={() => setStatusFilter(status)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, statusFilter === status && styles.filterChipTextActive]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Date Range Row */}
        <TouchableOpacity
          style={styles.dateRangeRow}
          onPress={() => {
            setTempStartDate(fromDate || null);
            setTempEndDate(toDate || null);
            setCurrentMonth(new Date());
            setShowDatePicker(true);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="calendar-outline" size={20} color="#6B7280" />
          <Text style={[styles.dateRangeText, (!fromDate && !toDate) && styles.dateRangePlaceholder]}>
            {formatDateRange()}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Customer Filter */}
        {uniqueCustomers.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterChipsContainer}
          >
            <TouchableOpacity
              style={[styles.filterChip, customerFilter === 'all' && styles.filterChipActive]}
              onPress={() => setCustomerFilter('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, customerFilter === 'all' && styles.filterChipTextActive]}>
                All Customers
              </Text>
            </TouchableOpacity>
            {uniqueCustomers.map((customer) => (
              <TouchableOpacity
                key={customer.id}
                style={[styles.filterChip, customerFilter === customer.id && styles.filterChipActive]}
                onPress={() => setCustomerFilter(customer.id)}
                activeOpacity={0.7}
              >
                <Text 
                  style={[styles.filterChipText, customerFilter === customer.id && styles.filterChipTextActive]}
                  numberOfLines={1}
                >
                  {customer.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                               Render Summary Dashboard                     */
  /* -------------------------------------------------------------------------- */

  const renderSummaryDashboard = () => {
    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>CO₂ Report Summary</Text>
        
        {summaryLoading ? (
          <View style={styles.summaryLoadingContainer}>
            <ActivityIndicator size="small" color="#0F4D3A" />
            <Text style={styles.summaryLoadingText}>Calculating...</Text>
          </View>
        ) : (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total CO₂ Saved</Text>
            <Text style={styles.summaryValue}>
              {totalCO2.toFixed(2)} kg
            </Text>
            <Text style={styles.summarySubtext}>
              From {summaryData.length} transaction{summaryData.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                               Render Empty State                           */
  /* -------------------------------------------------------------------------- */

  const renderEmptyState = () => {
    if (loading) {
      return null;
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="leaf-outline" size={64} color="#D1D5DB" />
        <Text style={styles.emptyText}>No transactions found</Text>
        <Text style={styles.emptySubtext}>
          Your CO₂ report will appear here once you have transactions.
        </Text>
      </View>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                               Render Footer (Load More)                     */
  /* -------------------------------------------------------------------------- */

  const renderFooter = () => {
    if (!loadingMore) {
      return null;
    }

    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#0F4D3A" />
        <Text style={styles.footerText}>Loading more...</Text>
      </View>
    );
  };

  /* -------------------------------------------------------------------------- */
  /*                               Main Render                                  */
  /* -------------------------------------------------------------------------- */

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F4D3A" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CO₂ Report</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0F4D3A" />
          <Text style={styles.loadingText}>Loading CO₂ data...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionCard}
          keyExtractor={(item) => item._id}
          ListHeaderComponent={
            <>
              {renderFilterSection()}
              {renderSummaryDashboard()}
            </>
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}

      {/* Calendar Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowDatePicker(false);
          setTempStartDate(null);
          setTempEndDate(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.calendarModalContent}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.monthNavButton}
                onPress={() => {
                  const prevMonth = new Date(currentMonth);
                  prevMonth.setMonth(prevMonth.getMonth() - 1);
                  setCurrentMonth(prevMonth);
                }}
              >
                <Ionicons name="chevron-back" size={20} color="#6B7280" />
              </TouchableOpacity>
              
              <Text style={styles.calendarMonthText}>
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
              
              <TouchableOpacity
                style={styles.monthNavButton}
                onPress={() => {
                  const nextMonth = new Date(currentMonth);
                  nextMonth.setMonth(nextMonth.getMonth() + 1);
                  setCurrentMonth(nextMonth);
                }}
              >
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {renderCalendar()}
            
            <TouchableOpacity
              style={styles.doneButton}
              onPress={() => {
                if (tempStartDate) setFromDate(tempStartDate);
                if (tempEndDate) setToDate(tempEndDate);
                setShowDatePicker(false);
                setTempStartDate(null);
                setTempEndDate(null);
              }}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                               STYLES                                       */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#0F4D3A',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
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
  listContent: {
    padding: 16,
  },
  
  // Filter Section
  filterSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  searchClearButton: {
    padding: 4,
    marginLeft: 4,
  },
  filterChipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: {
    backgroundColor: '#1B5E20',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  dateRangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  dateRangeText: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    fontWeight: '500',
  },
  dateRangePlaceholder: {
    color: '#9CA3AF',
  },
  
  // Summary Dashboard
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  summaryCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  summaryLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  summaryLoadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F4D3A',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 12,
    color: '#6B7280',
  },
  
  // Transaction Card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  customerName: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  co2Value: {
    color: '#059669',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Calendar Date Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  calendarModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    maxHeight: '80%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthNavButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  calendarContainer: {
    marginBottom: 20,
  },
  weekDayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
  },
  calendarCellInRange: {
    backgroundColor: '#E0F2FE',
  },
  calendarCellSelected: {
    backgroundColor: '#3B82F6',
  },
  calendarDayText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  calendarDayTextOtherMonth: {
    color: '#D1D5DB',
  },
  calendarDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  doneButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

