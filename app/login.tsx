import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { authAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.success && response.data) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Save auth data and navigate to main app
        await login(response.data.token, response.data.user);
        router.replace('/(tabs)');
      } else if (response.requiresVerification) {
        // Account not verified - redirect to OTP screen
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          'Verification Required',
          response.message,
          [
            {
              text: 'Verify Now',
              onPress: () => {
                router.push({
                  pathname: '/otp-verify',
                  params: { email: email.trim().toLowerCase() },
                });
              },
            },
          ]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Login Failed', response.message);
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
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
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Log in to continue</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.form}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconLeft}>
                <MaterialCommunityIcons name="email-outline" size={20} color={Colors.gray} />
              </View>
              <TextInput
                style={[styles.input, styles.inputWithLeftIcon]}
                placeholder="Email Address"
                placeholderTextColor={Colors.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconLeft}>
                <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.gray} />
              </View>
              <TextInput
                style={[styles.input, styles.inputWithLeftIcon, styles.inputWithRightIcon]}
                placeholder="Password"
                placeholderTextColor={Colors.gray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.gray}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.9}
              style={[styles.buttonWrapper, isLoading && styles.buttonDisabled]}
              disabled={isLoading}
            >
              <LinearGradient
                colors={[Colors.secondary, '#0891B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.buttonText}>Log In</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don&apos;t have an account? </Text>
              <TouchableOpacity onPress={handleRegister}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: Spacing.xl + Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.gray,
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: Spacing.md,
    position: 'relative',
  },
  input: {
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.md + 4,
    borderRadius: BorderRadius.md,
    ...Typography.body,
    color: Colors.dark,
    ...Shadows.small,
  },
  inputWithLeftIcon: {
    paddingLeft: Spacing.xxl + Spacing.sm,
  },
  inputWithRightIcon: {
    paddingRight: Spacing.xxl + Spacing.md,
  },
  inputIconLeft: {
    position: 'absolute',
    left: Spacing.md + 4,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: Spacing.md + 4,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    ...Typography.small,
    color: Colors.secondary,
    fontWeight: '600',
  },
  buttonWrapper: {
    marginTop: Spacing.md,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  button: {
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.h3,
    color: Colors.white,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  registerText: {
    ...Typography.body,
    color: Colors.gray,
  },
  registerLink: {
    ...Typography.body,
    color: Colors.secondary,
    fontWeight: '600',
  },
});
