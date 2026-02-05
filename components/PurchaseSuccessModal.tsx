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
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { Service } from '@/data/services';

interface PurchaseSuccessModalProps {
  visible: boolean;
  service: Service;
  onClose: () => void;
}

export default function PurchaseSuccessModal({ visible, service, onClose }: PurchaseSuccessModalProps) {
  const scaleAnim = useRef(new RNAnimated.Value(0)).current;
  const checkAnim = useRef(new RNAnimated.Value(0)).current;

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
    } else {
      scaleAnim.setValue(0);
      checkAnim.setValue(0);
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

            {/* Confetti Emojis */}
            <View style={styles.confetti}>
              <Text style={styles.confettiEmoji}>🎉</Text>
              <Text style={[styles.confettiEmoji, styles.confettiRight]}>🎊</Text>
            </View>

            {/* Text */}
            <Text style={styles.title}>Purchase Successful!</Text>
            <Text style={styles.message}>
              Your {service.name} has been activated successfully
            </Text>

            {/* Service Info */}
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceIcon}>{service.icon}</Text>
              <Text style={styles.serviceName}>{service.name}</Text>
              <Text style={styles.servicePrice}>${service.price.toFixed(2)}</Text>
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
  confettiEmoji: {
    fontSize: 32,
  },
  confettiRight: {
    transform: [{ rotate: '-20deg' }],
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
  serviceIcon: {
    fontSize: 32,
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
