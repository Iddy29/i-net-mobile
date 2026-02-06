import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated as RNAnimated,
  PanResponder,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { ServiceIcon } from './ServiceIcon';
import PaymentModal from './PaymentModal';
import PurchaseSuccessModal from './PurchaseSuccessModal';

const { height, width } = Dimensions.get('window');

function formatPrice(price: number, currency: string = 'TZS') {
  if (currency === 'TZS') {
    return `TZS ${Number(price).toLocaleString()}`;
  }
  return `$${Number(price).toFixed(2)}`;
}

interface ServiceDetailSheetProps {
  service: any;
  visible: boolean;
  onClose: () => void;
}

export default function ServiceDetailSheet({ service, visible, onClose }: ServiceDetailSheetProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [slideValue] = useState(new RNAnimated.Value(0));
  const slideAnim = useRef(slideValue).current;

  const categoryName = typeof service.category === 'object' ? service.category?.name : service.category;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0 && gestureState.dx < width - 100) {
          slideAnim.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx > width * 0.7) {
          RNAnimated.timing(slideAnim, {
            toValue: width - 100,
            duration: 200,
            useNativeDriver: false,
          }).start(() => {
            handleSlideComplete();
          });
        } else {
          RNAnimated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const handleSlideComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    slideAnim.setValue(0);
    // Open payment modal
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    // Payment confirmed via FastLipa - show success
    setShowPayment(false);
    setShowSuccess(true);
  };

  const handlePaymentClose = () => {
    setShowPayment(false);
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
  };

  return (
    <>
      <Modal
        visible={visible && !showPayment && !showSuccess}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: service.color + '15' }]}>
                <ServiceIcon type={service.iconType} size={36} color={service.color} iconImage={service.iconImage} />
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.dark} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
              <Text style={styles.name}>{service.name}</Text>
              <Text style={styles.category}>{categoryName || ''}</Text>
              <Text style={styles.description}>{service.description}</Text>

              {/* Price */}
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.price}>{formatPrice(service.price, service.currency)}</Text>
              </View>

              {/* Features */}
              {service.features && service.features.length > 0 && (
                <>
                  <Text style={styles.featuresTitle}>What&apos;s Included:</Text>
                  {service.features.map((feature: string, index: number) => (
                    <View key={index} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            {/* Slide to Confirm */}
            <View style={styles.slideContainer}>
              <View style={styles.slideTrack}>
                <Text style={styles.slideText}>Slide to Order</Text>
                <RNAnimated.View
                  style={[
                    styles.slideThumb,
                    {
                      transform: [{ translateX: slideAnim }],
                    },
                  ]}
                  {...panResponder.panHandlers}
                >
                  <LinearGradient
                    colors={[Colors.secondary, '#0891B2']}
                    style={styles.slideThumbGradient}
                  >
                    <Ionicons name="arrow-forward" size={24} color={Colors.white} />
                  </LinearGradient>
                </RNAnimated.View>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <PaymentModal
        visible={showPayment}
        service={service}
        onSuccess={handlePaymentSuccess}
        onClose={handlePaymentClose}
      />

      {/* Success Modal */}
      <PurchaseSuccessModal
        visible={showSuccess}
        service={service}
        onClose={handleSuccessClose}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: height * 0.85,
    paddingBottom: Spacing.xl,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: Spacing.xs,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  name: {
    ...Typography.h2,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  category: {
    ...Typography.small,
    color: Colors.secondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.gray,
    marginBottom: Spacing.lg,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  priceLabel: {
    ...Typography.body,
    color: Colors.gray,
  },
  price: {
    ...Typography.h2,
    color: Colors.primary,
  },
  featuresTitle: {
    ...Typography.h3,
    color: Colors.dark,
    marginBottom: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureText: {
    ...Typography.body,
    color: Colors.dark,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  slideContainer: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  slideTrack: {
    height: 60,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  slideText: {
    ...Typography.body,
    color: Colors.gray,
    fontWeight: '600',
  },
  slideThumb: {
    position: 'absolute',
    left: 4,
    width: 52,
    height: 52,
  },
  slideThumbGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.medium,
  },
});
