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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { ServiceIcon } from '@/components/ServiceIcon';
import { ordersAPI } from '@/services/api';

type OrderStatus = 'pending' | 'processing' | 'active' | 'delivered' | 'cancelled' | 'expired';

function formatPrice(price: number, currency: string = 'TZS') {
  if (currency === 'TZS') return `TZS ${Number(price).toLocaleString()}`;
  return `$${Number(price).toFixed(2)}`;
}

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'active': return Colors.success;
    case 'delivered': return Colors.success;
    case 'pending': return Colors.warning;
    case 'processing': return '#F59E0B';
    case 'cancelled': return Colors.error;
    case 'expired': return Colors.gray;
    default: return Colors.gray;
  }
};

const getStatusIcon = (status: OrderStatus): string => {
  switch (status) {
    case 'active': return 'checkmark-circle';
    case 'delivered': return 'checkmark-done-circle';
    case 'pending': return 'time';
    case 'processing': return 'hourglass';
    case 'cancelled': return 'close-circle';
    case 'expired': return 'close-circle';
    default: return 'information-circle';
  }
};

const getStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case 'pending': return 'Pending';
    case 'processing': return 'Processing';
    case 'active': return 'Active';
    case 'delivered': return 'Delivered';
    case 'cancelled': return 'Cancelled';
    case 'expired': return 'Expired';
    default: return status;
  }
};

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await ordersAPI.getMyOrders();
      if (response.success && response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
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

  const handleOrderPress = (order: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, '#1E40AF']}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>{orders.length} Total Orders</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.secondary} />
          }
        >
          {orders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={56} color={Colors.gray} />
              <Text style={styles.emptyTitle}>No orders yet</Text>
              <Text style={styles.emptySubtitle}>Your purchases will appear here</Text>
            </View>
          ) : (
            orders.map((order, index) => (
              <Animated.View
                key={order._id}
                entering={FadeInDown.delay(index * 50).duration(400)}
              >
                <TouchableOpacity
                  onPress={() => handleOrderPress(order)}
                  activeOpacity={0.9}
                  style={styles.orderCard}
                >
                  {/* Service Icon & Info */}
                  <View style={styles.orderHeader}>
                    <View style={[styles.serviceIconContainer, { backgroundColor: (order.serviceColor || '#06B6D4') + '15' }]}>
                      <ServiceIcon type={order.serviceIconType || 'internet'} size={24} color={order.serviceColor || '#06B6D4'} iconImage={order.serviceIconImage} />
                    </View>
                    <View style={styles.orderInfo}>
                      <Text style={styles.serviceName}>{order.serviceName}</Text>
                      <Text style={styles.orderDate}>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                      <Ionicons
                        name={getStatusIcon(order.status) as any}
                        size={14}
                        color={getStatusColor(order.status)}
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                        {getStatusLabel(order.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Order Details */}
                  <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Duration:</Text>
                      <Text style={styles.detailValue}>{order.serviceDuration}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Price:</Text>
                      <Text style={styles.detailValue}>{formatPrice(order.servicePrice, order.serviceCurrency)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Payment:</Text>
                      <Text style={styles.detailValue}>{order.paymentPhone}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Method:</Text>
                      <View style={[
                        styles.methodBadge,
                        { backgroundColor: order.paymentMethod === 'manual' ? '#FEF3C7' : '#DBEAFE' }
                      ]}>
                        <Text style={[
                          styles.methodBadgeText,
                          { color: order.paymentMethod === 'manual' ? '#92400E' : '#1E40AF' }
                        ]}>
                          {order.paymentMethod === 'manual' ? 'Manual' : 'USSD'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Awaiting Verification (manual payments) */}
                  {order.paymentStatus === 'awaiting_verification' && (
                    <View style={[styles.statusMessage, { backgroundColor: '#FEF3C7' }]}>
                      <Ionicons name="eye-outline" size={16} color="#92400E" />
                      <Text style={[styles.statusMessageText, { color: '#92400E' }]}>
                        Your payment proof is being reviewed by our team.
                      </Text>
                    </View>
                  )}

                  {/* Credentials (if available and status is active/delivered) */}
                  {order.credentials && (order.status === 'active' || order.status === 'delivered') &&
                    (order.credentials.username || order.credentials.password || order.credentials.accountDetails) && (
                    <View style={styles.credentials}>
                      <View style={styles.credentialsHeader}>
                        <Ionicons name="key" size={16} color={Colors.secondary} />
                        <Text style={styles.credentialsTitle}>Access Details</Text>
                      </View>
                      {order.credentials.username ? (
                        <View style={styles.credentialRow}>
                          <Text style={styles.credentialLabel}>Username:</Text>
                          <Text style={styles.credentialValue}>{order.credentials.username}</Text>
                        </View>
                      ) : null}
                      {order.credentials.password ? (
                        <View style={styles.credentialRow}>
                          <Text style={styles.credentialLabel}>Password:</Text>
                          <Text style={styles.credentialValue}>{order.credentials.password}</Text>
                        </View>
                      ) : null}
                      {order.credentials.accountDetails ? (
                        <Text style={styles.credentialNote}>{order.credentials.accountDetails}</Text>
                      ) : null}
                    </View>
                  )}

                  {/* Pending / Processing Messages */}
                  {order.status === 'pending' && (
                    <View style={styles.statusMessage}>
                      <Ionicons name="time-outline" size={16} color={Colors.warning} />
                      <Text style={styles.statusMessageText}>
                        Your order is awaiting confirmation. We&apos;ll process it shortly.
                      </Text>
                    </View>
                  )}
                  {order.status === 'processing' && (
                    <View style={styles.statusMessage}>
                      <Ionicons name="hourglass-outline" size={16} color={Colors.warning} />
                      <Text style={styles.statusMessageText}>
                        Your order is being processed. You&apos;ll receive access details soon.
                      </Text>
                    </View>
                  )}

                  {/* Admin Note */}
                  {order.adminNote ? (
                    <View style={styles.adminNote}>
                      <Ionicons name="chatbubble-outline" size={14} color={Colors.secondary} />
                      <Text style={styles.adminNoteText}>{order.adminNote}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.lightGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: Spacing.xxl * 2,
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
  ordersList: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  serviceName: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  orderDate: {
    ...Typography.small,
    color: Colors.gray,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  statusText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    ...Typography.small,
    color: Colors.gray,
  },
  detailValue: {
    ...Typography.small,
    fontWeight: '600',
    color: Colors.dark,
  },
  credentials: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  credentialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  credentialsTitle: {
    ...Typography.small,
    fontWeight: '600',
    color: Colors.dark,
  },
  credentialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  credentialLabel: {
    ...Typography.small,
    color: Colors.gray,
  },
  credentialValue: {
    ...Typography.small,
    fontWeight: '600',
    color: Colors.dark,
  },
  credentialNote: {
    ...Typography.small,
    color: Colors.gray,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warning + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  statusMessageText: {
    ...Typography.small,
    color: Colors.warning,
    flex: 1,
  },
  adminNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.secondary + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  adminNoteText: {
    ...Typography.caption,
    color: Colors.secondary,
    flex: 1,
  },
  methodBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  methodBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
});
