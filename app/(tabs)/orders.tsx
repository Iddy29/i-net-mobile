import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { Order, OrderStatus, services } from '@/data/services';

export default function OrdersScreen() {
  // Dummy orders data
  const [orders] = useState<Order[]>([
    {
      id: '1',
      service: services[0],
      purchaseDate: new Date(2024, 0, 15),
      status: 'Active',
      credentials: {
        username: 'alex@inet.com',
        password: '••••••••',
      },
    },
    {
      id: '2',
      service: services[1],
      purchaseDate: new Date(2024, 0, 20),
      status: 'Delivering',
    },
    {
      id: '3',
      service: services[2],
      purchaseDate: new Date(2023, 11, 10),
      status: 'Expired',
    },
    {
      id: '4',
      service: services[3],
      purchaseDate: new Date(2024, 0, 18),
      status: 'Active',
      credentials: {
        accountDetails: 'Check your email for details',
      },
    },
  ]);

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'Active':
        return Colors.success;
      case 'Delivering':
        return Colors.warning;
      case 'Expired':
        return Colors.gray;
      default:
        return Colors.gray;
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'Active':
        return 'checkmark-circle';
      case 'Delivering':
        return 'time';
      case 'Expired':
        return 'close-circle';
      default:
        return 'information-circle';
    }
  };

  const handleOrderPress = (order: Order) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, '#1E40AF']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>{orders.length} Total Orders</Text>
      </LinearGradient>

      {/* Orders List */}
      <ScrollView
        contentContainerStyle={styles.ordersList}
        showsVerticalScrollIndicator={false}
      >
        {orders.map((order, index) => (
          <Animated.View
            key={order.id}
            entering={FadeInDown.delay(index * 50).duration(400)}
          >
            <TouchableOpacity
              onPress={() => handleOrderPress(order)}
              activeOpacity={0.9}
              style={styles.orderCard}
            >
              {/* Service Icon & Info */}
              <View style={styles.orderHeader}>
                <View style={[styles.serviceIcon, { backgroundColor: order.service.color + '15' }]}>
                  <Text style={styles.serviceEmoji}>{order.service.icon}</Text>
                </View>
                <View style={styles.orderInfo}>
                  <Text style={styles.serviceName}>{order.service.name}</Text>
                  <Text style={styles.orderDate}>
                    Purchased {order.purchaseDate.toLocaleDateString('en-US', {
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
                    {order.status}
                  </Text>
                </View>
              </View>

              {/* Order Details */}
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{order.service.duration}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Price:</Text>
                  <Text style={styles.detailValue}>${order.service.price.toFixed(2)}</Text>
                </View>
              </View>

              {/* Credentials (if available) */}
              {order.credentials && order.status === 'Active' && (
                <View style={styles.credentials}>
                  <View style={styles.credentialsHeader}>
                    <Ionicons name="key" size={16} color={Colors.secondary} />
                    <Text style={styles.credentialsTitle}>Access Details</Text>
                  </View>
                  {order.credentials.username && (
                    <View style={styles.credentialRow}>
                      <Text style={styles.credentialLabel}>Username:</Text>
                      <Text style={styles.credentialValue}>{order.credentials.username}</Text>
                    </View>
                  )}
                  {order.credentials.password && (
                    <View style={styles.credentialRow}>
                      <Text style={styles.credentialLabel}>Password:</Text>
                      <Text style={styles.credentialValue}>{order.credentials.password}</Text>
                    </View>
                  )}
                  {order.credentials.accountDetails && (
                    <Text style={styles.credentialNote}>{order.credentials.accountDetails}</Text>
                  )}
                </View>
              )}

              {/* Delivering Message */}
              {order.status === 'Delivering' && (
                <View style={styles.deliveringMessage}>
                  <Ionicons name="information-circle" size={16} color={Colors.warning} />
                  <Text style={styles.deliveringText}>
                    Your order is being processed. You'll receive access details within 24 hours.
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.xxl + Spacing.lg,
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
  ordersList: {
    padding: Spacing.lg,
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
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceEmoji: {
    fontSize: 24,
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
    marginBottom: Spacing.md,
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
  deliveringMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.warning + '10',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  deliveringText: {
    ...Typography.small,
    color: Colors.warning,
    flex: 1,
  },
});
