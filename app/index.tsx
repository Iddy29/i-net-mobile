import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/theme';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/register');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.primary, '#0F2557', Colors.dark]}
        style={styles.gradient}
      >
        {/* Animated Network Background */}
        <View style={styles.networkBackground}>
          <Animated.View entering={FadeInUp.delay(200).duration(1000)} style={styles.networkNode1} />
          <Animated.View entering={FadeInUp.delay(400).duration(1000)} style={styles.networkNode2} />
          <Animated.View entering={FadeInUp.delay(600).duration(1000)} style={styles.networkNode3} />
        </View>

        {/* Logo */}
        <Animated.View entering={FadeInDown.duration(800)} style={styles.logoContainer}>
          <Text style={styles.logoText}>
            <Text style={styles.logoI}>i</Text>
            <Text style={styles.logoNet}>-net</Text>
          </Text>
        </Animated.View>

        {/* Content */}
        <Animated.View entering={FadeInDown.delay(200).duration(800)} style={styles.content}>
          <Text style={styles.title}>Welcome to i-net.</Text>
          <Text style={styles.subtitle}>Your Premium{'\n'}Digital Marketplace.</Text>
          <Text style={styles.description}>
            Access exclusive bundles, accounts,{'\n'}and services instantly.
          </Text>
        </Animated.View>

        {/* CTA Button */}
        <Animated.View entering={FadeInDown.delay(400).duration(800)} style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleGetStarted} activeOpacity={0.9}>
            <LinearGradient
              colors={[Colors.secondary, '#0891B2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  networkBackground: {
    position: 'absolute',
    width: width,
    height: height,
    opacity: 0.15,
  },
  networkNode1: {
    position: 'absolute',
    top: height * 0.15,
    left: width * 0.1,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  networkNode2: {
    position: 'absolute',
    top: height * 0.25,
    right: width * 0.15,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  networkNode3: {
    position: 'absolute',
    top: height * 0.4,
    left: width * 0.25,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: Colors.secondary,
  },
  logoContainer: {
    marginTop: height * 0.15,
    alignItems: 'center',
  },
  logoText: {
    fontSize: 64,
    fontWeight: '700',
  },
  logoI: {
    color: Colors.secondary,
  },
  logoNet: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -height * 0.1,
  },
  title: {
    ...Typography.h1,
    fontSize: 36,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.h2,
    fontSize: 28,
    color: Colors.white,
    marginBottom: Spacing.lg,
  },
  description: {
    ...Typography.body,
    color: Colors.lightGray,
    lineHeight: 24,
  },
  buttonContainer: {
    marginBottom: Spacing.xxl + Spacing.lg,
  },
  button: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  buttonText: {
    ...Typography.h3,
    color: Colors.white,
  },
});
