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
import { notificationsAPI } from '@/services/api';

interface NotificationIcon {
  name: string;
  color: string;
  bgColor: string;
  library: 'ionicons' | 'material';
}

function getNotificationIcon(type: string): NotificationIcon {
  switch (type) {
    case 'payment_completed':
      return { name: 'checkmark-circle', color: '#065F46', bgColor: '#D1FAE5', library: 'ionicons' };
    case 'payment_failed':
      return { name: 'close-circle', color: '#991B1B', bgColor: '#FEE2E2', library: 'ionicons' };
    case 'payment_verified':
      return { name: 'shield-checkmark', color: '#1E40AF', bgColor: '#DBEAFE', library: 'ionicons' };
    case 'order_processing':
      return { name: 'hourglass-outline', color: '#9A3412', bgColor: '#FFEDD5', library: 'ionicons' };
    case 'order_active':
      return { name: 'flash', color: '#065F46', bgColor: '#D1FAE5', library: 'ionicons' };
    case 'order_delivered':
      return { name: 'gift-outline', color: '#155E75', bgColor: '#CFFAFE', library: 'ionicons' };
    case 'order_cancelled':
      return { name: 'ban-outline', color: '#991B1B', bgColor: '#FEE2E2', library: 'ionicons' };
    case 'order_credentials':
      return { name: 'key', color: '#7C3AED', bgColor: '#EDE9FE', library: 'ionicons' };
    case 'welcome':
      return { name: 'sparkles', color: '#D97706', bgColor: '#FEF3C7', library: 'ionicons' };
    default:
      return { name: 'notifications-outline', color: Colors.primary, bgColor: '#DBEAFE', library: 'ionicons' };
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const response = await notificationsAPI.getAll();
      if (response.success && response.data) {
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationPress = async (notification: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mark as read if not already
    if (!notification.isRead) {
      try {
        await notificationsAPI.markAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }

    // Navigate to orders tab if it's an order-related notification
    if (notification.order) {
      router.push('/(tabs)/orders');
    }
  };

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
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
              <Ionicons name="checkmark-done" size={18} color={Colors.white} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {unreadCount > 0 && (
          <View style={styles.unreadBanner}>
            <MaterialCommunityIcons name="bell-ring-outline" size={16} color={Colors.white} />
            <Text style={styles.unreadBannerText}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </LinearGradient>

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
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="notifications-off-outline" size={48} color={Colors.lightGray} />
              </View>
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySubtitle}>
                You'll be notified about payments, order updates, and more
              </Text>
            </View>
          ) : (
            notifications.map((notification, index) => {
              const icon = getNotificationIcon(notification.type);
              const isUnread = !notification.isRead;

              return (
                <Animated.View
                  key={notification._id}
                  entering={FadeInDown.delay(index * 30).duration(300)}
                >
                  <TouchableOpacity
                    style={[styles.notifCard, isUnread && styles.notifCardUnread]}
                    onPress={() => handleNotificationPress(notification)}
                    activeOpacity={0.7}
                  >
                    {/* Unread dot */}
                    {isUnread && <View style={styles.unreadDot} />}

                    {/* Icon */}
                    <View style={[styles.notifIcon, { backgroundColor: icon.bgColor }]}>
                      <Ionicons name={icon.name as any} size={20} color={icon.color} />
                    </View>

                    {/* Content */}
                    <View style={styles.notifContent}>
                      <View style={styles.notifTop}>
                        <Text style={[styles.notifTitle, isUnread && styles.notifTitleUnread]} numberOfLines={1}>
                          {notification.title}
                        </Text>
                        <Text style={styles.notifTime}>{timeAgo(notification.createdAt)}</Text>
                      </View>
                      <Text style={styles.notifMessage} numberOfLines={3}>
                        {notification.message}
                      </Text>
                      {notification.metadata?.serviceName && (
                        <View style={styles.notifMeta}>
                          <View
                            style={[
                              styles.metaDot,
                              { backgroundColor: notification.metadata.serviceColor || Colors.secondary },
                            ]}
                          />
                          <Text style={styles.metaText}>{notification.metadata.serviceName}</Text>
                          {notification.metadata.amount && (
                            <Text style={styles.metaAmount}>{notification.metadata.amount}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })
          )}
          <View style={{ height: 30 }} />
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
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
  markAllBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    alignSelf: 'flex-start',
  },
  unreadBannerText: {
    ...Typography.small,
    color: Colors.white,
    fontWeight: '600',
  },

  // List
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.lightGray + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.dark,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.gray,
    marginTop: Spacing.xs,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 22,
  },

  // Notification Card
  notifCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
    position: 'relative',
  },
  notifCardUnread: {
    backgroundColor: '#F0F7FF',
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  unreadDot: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
  },
  notifTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 3,
    paddingRight: Spacing.md,
  },
  notifTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: '700',
  },
  notifTime: {
    ...Typography.caption,
    color: Colors.gray,
    marginLeft: Spacing.sm,
    flexShrink: 0,
  },
  notifMessage: {
    ...Typography.small,
    color: Colors.gray,
    lineHeight: 20,
    marginBottom: Spacing.xs,
  },
  notifMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  metaText: {
    ...Typography.caption,
    color: Colors.dark,
    fontWeight: '500',
    flex: 1,
  },
  metaAmount: {
    ...Typography.caption,
    fontWeight: '700',
    color: Colors.primary,
  },
});
