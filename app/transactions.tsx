import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { ServiceIcon } from '@/components/ServiceIcon';
import { ordersAPI } from '@/services/api';

type FilterType = 'all' | 'completed' | 'pending' | 'failed';

function formatPrice(price: number, currency: string = 'TZS') {
  if (currency === 'TZS') return `TZS ${Number(price).toLocaleString()}`;
  return `$${Number(price).toFixed(2)}`;
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PaymentInfo {
  status: string;
  color: string;
  bgColor: string;
  icon: string;
  label: string;
}

function getPaymentInfo(paymentStatus: string): PaymentInfo {
  switch (paymentStatus) {
    case 'completed':
      return { status: 'completed', color: '#065F46', bgColor: '#D1FAE5', icon: 'checkmark-circle', label: 'Paid' };
    case 'failed':
      return { status: 'failed', color: '#991B1B', bgColor: '#FEE2E2', icon: 'close-circle', label: 'Failed' };
    case 'awaiting_verification':
      return { status: 'awaiting_verification', color: '#92400E', bgColor: '#FEF3C7', icon: 'eye-outline', label: 'Verifying' };
    case 'pending':
    default:
      return { status: 'pending', color: '#9A3412', bgColor: '#FFEDD5', icon: 'time-outline', label: 'Pending' };
  }
}

function getOrderStatusInfo(status: string) {
  switch (status) {
    case 'active':
      return { color: Colors.success, label: 'Active' };
    case 'delivered':
      return { color: '#06B6D4', label: 'Delivered' };
    case 'processing':
      return { color: '#F59E0B', label: 'Processing' };
    case 'cancelled':
      return { color: Colors.error, label: 'Cancelled' };
    case 'expired':
      return { color: Colors.gray, label: 'Expired' };
    case 'pending':
    default:
      return { color: '#F97316', label: 'Pending' };
  }
}

export default function TransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await ordersAPI.getMyOrders();
      if (response.success && response.data) {
        // Sort by newest first
        const sorted = response.data.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return order.paymentStatus === 'completed';
    if (filter === 'pending') return order.paymentStatus === 'pending' || order.paymentStatus === 'awaiting_verification';
    if (filter === 'failed') return order.paymentStatus === 'failed';
    return true;
  });

  const totalSpent = orders
    .filter((o) => o.paymentStatus === 'completed')
    .reduce((sum, o) => sum + (o.servicePrice || 0), 0);

  const toggleExpand = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedId(expandedId === id ? null : id);
  };

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: orders.length },
    {
      key: 'completed',
      label: 'Paid',
      count: orders.filter((o) => o.paymentStatus === 'completed').length,
    },
    {
      key: 'pending',
      label: 'Pending',
      count: orders.filter((o) => o.paymentStatus === 'pending' || o.paymentStatus === 'awaiting_verification').length,
    },
    {
      key: 'failed',
      label: 'Failed',
      count: orders.filter((o) => o.paymentStatus === 'failed').length,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, '#1E40AF']}
        style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Transactions</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Transactions</Text>
            <Text style={styles.summaryValue}>{orders.length}</Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCardAccent]}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>{formatPrice(totalSpent, 'TZS')}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(f.key);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
                {f.label}
              </Text>
              <View style={[styles.filterBadge, filter === f.key && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, filter === f.key && styles.filterBadgeTextActive]}>
                  {f.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.secondary} />
          }
        >
          {filteredOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="receipt" size={56} color={Colors.lightGray} />
              <Text style={styles.emptyTitle}>No transactions found</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all'
                  ? 'Your payment history will appear here'
                  : `No ${filter} transactions`}
              </Text>
            </View>
          ) : (
            <>
              {/* Group by date */}
              {groupByDate(filteredOrders).map(([dateLabel, dateOrders], groupIdx) => (
                <Animated.View key={dateLabel} entering={FadeInDown.delay(groupIdx * 60).duration(400)}>
                  <Text style={styles.dateGroupLabel}>{dateLabel}</Text>
                  {(dateOrders as any[]).map((order: any) => {
                    const payment = getPaymentInfo(order.paymentStatus);
                    const orderStatus = getOrderStatusInfo(order.status);
                    const isExpanded = expandedId === order._id;

                    return (
                      <TouchableOpacity
                        key={order._id}
                        style={styles.txCard}
                        onPress={() => toggleExpand(order._id)}
                        activeOpacity={0.8}
                      >
                        {/* Main Row */}
                        <View style={styles.txRow}>
                          <View style={[styles.txIcon, { backgroundColor: (order.serviceColor || '#06B6D4') + '15' }]}>
                            <ServiceIcon type={order.serviceIconType || 'internet'} size={22} color={order.serviceColor || '#06B6D4'} iconImage={order.serviceIconImage} />
                          </View>
                          <View style={styles.txInfo}>
                            <Text style={styles.txName} numberOfLines={1}>{order.serviceName}</Text>
                            <Text style={styles.txTime}>{formatTime(order.createdAt)}</Text>
                          </View>
                          <View style={styles.txRight}>
                            <Text style={styles.txAmount}>
                              {order.paymentStatus === 'completed' ? '-' : ''}{formatPrice(order.servicePrice, order.serviceCurrency)}
                            </Text>
                            <View style={[styles.txStatusBadge, { backgroundColor: payment.bgColor }]}>
                              <Ionicons name={payment.icon as any} size={12} color={payment.color} />
                              <Text style={[styles.txStatusText, { color: payment.color }]}>{payment.label}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <View style={styles.txDetails}>
                            <View style={styles.txDetailDivider} />

                            <View style={styles.txDetailRow}>
                              <Text style={styles.txDetailLabel}>Order Status</Text>
                              <View style={styles.txDetailValueRow}>
                                <View style={[styles.dot, { backgroundColor: orderStatus.color }]} />
                                <Text style={[styles.txDetailValue, { color: orderStatus.color, fontWeight: '600' }]}>
                                  {orderStatus.label}
                                </Text>
                              </View>
                            </View>

                            <View style={styles.txDetailRow}>
                              <Text style={styles.txDetailLabel}>Payment Method</Text>
                              <Text style={styles.txDetailValue}>
                                {order.paymentMethod === 'manual' ? 'Manual Transfer' : 'USSD Push'}
                              </Text>
                            </View>

                            <View style={styles.txDetailRow}>
                              <Text style={styles.txDetailLabel}>Phone</Text>
                              <Text style={styles.txDetailValue}>{order.paymentPhone}</Text>
                            </View>

                            {order.paymentNetwork ? (
                              <View style={styles.txDetailRow}>
                                <Text style={styles.txDetailLabel}>Network</Text>
                                <Text style={styles.txDetailValue}>{order.paymentNetwork}</Text>
                              </View>
                            ) : null}

                            {order.paymentTransactionId ? (
                              <View style={styles.txDetailRow}>
                                <Text style={styles.txDetailLabel}>Transaction ID</Text>
                                <Text style={[styles.txDetailValue, styles.txIdText]}>{order.paymentTransactionId}</Text>
                              </View>
                            ) : null}

                            <View style={styles.txDetailRow}>
                              <Text style={styles.txDetailLabel}>Duration</Text>
                              <Text style={styles.txDetailValue}>{order.serviceDuration}</Text>
                            </View>

                            <View style={styles.txDetailRow}>
                              <Text style={styles.txDetailLabel}>Date</Text>
                              <Text style={styles.txDetailValue}>
                                {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                              </Text>
                            </View>

                            {order.adminNote ? (
                              <View style={styles.txAdminNote}>
                                <Ionicons name="chatbubble-outline" size={13} color={Colors.secondary} />
                                <Text style={styles.txAdminNoteText}>{order.adminNote}</Text>
                              </View>
                            ) : null}
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </Animated.View>
              ))}
              <View style={{ height: 30 }} />
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

// Helper: group orders by date label (Today, Yesterday, or formatted date)
function groupByDate(orders: any[]): [string, any[]][] {
  const groups: Record<string, any[]> = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const toDateKey = (d: Date) => d.toISOString().split('T')[0];
  const todayKey = toDateKey(today);
  const yesterdayKey = toDateKey(yesterday);

  orders.forEach((order) => {
    const orderDate = new Date(order.createdAt);
    const key = toDateKey(orderDate);

    let label: string;
    if (key === todayKey) label = 'Today';
    else if (key === yesterdayKey) label = 'Yesterday';
    else label = orderDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    if (!groups[label]) groups[label] = [];
    groups[label].push(order);
  });

  return Object.entries(groups);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h3,
    color: Colors.white,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  summaryCardAccent: {
    backgroundColor: 'rgba(6,182,212,0.2)',
  },
  summaryLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  summaryValue: {
    ...Typography.h3,
    color: Colors.white,
    fontSize: 16,
  },

  // Filter
  filterRow: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    backgroundColor: Colors.white,
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    ...Typography.small,
    fontWeight: '600',
    color: Colors.gray,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  filterBadge: {
    backgroundColor: Colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.gray,
  },
  filterBadgeTextActive: {
    color: Colors.white,
  },

  // List
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: Spacing.lg,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.dark,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.gray,
    marginTop: Spacing.xs,
  },
  dateGroupLabel: {
    ...Typography.small,
    fontWeight: '700',
    color: Colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  // Transaction Card
  txCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  txInfo: {
    flex: 1,
  },
  txName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 2,
  },
  txTime: {
    ...Typography.caption,
    color: Colors.gray,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txAmount: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 4,
  },
  txStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  txStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Expanded Details
  txDetails: {
    paddingTop: Spacing.sm,
  },
  txDetailDivider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginBottom: Spacing.sm,
  },
  txDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  txDetailLabel: {
    ...Typography.caption,
    color: Colors.gray,
  },
  txDetailValue: {
    ...Typography.small,
    color: Colors.dark,
    fontWeight: '500',
  },
  txDetailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  txIdText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    color: Colors.gray,
  },
  txAdminNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    backgroundColor: Colors.secondary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
  },
  txAdminNoteText: {
    ...Typography.caption,
    color: Colors.secondary,
    flex: 1,
  },
});
