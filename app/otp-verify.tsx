import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

export default function OTPVerifyScreen() {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const inputs = useRef<Array<TextInput | null>>([]);

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

    // Verify when all filled
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleVerify();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/(tabs)');
  };

  const handleResend = () => {
    if (timer === 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setTimer(60);
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.content}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="shield-check-outline" size={40} color={Colors.secondary} />
          </View>
          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            Enter the 6-digit code sent to{'\n'}your phone number
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
            <TouchableOpacity onPress={handleResend} style={styles.resendButton}>
              <Ionicons name="refresh-outline" size={16} color={Colors.secondary} />
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).duration(600)}>
          <TouchableOpacity
            onPress={handleVerify}
            activeOpacity={0.9}
            disabled={!otp.every((digit) => digit !== '')}
            style={[styles.buttonWrapper, !otp.every((digit) => digit !== '') && styles.buttonDisabled]}
          >
            <LinearGradient
              colors={otp.every((digit) => digit !== '') ? [Colors.secondary, '#0891B2'] : [Colors.lightGray, Colors.gray]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Verify</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.xl,
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
