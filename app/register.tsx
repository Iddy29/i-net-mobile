import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to OTP verification
    router.push('/otp-verify');
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.form}>
            {/* Full Name */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconLeft}>
                <Ionicons name="person-outline" size={20} color={Colors.gray} />
              </View>
              <TextInput
                style={[styles.input, styles.inputWithLeftIcon]}
                placeholder="Full Name"
                placeholderTextColor={Colors.gray}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

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
              />
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconLeft}>
                <MaterialCommunityIcons name="phone-outline" size={20} color={Colors.gray} />
              </View>
              <TextInput
                style={[styles.input, styles.inputWithLeftIcon]}
                placeholder="Phone Number"
                placeholderTextColor={Colors.gray}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
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

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <View style={styles.inputIconLeft}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color={Colors.gray} />
              </View>
              <TextInput
                style={[styles.input, styles.inputWithLeftIcon, styles.inputWithRightIcon]}
                placeholder="Confirm Password"
                placeholderTextColor={Colors.gray}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={Colors.gray}
                />
              </TouchableOpacity>
            </View>

            {/* Register Button */}
            <TouchableOpacity onPress={handleRegister} activeOpacity={0.9} style={styles.buttonWrapper}>
              <LinearGradient
                colors={[Colors.secondary, '#0891B2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Register</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={handleLogin}>
                <Text style={styles.loginLink}>Log In</Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    color: Colors.dark,
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
  buttonWrapper: {
    marginTop: Spacing.lg,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  loginText: {
    ...Typography.body,
    color: Colors.gray,
  },
  loginLink: {
    ...Typography.body,
    color: Colors.secondary,
    fontWeight: '600',
  },
});
