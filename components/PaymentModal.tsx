import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated as RNAnimated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { ordersAPI, settingsAPI } from '@/services/api';

function formatPrice(price: number, currency: string = 'TZS') {
  if (currency === 'TZS') return `TZS ${Number(price).toLocaleString()}`;
  return `$${Number(price).toFixed(2)}`;
}

interface PaymentModalProps {
  visible: boolean;
  service: any;
  onSuccess: () => void;
  onClose: () => void;
}

type PaymentMethod = 'ussd' | 'manual';

type PaymentStep =
  | 'method'       // Choose payment method
  | 'phone'        // USSD: enter phone
  | 'initiating'   // USSD: sending push
  | 'waiting'      // USSD: waiting for PIN
  | 'manual_info'  // Manual: show payment details + proof input
  | 'manual_submitting' // Manual: submitting proof
  | 'success'      // Both: payment/order placed
  | 'failed';      // Both: failed

const POLL_INTERVAL = 3000;
const POLL_TIMEOUT = 90000;

interface PaymentSettingsData {
  manualPaymentEnabled: boolean;
  manualPaymentPhone: string;
  manualPaymentName: string;
  manualPaymentInstructions: string;
  ussdPaymentEnabled: boolean;
}

export default function PaymentModal({ visible, service, onSuccess, onClose }: PaymentModalProps) {
  const { user } = useAuth();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<PaymentStep>('method');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('ussd');
  const [secondsLeft, setSecondsLeft] = useState(90);
  const [network, setNetwork] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState('');
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettingsData | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const scaleAnim = useRef(new RNAnimated.Value(0)).current;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Fetch payment settings when modal opens
  useEffect(() => {
    if (visible) {
      setStep('method');
      setPaymentMethod('ussd');
      setPhone(user?.phone || '');
      setSecondsLeft(90);
      setNetwork('');
      setOrderId(null);
      setPaymentProof('');
      setLoadingSettings(true);

      RNAnimated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Load settings
      settingsAPI.getPaymentSettings().then((res) => {
        if (res.success && res.data) {
          setPaymentSettings(res.data);
          // If only one method is enabled, skip method selection
          if (res.data.ussdPaymentEnabled && !res.data.manualPaymentEnabled) {
            setPaymentMethod('ussd');
            setStep('phone');
          } else if (!res.data.ussdPaymentEnabled && res.data.manualPaymentEnabled) {
            setPaymentMethod('manual');
            setStep('manual_info');
          }
        }
        setLoadingSettings(false);
      }).catch(() => {
        setLoadingSettings(false);
      });
    } else {
      scaleAnim.setValue(0);
      stopPolling();
    }
  }, [visible]);

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startPolling = useCallback((orderIdToCheck: string) => {
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, Math.ceil((POLL_TIMEOUT - elapsed) / 1000));
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        stopPolling();
        handleTimeout(orderIdToCheck);
      }
    }, 1000);

    pollRef.current = setInterval(async () => {
      try {
        const res = await ordersAPI.checkPaymentStatus(orderIdToCheck);
        if (res.success && res.data) {
          if (res.data.paymentStatus === 'completed') {
            stopPolling();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setStep('success');
            setTimeout(() => onSuccess(), 1500);
          } else if (res.data.paymentStatus === 'failed') {
            stopPolling();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            setStep('failed');
          }
        }
      } catch (err) { /* retry next interval */ }
    }, POLL_INTERVAL);
  }, [stopPolling, onSuccess]);

  const handleTimeout = useCallback(async (orderIdToTimeout: string) => {
    try { await ordersAPI.paymentTimeout(orderIdToTimeout); } catch (e) { /* ignore */ }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setStep('failed');
  }, []);

  // ======= USSD: Submit phone =======
  const handleSubmitPhone = async () => {
    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^(\+?255|0)\d{9}$/.test(cleanPhone)) {
      Alert.alert('Invalid Number', 'Please enter a valid Tanzanian phone number (e.g. 0712345678)');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('initiating');

    try {
      const response = await ordersAPI.create({
        serviceId: service._id,
        paymentPhone: cleanPhone,
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to initiate payment');
      }

      const order = response.data;
      setOrderId(order._id);
      setNetwork(order.paymentNetwork || '');
      setSecondsLeft(90);
      setStep('waiting');
      startPolling(order._id);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStep('phone');
      Alert.alert('Payment Error', error.message || 'Failed to initiate payment. Please try again.');
    }
  };

  // ======= Manual: Submit proof =======
  const handleSubmitManualPayment = async () => {
    if (!paymentProof.trim() || paymentProof.trim().length < 10) {
      Alert.alert('Payment Proof Required', 'Please paste the full payment confirmation message you received after sending the money.');
      return;
    }

    const cleanPhone = phone.replace(/\s/g, '');
    if (!/^(\+?255|0)\d{9}$/.test(cleanPhone)) {
      Alert.alert('Invalid Number', 'Please enter the phone number you used to send the payment.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('manual_submitting');

    try {
      const response = await ordersAPI.createManual({
        serviceId: service._id,
        paymentPhone: cleanPhone,
        manualPaymentProof: paymentProof.trim(),
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit order');
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('success');
      setTimeout(() => onSuccess(), 1500);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setStep('manual_info');
      Alert.alert('Error', error.message || 'Failed to submit order. Please try again.');
    }
  };

  // ======= Method selection =======
  const handleSelectMethod = (method: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaymentMethod(method);
    if (method === 'ussd') {
      setStep('phone');
    } else {
      setStep('manual_info');
    }
  };

  const handleClose = () => {
    if (step === 'initiating' || step === 'manual_submitting') return;
    if (step === 'waiting') {
      Alert.alert(
        'Cancel Payment?',
        'The USSD push has been sent. If you close now and complete the payment on your phone, the order may still go through.',
        [
          { text: 'Keep Waiting', style: 'cancel' },
          { text: 'Close', style: 'destructive', onPress: () => { stopPolling(); onClose(); } },
        ]
      );
      return;
    }
    stopPolling();
    onClose();
  };

  const handleRetry = () => {
    setStep('method');
    setOrderId(null);
    setPaymentProof('');
  };

  const handleBack = () => {
    if (step === 'phone' || step === 'manual_info') {
      // Check if both methods are available
      if (paymentSettings?.ussdPaymentEnabled && paymentSettings?.manualPaymentEnabled) {
        setStep('method');
      } else {
        handleClose();
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
        <RNAnimated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>

          {/* ===== LOADING SETTINGS ===== */}
          {loadingSettings && step === 'method' && (
            <View style={[styles.content, styles.centerContent]}>
              <ActivityIndicator size="large" color={Colors.secondary} />
              <Text style={styles.processingSubtitle}>Loading payment options...</Text>
            </View>
          )}

          {/* ===== METHOD SELECTION STEP ===== */}
          {!loadingSettings && step === 'method' && (
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={styles.paymentIcon}>
                  <MaterialCommunityIcons name="credit-card-outline" size={28} color={Colors.secondary} />
                </View>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={Colors.gray} />
                </TouchableOpacity>
              </View>

              <Text style={styles.title}>Choose Payment Method</Text>
              <Text style={styles.subtitle}>Select how you'd like to pay for this service</Text>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{service?.name}</Text>
                <Text style={styles.summaryPrice}>{formatPrice(service?.price, service?.currency)}</Text>
              </View>

              {paymentSettings?.ussdPaymentEnabled && (
                <TouchableOpacity
                  style={styles.methodCard}
                  onPress={() => handleSelectMethod('ussd')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.methodIconWrap, { backgroundColor: '#DBEAFE' }]}>
                    <MaterialCommunityIcons name="cellphone" size={24} color="#1E40AF" />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodTitle}>USSD Push Payment</Text>
                    <Text style={styles.methodDesc}>
                      Pay instantly via M-Pesa, Tigo Pesa, or Airtel Money. A USSD prompt will be sent to your phone.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                </TouchableOpacity>
              )}

              {paymentSettings?.manualPaymentEnabled && (
                <TouchableOpacity
                  style={styles.methodCard}
                  onPress={() => handleSelectMethod('manual')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.methodIconWrap, { backgroundColor: '#FEF3C7' }]}>
                    <MaterialCommunityIcons name="cash-multiple" size={24} color="#92400E" />
                  </View>
                  <View style={styles.methodInfo}>
                    <Text style={styles.methodTitle}>Manual Payment</Text>
                    <Text style={styles.methodDesc}>
                      Send money manually and paste your confirmation message. Verified by our team.
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* ===== USSD: PHONE INPUT STEP ===== */}
          {step === 'phone' && (
            <View style={styles.content}>
              <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={20} color={Colors.dark} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={Colors.gray} />
                </TouchableOpacity>
              </View>

              <View style={[styles.paymentIcon, { alignSelf: 'flex-start', marginBottom: Spacing.md }]}>
                <MaterialCommunityIcons name="cellphone" size={28} color={Colors.secondary} />
              </View>

              <Text style={styles.title}>USSD Push Payment</Text>
              <Text style={styles.subtitle}>
                Enter your M-Pesa / Tigo Pesa / Airtel Money number
              </Text>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{service?.name}</Text>
                <Text style={styles.summaryPrice}>{formatPrice(service?.price, service?.currency)}</Text>
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputPrefix}>
                  <Text style={styles.prefixText}>+255</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="0712 345 678"
                  placeholderTextColor={Colors.gray}
                  keyboardType="phone-pad"
                  maxLength={13}
                  autoFocus
                />
              </View>

              <Text style={styles.disclaimer}>
                A USSD push will be sent to this number. Enter your PIN on your phone to confirm payment.
              </Text>

              <TouchableOpacity onPress={handleSubmitPhone} activeOpacity={0.9}>
                <LinearGradient
                  colors={[Colors.secondary, '#0891B2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payBtn}
                >
                  <MaterialCommunityIcons name="lock-outline" size={18} color={Colors.white} />
                  <Text style={styles.payBtnText}>Pay {formatPrice(service?.price, service?.currency)}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ===== USSD: INITIATING STEP ===== */}
          {step === 'initiating' && (
            <View style={[styles.content, styles.centerContent]}>
              <ActivityIndicator size="large" color={Colors.secondary} />
              <Text style={styles.processingTitle}>Initiating Payment...</Text>
              <Text style={styles.processingSubtitle}>Sending USSD push to your phone</Text>
            </View>
          )}

          {/* ===== USSD: WAITING FOR PIN STEP ===== */}
          {step === 'waiting' && (
            <View style={styles.content}>
              <View style={styles.ussdIconWrap}>
                <MaterialCommunityIcons name="cellphone-message" size={48} color={Colors.warning} />
              </View>

              <Text style={styles.title}>Enter Your PIN</Text>
              <Text style={styles.subtitle}>
                Check your phone{' '}
                <Text style={styles.phoneHighlight}>{phone}</Text>
                {network ? ` (${network})` : ''} and enter your mobile money PIN to confirm.
              </Text>

              <View style={styles.ussdCard}>
                <View style={styles.ussdHeader}>
                  <MaterialCommunityIcons name="sim" size={16} color={Colors.white} />
                  <Text style={styles.ussdHeaderText}>{network || 'Mobile Money'}</Text>
                </View>
                <Text style={styles.ussdBody}>
                  Confirm payment of {formatPrice(service?.price, service?.currency)} to i-Net Services.{'\n'}
                  Enter your PIN to confirm.
                </Text>
                <View style={styles.ussdPinRow}>
                  {[1, 2, 3, 4].map((i) => (
                    <View key={i} style={styles.ussdPinDot}>
                      <Text style={styles.ussdPinDotText}>*</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.waitingFooter}>
                <ActivityIndicator size="small" color={Colors.secondary} />
                <Text style={styles.waitingText}>
                  Waiting for confirmation... {formatTime(secondsLeft)}
                </Text>
              </View>

              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${((90 - secondsLeft) / 90) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}

          {/* ===== MANUAL: PAYMENT INFO + PROOF ===== */}
          {step === 'manual_info' && paymentSettings && (
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.header}>
                <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={20} color={Colors.dark} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={Colors.gray} />
                </TouchableOpacity>
              </View>

              <View style={[styles.paymentIcon, { alignSelf: 'flex-start', marginBottom: Spacing.md, backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="cash-multiple" size={28} color="#92400E" />
              </View>

              <Text style={styles.title}>Manual Payment</Text>
              <Text style={styles.subtitle}>
                Send the exact amount to the number below, then paste your confirmation message.
              </Text>

              {/* Service & Amount */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>{service?.name}</Text>
                <Text style={styles.summaryPrice}>{formatPrice(service?.price, service?.currency)}</Text>
              </View>

              {/* Payment Details Card */}
              <View style={styles.manualPaymentCard}>
                <Text style={styles.manualPaymentLabel}>SEND PAYMENT TO</Text>
                <Text style={styles.manualPaymentPhone}>{paymentSettings.manualPaymentPhone}</Text>
                <Text style={styles.manualPaymentName}>{paymentSettings.manualPaymentName}</Text>
                <View style={styles.manualAmountRow}>
                  <Text style={styles.manualAmountLabel}>Amount:</Text>
                  <Text style={styles.manualAmountValue}>{formatPrice(service?.price, service?.currency)}</Text>
                </View>
              </View>

              {paymentSettings.manualPaymentInstructions ? (
                <View style={styles.instructionsCard}>
                  <MaterialCommunityIcons name="information-outline" size={16} color="#0369A1" />
                  <Text style={styles.instructionsText}>{paymentSettings.manualPaymentInstructions}</Text>
                </View>
              ) : null}

              {/* Phone used to pay */}
              <Text style={styles.fieldLabel}>Phone Number Used to Pay</Text>
              <View style={styles.inputContainer}>
                <View style={styles.inputPrefix}>
                  <Text style={styles.prefixText}>+255</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="0712 345 678"
                  placeholderTextColor={Colors.gray}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
              </View>

              {/* Payment Proof */}
              <Text style={styles.fieldLabel}>Payment Confirmation Message</Text>
              <TextInput
                style={styles.proofInput}
                value={paymentProof}
                onChangeText={setPaymentProof}
                placeholder="Paste the full confirmation SMS or message you received after sending the payment..."
                placeholderTextColor={Colors.gray}
                multiline
                textAlignVertical="top"
                numberOfLines={5}
              />
              <Text style={styles.proofHint}>
                <MaterialCommunityIcons name="shield-check-outline" size={12} color={Colors.gray} />{' '}
                Our team will verify this message and process your order
              </Text>

              <TouchableOpacity onPress={handleSubmitManualPayment} activeOpacity={0.9} style={{ marginTop: Spacing.md }}>
                <LinearGradient
                  colors={['#D97706', '#B45309']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.payBtn}
                >
                  <MaterialCommunityIcons name="check-circle-outline" size={18} color={Colors.white} />
                  <Text style={styles.payBtnText}>Submit Payment Proof</Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ===== MANUAL: SUBMITTING ===== */}
          {step === 'manual_submitting' && (
            <View style={[styles.content, styles.centerContent]}>
              <ActivityIndicator size="large" color="#D97706" />
              <Text style={styles.processingTitle}>Submitting Order...</Text>
              <Text style={styles.processingSubtitle}>Your payment proof is being sent for verification</Text>
            </View>
          )}

          {/* ===== SUCCESS STEP ===== */}
          {step === 'success' && (
            <View style={[styles.content, styles.centerContent]}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={40} color={Colors.white} />
              </View>
              <Text style={styles.processingTitle}>
                {paymentMethod === 'manual' ? 'Order Submitted!' : 'Payment Successful!'}
              </Text>
              <Text style={styles.processingSubtitle}>
                {paymentMethod === 'manual'
                  ? 'Your payment is being verified. We\'ll process your order once confirmed.'
                  : 'Your order has been placed'
                }
              </Text>
            </View>
          )}

          {/* ===== FAILED STEP ===== */}
          {step === 'failed' && (
            <View style={[styles.content, styles.centerContent]}>
              <View style={styles.failCircle}>
                <Ionicons name="close" size={40} color={Colors.white} />
              </View>
              <Text style={styles.processingTitle}>Payment Failed</Text>
              <Text style={styles.processingSubtitle}>
                The payment was not confirmed within the time limit. No money was deducted.
              </Text>
              <View style={styles.failActions}>
                <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
                  <Ionicons name="refresh" size={18} color={Colors.secondary} />
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { stopPolling(); onClose(); }} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </RNAnimated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  container: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '90%',
  },
  scrollContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    maxHeight: '100%',
  },
  scrollContent: {
    padding: Spacing.xl,
  },
  content: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
  },
  centerContent: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  paymentIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...Typography.h2,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.gray,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  phoneHighlight: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  summaryLabel: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.dark,
    flex: 1,
  },
  summaryPrice: {
    ...Typography.h3,
    color: Colors.primary,
  },

  // ===== Method Selection =====
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  methodIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: 2,
  },
  methodDesc: {
    ...Typography.small,
    color: Colors.gray,
    lineHeight: 18,
  },

  // ===== Phone Input =====
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.small,
  },
  inputPrefix: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
  },
  prefixText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.white,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md + 2,
    ...Typography.body,
    color: Colors.dark,
    letterSpacing: 1,
  },
  disclaimer: {
    ...Typography.caption,
    color: Colors.gray,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 18,
  },
  payBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.full,
  },
  payBtnText: {
    ...Typography.h3,
    color: Colors.white,
  },
  processingTitle: {
    ...Typography.h3,
    color: Colors.dark,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  processingSubtitle: {
    ...Typography.body,
    color: Colors.gray,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },

  // ===== USSD Waiting =====
  ussdIconWrap: {
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  ussdCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  ussdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: '#16213e',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  ussdHeaderText: {
    ...Typography.caption,
    color: Colors.white,
    fontWeight: '600',
  },
  ussdBody: {
    ...Typography.small,
    color: '#94a3b8',
    padding: Spacing.md,
    lineHeight: 20,
  },
  ussdPinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  ussdPinDot: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#0f3460',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ussdPinDotText: {
    color: Colors.secondary,
    fontSize: 18,
    fontWeight: '700',
  },
  waitingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  waitingText: {
    ...Typography.small,
    color: Colors.gray,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.secondary,
    borderRadius: 2,
  },

  // ===== Manual Payment =====
  manualPaymentCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  manualPaymentLabel: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  manualPaymentPhone: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 1,
    marginBottom: 4,
  },
  manualPaymentName: {
    ...Typography.body,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.md,
  },
  manualAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  manualAmountLabel: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.6)',
  },
  manualAmountValue: {
    ...Typography.body,
    fontWeight: '700',
    color: '#FCD34D',
  },
  instructionsCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: '#E0F2FE',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
  },
  instructionsText: {
    ...Typography.small,
    color: '#0369A1',
    flex: 1,
    lineHeight: 20,
  },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  proofInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.dark,
    minHeight: 120,
    lineHeight: 22,
    ...Shadows.small,
  },
  proofHint: {
    ...Typography.caption,
    color: Colors.gray,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },

  // ===== Success / Fail =====
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.secondary + '15',
  },
  retryBtnText: {
    ...Typography.body,
    fontWeight: '600',
    color: Colors.secondary,
  },
  cancelBtn: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  cancelBtnText: {
    ...Typography.body,
    color: Colors.gray,
  },
});
