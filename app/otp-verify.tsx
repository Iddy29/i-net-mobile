import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { authAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function OTPVerifyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputs = useRef<Array<TextInput | null>>([]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits are filled
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');

    if (code.length !== 6) {
      Alert.alert('Invalid Code', 'Please enter the complete 6-digit code.');
      return;
    }

    if (!email) {
      Alert.alert('Error', 'Email not found. Please go back and try again.');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await authAPI.verifyOtp({
        email,
        otp: code,
      });

      if (response.success && response.data) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Save auth data and navigate to main app
        await login(response.data.token, response.data.user);
        router.replace('/(tabs)');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Verification Failed',
          response.message +
            (response.attemptsRemaining !== undefined
              ? `\n${response.attemptsRemaining} attempts remaining.`
              : '')
        );
        // Clear the OTP inputs on failure
        setOtp(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || !email) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsResending(true);

    try {
      const response = await authAPI.resendOtp({ email });

      if (response.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimer(60);
        setOtp(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
        Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // If there's a retry timer from the server, use it
        if (response.retryAfter) {
          setTimer(response.retryAfter);
        }
        Alert.alert('Resend Failed', response.message);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Custom Back Button */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.backButtonContainer}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <View style={styles.backButtonInner}>
              <Ionicons name="chevron-back" size={24} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="shield-check-outline" size={40} color={Colors.secondary} />
          </View>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={styles.emailText}>{email || 'your email'}</Text>
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => { inputs.current[index] = ref; }}
              style={[styles.otpInput, digit && styles.otpInputFilled]}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              editable={!isVerifying}
            />
          ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.timerContainer}>
          <View style={styles.timerRow}>
            <MaterialCommunityIcons name="timer-outline" size={18} color={Colors.gray} />
            <Text style={styles.timerText}>
              {timer > 0 ? `Resend code in ${timer}s` : 'Code expired'}
            </Text>
          </View>
          {timer === 0 && (
            <TouchableOpacity
              onPress={handleResend}
              style={styles.resendButton}
              disabled={isResending}
            >
              {isResending ? (
                <ActivityIndicator size="small" color={Colors.secondary} />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={16} color={Colors.secondary} />
                  <Text style={styles.resendLink}>Resend Code</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <TouchableOpacity
            onPress={() => handleVerify()}
            activeOpacity={0.9}
            disabled={!isOtpComplete || isVerifying}
            style={[styles.buttonWrapper, (!isOtpComplete || isVerifying) && styles.buttonDisabled]}
          >
            <LinearGradient
              colors={isOtpComplete ? [Colors.secondary, '#0891B2'] : [Colors.lightGray, Colors.gray]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {isVerifying ? (
                <ActivityIndicator color={Colors.white} size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Verify</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButtonContainer: {
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  backButtonInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.secondary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.dark,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.gray,
    lineHeight: 24,
  },
  emailText: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  otpInput: {
    width: 52,
    height: 60,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    textAlign: 'center',
    ...Typography.h2,
    color: Colors.dark,
    ...Shadows.small,
  },
  otpInputFilled: {
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  timerText: {
    ...Typography.body,
    color: Colors.gray,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  resendLink: {
    ...Typography.body,
    color: Colors.secondary,
    fontWeight: '600',
  },
  buttonWrapper: {
    marginTop: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  button: {
    flexDirection: 'row',
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: Spacing.xs,
  },
  buttonText: {
    ...Typography.h3,
    color: Colors.white,
  },
});
