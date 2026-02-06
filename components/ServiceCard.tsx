import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import { ServiceIcon } from './ServiceIcon';

interface ServiceCardProps {
  service: any;
  onPress: () => void;
}

function formatPrice(price: number, currency: string = 'TZS') {
  if (currency === 'TZS') {
    return `TZS ${Number(price).toLocaleString()}`;
  }
  return `$${Number(price).toFixed(2)}`;
}

export default function ServiceCard({ service, onPress }: ServiceCardProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.container}>
      <View style={styles.card}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: service.color + '15' }]}>
          <ServiceIcon type={service.iconType} size={28} color={service.color} iconImage={service.iconImage} />
        </View>

        {/* Content */}
        <Text style={styles.name} numberOfLines={1}>{service.name}</Text>
        <Text style={styles.duration}>{service.duration}</Text>
        <Text style={styles.description} numberOfLines={2}>{service.description}</Text>

        {/* Price & Button */}
        <View style={styles.footer}>
          <Text style={styles.price} numberOfLines={1}>{formatPrice(service.price, service.currency)}</Text>
          <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
            <LinearGradient
              colors={[Colors.secondary, '#0891B2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buyButton}
            >
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.medium,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  name: {
    ...Typography.h3,
    fontSize: 16,
    color: Colors.dark,
    marginBottom: Spacing.xs,
  },
  duration: {
    ...Typography.caption,
    color: Colors.gray,
    marginBottom: Spacing.xs,
  },
  description: {
    ...Typography.small,
    color: Colors.gray,
    marginBottom: Spacing.md,
    minHeight: 36,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    ...Typography.h3,
    fontSize: 14,
    color: Colors.primary,
    flex: 1,
    marginRight: Spacing.xs,
  },
  buyButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
  },
  buyButtonText: {
    ...Typography.small,
    fontWeight: '600',
    color: Colors.white,
  },
});
