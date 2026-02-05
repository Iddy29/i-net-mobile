import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome6 } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

export type ServiceIconType =
  | 'netflix'
  | 'chatgpt'
  | 'spotify'
  | 'tradingview'
  | 'data-bundle'
  | 'disney'
  | 'midjourney'
  | 'data-bundle-large'
  | 'streaming'
  | 'ai'
  | 'trading'
  | 'internet';

interface ServiceIconProps {
  type: ServiceIconType;
  size?: number;
  color?: string;
}

export function ServiceIcon({ type, size = 24, color }: ServiceIconProps) {
  const iconColor = color || Colors.dark;

  switch (type) {
    case 'netflix':
      return (
        <MaterialCommunityIcons name="netflix" size={size} color={color || '#E50914'} />
      );
    case 'chatgpt':
      return (
        <MaterialCommunityIcons name="robot-outline" size={size} color={color || '#10A37F'} />
      );
    case 'spotify':
      return (
        <FontAwesome6 name="spotify" size={size} color={color || '#1DB954'} />
      );
    case 'tradingview':
      return (
        <MaterialCommunityIcons name="chart-line" size={size} color={color || '#2962FF'} />
      );
    case 'data-bundle':
      return (
        <MaterialCommunityIcons name="signal-cellular-3" size={size} color={color || '#8B5CF6'} />
      );
    case 'disney':
      return (
        <MaterialCommunityIcons name="castle" size={size} color={color || '#113CCF'} />
      );
    case 'midjourney':
      return (
        <MaterialCommunityIcons name="palette-outline" size={size} color={color || '#FF6F61'} />
      );
    case 'data-bundle-large':
      return (
        <MaterialCommunityIcons name="rocket-launch-outline" size={size} color={color || '#EC4899'} />
      );
    // Category icons
    case 'streaming':
      return (
        <MaterialCommunityIcons name="play-circle-outline" size={size} color={iconColor} />
      );
    case 'ai':
      return (
        <MaterialCommunityIcons name="brain" size={size} color={iconColor} />
      );
    case 'trading':
      return (
        <MaterialCommunityIcons name="chart-areaspline" size={size} color={iconColor} />
      );
    case 'internet':
      return (
        <MaterialCommunityIcons name="wifi" size={size} color={iconColor} />
      );
    default:
      return (
        <Ionicons name="cube-outline" size={size} color={iconColor} />
      );
  }
}

// AI Assistant avatar icon component
interface AIAvatarProps {
  size?: number;
  backgroundColor?: string;
}

export function AIAvatar({ size = 36, backgroundColor }: AIAvatarProps) {
  const bgColor = backgroundColor || `${Colors.secondary}20`;
  const iconSize = size * 0.55;

  return (
    <View style={[styles.aiAvatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
      <MaterialCommunityIcons name="robot-happy-outline" size={iconSize} color={Colors.secondary} />
    </View>
  );
}

// User avatar icon component
interface UserAvatarProps {
  size?: number;
  backgroundColor?: string;
  iconColor?: string;
}

export function UserAvatar({ size = 36, backgroundColor, iconColor }: UserAvatarProps) {
  const bgColor = backgroundColor || Colors.secondary;
  const color = iconColor || Colors.white;
  const iconSize = size * 0.5;

  return (
    <View style={[styles.userAvatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
      <Ionicons name="person" size={iconSize} color={color} />
    </View>
  );
}

// Success checkmark icon with animation-ready styling
interface SuccessIconProps {
  size?: number;
  backgroundColor?: string;
}

export function SuccessIcon({ size = 96, backgroundColor }: SuccessIconProps) {
  const bgColor = backgroundColor || Colors.success;
  const iconSize = size * 0.5;

  return (
    <View style={[styles.successIcon, { width: size, height: size, borderRadius: size / 2, backgroundColor: bgColor }]}>
      <Ionicons name="checkmark" size={iconSize} color={Colors.white} />
    </View>
  );
}

// Celebration icons to replace confetti emojis
interface CelebrationIconsProps {
  size?: number;
}

export function CelebrationIcons({ size = 28 }: CelebrationIconsProps) {
  return (
    <>
      <MaterialCommunityIcons name="party-popper" size={size} color={Colors.secondary} />
      <MaterialCommunityIcons name="star-four-points" size={size} color={Colors.warning} style={{ transform: [{ rotate: '-20deg' }] }} />
    </>
  );
}

// Category chip icon
interface CategoryIconProps {
  category: string;
  size?: number;
  color?: string;
}

export function CategoryIcon({ category, size = 16, color }: CategoryIconProps) {
  const iconColor = color || Colors.dark;

  switch (category.toLowerCase()) {
    case 'all':
      return <MaterialCommunityIcons name="view-grid-outline" size={size} color={iconColor} />;
    case 'streaming':
      return <MaterialCommunityIcons name="play-circle-outline" size={size} color={iconColor} />;
    case 'ai':
      return <MaterialCommunityIcons name="brain" size={size} color={iconColor} />;
    case 'trading':
      return <MaterialCommunityIcons name="chart-line" size={size} color={iconColor} />;
    case 'internet':
      return <MaterialCommunityIcons name="wifi" size={size} color={iconColor} />;
    default:
      return <Ionicons name="apps-outline" size={size} color={iconColor} />;
  }
}

// Input field icons
interface InputIconProps {
  type: 'email' | 'password' | 'phone' | 'person' | 'lock';
  size?: number;
  color?: string;
}

export function InputIcon({ type, size = 20, color }: InputIconProps) {
  const iconColor = color || Colors.gray;

  switch (type) {
    case 'email':
      return <MaterialCommunityIcons name="email-outline" size={size} color={iconColor} />;
    case 'password':
    case 'lock':
      return <MaterialCommunityIcons name="lock-outline" size={size} color={iconColor} />;
    case 'phone':
      return <MaterialCommunityIcons name="phone-outline" size={size} color={iconColor} />;
    case 'person':
      return <Ionicons name="person-outline" size={size} color={iconColor} />;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  aiAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
