import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/theme';
import ServiceCard from '@/components/ServiceCard';
import ServiceDetailSheet from '@/components/ServiceDetailSheet';
import { CategoryIcon } from '@/components/ServiceIcon';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { categoriesAPI, servicesAPI, notificationsAPI } from '@/services/api';

const { width } = Dimensions.get('window');

interface CategoryItem {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

interface ServiceItem {
  _id: string;
  name: string;
  category: { _id: string; name: string; icon: string; color: string } | string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  features: string[];
  iconType: string;
  color: string;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count when focused
  useFocusEffect(
    useCallback(() => {
      const fetchUnread = async () => {
        try {
          const res = await notificationsAPI.getUnreadCount();
          if (res.success && res.data) {
            setUnreadCount(res.data.count);
          }
        } catch (e) { /* ignore */ }
      };
      fetchUnread();
    }, [])
  );

  const fetchData = useCallback(async () => {
    try {
      const [catRes, svcRes] = await Promise.all([
        categoriesAPI.getAll(),
        servicesAPI.getAll(),
      ]);
      if (catRes.success && catRes.data) setCategories(catRes.data);
      if (svcRes.success && svcRes.data) setServices(svcRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const filteredServices = services.filter((service) => {
    const categoryName = typeof service.category === 'object' ? service.category?.name : '';
    const matchesCategory = selectedCategory === 'All' || categoryName === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCategorySelect = (category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const handleServicePress = (service: ServiceItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedService(service);
  };

  const firstName = user?.fullName?.split(' ')[0] || 'User';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const allCategories = ['All', ...categories.map((c) => c.name)];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header with Gradient */}
      <LinearGradient
        colors={[Colors.primary, '#1E40AF']}
        style={[styles.header, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>{greeting}, <Text style={styles.userName}>{firstName}</Text></Text>
          </View>
          <TouchableOpacity
            style={styles.bellButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/notifications');
            }}
          >
            <Ionicons name="notifications-outline" size={22} color={Colors.white} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatar}>
            {user?.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={20} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor={Colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {allCategories.map((category, index) => (
            <Animated.View
              key={category}
              entering={FadeInDown.delay(index * 50).duration(400)}
            >
              <TouchableOpacity
                onPress={() => handleCategorySelect(category)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={
                    selectedCategory === category
                      ? [Colors.secondary, '#0891B2']
                      : [Colors.white, Colors.white]
                  }
                  style={styles.categoryChip}
                >
                  <View style={styles.categoryChipContent}>
                    <CategoryIcon
                      category={category}
                      size={16}
                      color={selectedCategory === category ? Colors.white : Colors.dark}
                    />
                    <Text
                      style={[
                        styles.categoryText,
                        selectedCategory === category && styles.categoryTextActive,
                      ]}
                    >
                      {category}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
      </View>

      {/* Services Grid */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.secondary} />
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          keyExtractor={(item) => item._id}
          numColumns={2}
          contentContainerStyle={styles.servicesGrid}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.secondary} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="cube-outline" size={48} color={Colors.gray} />
              <Text style={styles.emptyText}>No services available</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 50).duration(400)}
              style={styles.serviceCardWrapper}
            >
              <ServiceCard service={item} onPress={() => handleServicePress(item)} />
            </Animated.View>
          )}
        />
      )}

      {/* Service Detail Sheet */}
      {selectedService && (
        <ServiceDetailSheet
          service={selectedService}
          visible={!!selectedService}
          onClose={() => setSelectedService(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.h2,
    color: Colors.white,
  },
  userName: {
    color: Colors.secondary,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  bellBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    ...Shadows.small,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.dark,
  },
  categoriesContainer: {
    marginTop: Spacing.md,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.full,
    ...Shadows.small,
  },
  categoryChipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryText: {
    ...Typography.small,
    fontWeight: '600',
    color: Colors.dark,
  },
  categoryTextActive: {
    color: Colors.white,
  },
  servicesGrid: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  serviceCardWrapper: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    marginHorizontal: Spacing.xs,
    marginBottom: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xxl * 2,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.gray,
    marginTop: Spacing.md,
  },
});
