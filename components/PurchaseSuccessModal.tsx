import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated as RNAnimated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { ServiceIcon } from './ServiceIcon';

function formatPrice(price: number, currency: string = 'TZS') {
  if (currency === 'TZS') return `TZS ${Number(price).toLocaleString()}`;
  return `$${Number(price).toFixed(2)}`;
}

interface PurchaseSuccessModalProps {
  visible: boolean;
  service: any;
  onClose: () => void;
}

export default function PurchaseSuccessModal({ visible, service, onClose }: PurchaseSuccessModalProps) {
  const scaleAnim = useRef(new RNAnimated.Value(0)).current;
  const checkAnim = useRef(new RNAnimated.Value(0)).current;
  const confettiAnim = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Animate container
      RNAnimated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Animate checkmark
      RNAnimated.sequence([
        RNAnimated.delay(200),
        RNAnimated.spring(checkAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate confetti icons
      RNAnimated.sequence([
        RNAnimated.delay(300),
        RNAnimated.spring(confettiAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      checkAnim.setValue(0);
      confettiAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <RNAnimated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[Colors.primary, '#1E40AF']}
            style={styles.content}
          >
            {/* Success Icon */}
            <RNAnimated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: checkAnim }],
                },
              ]}
            >
              <View style={styles.iconCircle}>
                <Ionicons name="checkmark" size={48} color={Colors.white} />
              </View>
            </RNAnimated.View>

            {/* Celebration Icons */}
            <View style={styles.confetti}>
              <RNAnimated.View
                style={{
                  transform: [
                    { scale: confettiAnim },
                    { rotate: '-15deg' },
                  ],
                }}
              >
                <MaterialCommunityIcons name="party-popper" size={28} color={Colors.secondary} />
              </RNAnimated.View>
              <RNAnimated.View
                style={{
                  transform: [
                    { scale: confettiAnim },
                    { rotate: '15deg' },
                  ],
                }}
              >
                <MaterialCommunityIcons name="star-four-points" size={28} color={Colors.warning} />
              </RNAnimated.View>
            </View>

            {/* Text */}
            <Text style={styles.title}>Purchase Successful!</Text>
            <Text style={styles.message}>
              Your {service.name} has been activated successfully
            </Text>

            {/* Service Info */}
            <View style={styles.serviceInfo}>
              <View style={styles.serviceIconWrapper}>
                <ServiceIcon type={service.iconType} size={32} color={Colors.white} iconImage={service.iconImage} />
              </View>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>{formatPrice(service.price, service.currency)}</Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity onPress={onClose} activeOpacity={0.9}>
              <View style={styles.button}>
                <Text style={styles.buttonText}>View My Orders</Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </RNAnimated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 340,
  },
  content: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confetti: {
    position: 'absolute',
    top: Spacing.xl,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.white,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...Typography.body,
    color: Colors.lightGray,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  serviceInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    width: '100%',
  },
  serviceIconWrapper: {
    marginBottom: Spacing.xs,
  },
  serviceName: {
    ...Typography.body,
    color: Colors.white,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  servicePrice: {
    ...Typography.h3,
    color: Colors.secondary,
  },
  button: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  buttonText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
});
