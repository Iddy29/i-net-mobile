import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

function MenuItem({ icon, title, subtitle, onPress, showArrow = true, danger = false }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, danger && styles.menuIconDanger]}>
        {icon}
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, danger && styles.menuTitleDanger]}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
      )}
    </TouchableOpacity>
  );
}

export default function MenuScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handlePress = (action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Handle navigation based on action
    console.log(`Action: ${action}`);
  };

  const handleLogout = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient
        colors={[Colors.primary, '#1E40AF']}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={32} color={Colors.white} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Alex Johnson</Text>
            <Text style={styles.profileEmail}>alex@example.com</Text>
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handlePress('edit-profile')}
          >
            <MaterialCommunityIcons name="pencil-outline" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Menu Items */}
      <ScrollView
        contentContainerStyle={styles.menuList}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuSection}>
            <MenuItem
              icon={<Ionicons name="person-outline" size={22} color={Colors.primary} />}
              title="Profile Settings"
              subtitle="Update your personal information"
              onPress={() => handlePress('profile')}
            />
            <MenuItem
              icon={<MaterialCommunityIcons name="bell-outline" size={22} color={Colors.primary} />}
              title="Notifications"
              subtitle="Manage notification preferences"
              onPress={() => handlePress('notifications')}
            />
            <MenuItem
              icon={<MaterialCommunityIcons name="shield-check-outline" size={22} color={Colors.primary} />}
              title="Privacy & Security"
              subtitle="Password, 2FA settings"
              onPress={() => handlePress('security')}
            />
          </View>
        </Animated.View>

        {/* Services Section */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.menuSection}>
            <MenuItem
              icon={<MaterialCommunityIcons name="credit-card-outline" size={22} color={Colors.primary} />}
              title="Payment Methods"
              subtitle="Manage cards and wallets"
              onPress={() => handlePress('payment')}
            />
            <MenuItem
              icon={<MaterialCommunityIcons name="history" size={22} color={Colors.primary} />}
              title="Transaction History"
              subtitle="View past transactions"
              onPress={() => handlePress('history')}
            />
            <MenuItem
              icon={<MaterialCommunityIcons name="gift-outline" size={22} color={Colors.primary} />}
              title="Referral Program"
              subtitle="Invite friends, earn rewards"
              onPress={() => handlePress('referral')}
            />
          </View>
        </Animated.View>

        {/* Support Section */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuSection}>
            <MenuItem
              icon={<MaterialCommunityIcons name="help-circle-outline" size={22} color={Colors.primary} />}
              title="Help Center"
              subtitle="FAQs and guides"
              onPress={() => handlePress('help')}
            />
            <MenuItem
              icon={<MaterialCommunityIcons name="headphones" size={22} color={Colors.primary} />}
              title="Contact Support"
              subtitle="Get help from our team"
              onPress={() => handlePress('support')}
            />
            <MenuItem
              icon={<MaterialCommunityIcons name="file-document-outline" size={22} color={Colors.primary} />}
              title="Terms & Conditions"
              onPress={() => handlePress('terms')}
            />
          </View>
        </Animated.View>

        {/* App Info */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.menuSection}>
            <MenuItem
              icon={<MaterialCommunityIcons name="information-outline" size={22} color={Colors.primary} />}
              title="About i-net"
              subtitle="Version 1.0.0"
              onPress={() => handlePress('about')}
            />
            <MenuItem
              icon={<Ionicons name="log-out-outline" size={22} color={Colors.error} />}
              title="Log Out"
              onPress={handleLogout}
              showArrow={false}
              danger
            />
          </View>
        </Animated.View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with </Text>
          <MaterialCommunityIcons name="heart" size={14} color={Colors.secondary} />
          <Text style={styles.footerText}> by i-net Team</Text>
        </View>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  profileName: {
    ...Typography.h3,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  profileEmail: {
    ...Typography.small,
    color: Colors.lightGray,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuList: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.small,
    fontWeight: '600',
    color: Colors.gray,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  menuSection: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.small,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  menuIconDanger: {
    backgroundColor: Colors.error + '10',
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
  },
  menuTitleDanger: {
    color: Colors.error,
  },
  menuSubtitle: {
    ...Typography.caption,
    color: Colors.gray,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.gray,
  },
});
