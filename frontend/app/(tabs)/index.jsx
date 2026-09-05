import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  MapPin,
  Search,
  Plus,
  Star,
  CheckCircle2,
  Navigation,
  ShoppingBag,
  Utensils,
  Pill,
  Package,
  FileText,
  Sparkles,
  X,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  Shirt,
  Compass,
} from 'lucide-react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { LiquidGlassCard, LiquidGlassBadge, LiquidCanvas } from '../../components/ui/LiquidGlass';

const RADIUS_OPTIONS = [1, 2, 5];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'food', label: 'Food & Mess', icon: Utensils },
  { id: 'grocery', label: 'Grocery', icon: ShoppingBag },
  { id: 'medicine', label: 'Pharmacy', icon: Pill },
  { id: 'courier', label: 'Courier', icon: Package },
  { id: 'stationery', label: 'Stationery', icon: FileText },
  { id: 'laundry', label: 'Laundry', icon: Shirt },
];

const CATEGORY_ICONS = {
  grocery: ShoppingBag,
  food: Utensils,
  medicine: Pill,
  courier: Package,
  stationery: FileText,
  laundry: Shirt,
  other: Sparkles,
};

export default function DiscoveryFeedScreen() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [errands, setErrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [radiusKm, setRadiusKm] = useState(2);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // User's location coordinates
  const [userCoords, setUserCoords] = useState(null);
  const [locationName, setLocationName] = useState('Detecting campus...');

  const fetchErrands = async (lat, lng, radius, category, search) => {
    try {
      const params = {
        lat: lat || userCoords?.lat || 28.6139,
        lng: lng || userCoords?.lng || 77.209,
        radius: radius || radiusKm,
      };

      if (category && category !== 'all') {
        params.category = category;
      }
      if (search && search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get('/errands/nearby', { params });
      setErrands(response.data.errands || []);
    } catch (err) {
      if (err.response?.status !== 401) {
        console.warn('[Fetch errands error]', err);
        setError(err.response?.data?.message || 'Failed to fetch nearby errands.');
      }
    }
  };

  const initializeFeed = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      setError(null);
      let lat = 28.6139;
      let lng = 77.209;

      if (Platform.OS !== 'web') {
        try {
          const perm = await Promise.race([
            Location.requestForegroundPermissionsAsync(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000)),
          ]);
          if (perm?.status === 'granted') {
            const loc = await Promise.race([
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2500)),
            ]);
            if (loc?.coords) {
              lat = loc.coords.latitude;
              lng = loc.coords.longitude;
            }
          }
        } catch (locErr) {
          // Fallback to default campus coords
        }
      }

      setUserCoords({ lat, lng });
      setLocationName('Campus Area');
      await fetchErrands(lat, lng, radiusKm, selectedCategory, searchQuery);
    } catch (err) {
      console.warn('[Feed initialize error]', err);
      setError('Could not load nearby errands. Please pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated, radiusKm, selectedCategory, searchQuery]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      initializeFeed();
    }
  }, [initializeFeed, isAuthenticated, authLoading]);

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeFeed();
  };

  const renderErrandCard = ({ item }) => {
    const CategoryIcon = CATEGORY_ICONS[item.category] || CATEGORY_ICONS.other;

    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={() => router.push(`/errand/${item._id}`)}
        style={styles.cardOuter}
      >
        <LiquidGlassCard variant="default" style={styles.cardContainer}>
          {/* Card Top Header */}
          <View style={styles.cardTopRow}>
            <View style={styles.categoryBadge}>
              <CategoryIcon size={12} color={Colors.powderBlue} />
              <Text style={styles.categoryBadgeText}>
                {item.category?.toUpperCase() || 'GENERAL'}
              </Text>
            </View>

            {/* Price Chip in Dry Sage / Liquid Glow */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Offer</Text>
              <Text style={styles.priceAmount}>₹{item.budget || 0}</Text>
            </View>
          </View>

          {/* Errand Title */}
          <Text style={styles.errandTitle} numberOfLines={2}>
            {item.title}
          </Text>

          {item.description ? (
            <Text style={styles.errandDescription} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {/* Location Details */}
          <View style={styles.locationContainer}>
            <MapPin size={13} color={Colors.powderBlue} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.address || 'Campus Hostels'}
            </Text>
          </View>

          {/* Card Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.requesterProfile}>
              <View style={styles.requesterAvatar}>
                <Text style={styles.requesterInitial}>
                  {item.requesterId?.name ? item.requesterId.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.requesterName} numberOfLines={1}>
                    {item.requesterId?.name || 'Student'}
                  </Text>
                  {item.requesterId?.isVerified ? (
                    <CheckCircle2 size={13} color={Colors.drySage} />
                  ) : null}
                </View>
                <View style={styles.karmaRow}>
                  <Star size={11} color={Colors.drySage} fill={Colors.drySage} />
                  <Text style={styles.karmaText}>{item.requesterId?.karmaScore ?? 100} Karma</Text>
                </View>
              </View>
            </View>

            {/* Glowing Help Button */}
            <View style={styles.helpButtonWrapper}>
              <LinearGradient
                colors={Colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.helpButton}
              >
                <Text style={styles.helpButtonText}>Help Peer</Text>
                <ArrowRight size={13} color="#FFFFFF" strokeWidth={2.8} />
              </LinearGradient>
            </View>
          </View>
        </LiquidGlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <LiquidCanvas style={styles.container}>
      {/* Liquid Glass Header Hero */}
      <View style={styles.heroGlassWrapper}>
        <BlurView intensity={Platform.OS === 'ios' ? 45 : 60} tint="light" style={styles.heroBlur}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.96)', 'rgba(241, 245, 249, 0.90)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            {/* Top Specular Line */}
            <View style={styles.heroSpecular} />

            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greetingText}>
                  Hey, {user?.name ? user.name.split(' ')[0] : 'Campus Runner'} 👋
                </Text>
                <View style={styles.beaconRow}>
                  <View style={styles.beaconDot} />
                  <Text style={styles.beaconText}>Active Campus Network</Text>
                </View>
              </View>

              {/* Campus Location Glass Chip */}
              <View style={styles.locationChip}>
                <Navigation size={11} color={Colors.powderBlue} />
                <Text style={styles.locationChipText} numberOfLines={1}>
                  {locationName}
                </Text>
              </View>
            </View>

            {/* Liquid Search Bar */}
            <View style={styles.searchBar}>
              <Search size={16} color={Colors.powderBlue} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search Maggi, medicine, prints, tea..."
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color={Colors.porcelain} />
                </TouchableOpacity>
              ) : null}
            </View>
          </LinearGradient>
        </BlurView>
      </View>

      {/* Filter Bar (Liquid Capsule Pills) */}
      <View style={styles.filterSection}>
        {/* Radius Row */}
        <View style={styles.radiusRow}>
          <SlidersHorizontal size={13} color={Colors.powderBlue} />
          <Text style={styles.radiusLabel}>Radius:</Text>
          {RADIUS_OPTIONS.map((r) => {
            const active = radiusKm === r;
            return (
              <TouchableOpacity
                key={r}
                style={[styles.radiusPill, active && styles.radiusPillActive]}
                onPress={() => setRadiusKm(r)}
                activeOpacity={0.8}
              >
                <Text style={[styles.radiusPillText, active && styles.radiusPillTextActive]}>
                  {r} km
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Categories Horizontal Scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroller}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Icon
                  size={14}
                  color={isSelected ? '#FFFFFF' : Colors.powderBlue}
                  strokeWidth={2.4}
                />
                <Text
                  style={[
                    styles.categoryCardLabel,
                    isSelected && styles.categoryCardLabelActive,
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Errand Feed List */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.powderBlue} />
          <Text style={styles.loadingText}>Scanning campus errands nearby...</Text>
        </View>
      ) : (
        <FlatList
          data={errands}
          keyExtractor={(item) => item._id}
          renderItem={renderErrandCard}
          contentContainerStyle={styles.feedList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.powderBlue]}
              tintColor={Colors.powderBlue}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Compass size={38} color={Colors.powderBlue} />
              </View>
              <Text style={styles.emptyTitle}>No Errands Around You</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to post an errand or expand your distance radius!
              </Text>
              <TouchableOpacity
                style={styles.emptyBtnWrapper}
                onPress={() => router.push('/errand/post')}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={Colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.emptyBtn}
                >
                  <Plus size={16} color="#FFFFFF" strokeWidth={2.8} />
                  <Text style={styles.emptyBtnText}>Post Errand Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button (Specular Liquid Sphere) */}
      <TouchableOpacity
        style={styles.fabWrapper}
        activeOpacity={0.85}
        onPress={() => router.push('/errand/post')}
      >
        <LinearGradient
          colors={Colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fab}
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={2.8} />
        </LinearGradient>
      </TouchableOpacity>
    </LiquidCanvas>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.inkBlack,
  },
  heroGlassWrapper: {
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderBottomWidth: 1.2,
    borderBottomColor: 'rgba(226, 232, 240, 0.90)',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(30px) saturate(190%)',
      WebkitBackdropFilter: 'blur(30px) saturate(190%)',
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05), inset 0 1px 1px #FFFFFF',
    } : {}),
    ...Shadows.subtle,
  },
  heroBlur: {
    width: '100%',
  },
  heroGradient: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md + 4,
  },
  heroSpecular: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: '#FFFFFF',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm + 2,
  },
  greetingText: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.porcelain,
    letterSpacing: -0.3,
  },
  beaconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  beaconDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: Colors.drySage,
  },
  beaconText: {
    fontSize: Typography.xs - 2,
    color: Colors.powderBlue,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    maxWidth: 145,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
    } : {}),
  },
  locationChipText: {
    fontSize: Typography.xs - 2,
    fontWeight: '700',
    color: Colors.porcelain,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.xs,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 3px 12px rgba(15, 23, 42, 0.04), inset 0 1px 1px #FFFFFF',
    } : {}),
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.porcelain,
  },
  filterSection: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.70)',
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs + 2,
    marginBottom: Spacing.xs + 2,
  },
  radiusLabel: {
    fontSize: Typography.xs - 1,
    fontWeight: '800',
    color: Colors.powderBlue,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  radiusPill: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 2px 6px rgba(15, 23, 42, 0.03)',
    } : {}),
  },
  radiusPillActive: {
    backgroundColor: Colors.powderBlue,
    borderColor: Colors.powderBlue,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 3px 10px rgba(37, 99, 235, 0.35)',
    } : {}),
  },
  radiusPillText: {
    fontSize: Typography.xs - 2,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  radiusPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  categoryScroller: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    paddingTop: 2,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm + 6,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)',
    } : {}),
  },
  categoryCardActive: {
    backgroundColor: Colors.powderBlue,
    borderColor: Colors.powderBlue,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
    } : {}),
  },
  categoryCardLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.porcelain,
  },
  categoryCardLabelActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  feedList: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 68,
    gap: Spacing.md,
  },
  cardOuter: {
    marginBottom: Spacing.xs,
  },
  cardContainer: {
    borderRadius: BorderRadius.xl,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.20)',
  },
  categoryBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: '800',
    color: Colors.powderBlue,
    letterSpacing: 0.4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    paddingHorizontal: Spacing.sm + 6,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.25)',
  },
  priceLabel: {
    fontSize: Typography.xs - 3,
    fontWeight: '800',
    color: Colors.drySage,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceAmount: {
    fontSize: Typography.sm + 1,
    fontWeight: '800',
    color: Colors.drySage,
  },
  errandTitle: {
    fontSize: Typography.base,
    fontWeight: '700',
    color: Colors.porcelain,
    marginTop: 4,
    letterSpacing: -0.2,
  },
  errandDescription: {
    fontSize: Typography.xs,
    color: '#475569',
    marginTop: 4,
    lineHeight: 17,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.85)',
  },
  locationText: {
    fontSize: Typography.xs - 1,
    color: '#64748B',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm + 2,
  },
  requesterProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
  },
  requesterAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.20)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requesterInitial: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: Colors.powderBlue,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  requesterName: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.porcelain,
  },
  karmaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  karmaText: {
    fontSize: Typography.xs - 2,
    color: Colors.drySage,
    fontWeight: '700',
  },
  helpButtonWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  helpButtonText: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 102 : 88,
    right: Spacing.lg,
    borderRadius: 30,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    color: Colors.powderBlue,
    fontSize: Typography.sm,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.90)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  emptySubtitle: {
    fontSize: Typography.xs,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  emptyBtnWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: BorderRadius.full,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.sm,
    fontWeight: '800',
  },
});
