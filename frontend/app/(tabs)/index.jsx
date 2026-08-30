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
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
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
} from 'lucide-react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

const RADIUS_OPTIONS = [1, 2, 5];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles, color: '#6366F1', bg: '#EEF2FF' },
  { id: 'food', label: 'Food & Mess', icon: Utensils, color: '#F59E0B', bg: '#FEF3C7' },
  { id: 'grocery', label: 'Grocery', icon: ShoppingBag, color: '#0284C7', bg: '#E0F2FE' },
  { id: 'medicine', label: 'Pharmacy', icon: Pill, color: '#EF4444', bg: '#FEE2E2' },
  { id: 'courier', label: 'Courier', icon: Package, color: '#8B5CF6', bg: '#F3E8FF' },
  { id: 'stationery', label: 'Stationery', icon: FileText, color: '#10B981', bg: '#ECFDF5' },
  { id: 'laundry', label: 'Laundry', icon: Shirt, color: '#3B82F6', bg: '#EFF6FF' },
];

const CATEGORY_STYLES = {
  grocery: { bg: '#E0F2FE', text: '#0284C7', icon: ShoppingBag },
  food: { bg: '#FEF3C7', text: '#D97706', icon: Utensils },
  medicine: { bg: '#FEE2E2', text: '#DC2626', icon: Pill },
  courier: { bg: '#F3E8FF', text: '#7C3AED', icon: Package },
  stationery: { bg: '#ECFDF5', text: '#059669', icon: FileText },
  laundry: { bg: '#EFF6FF', text: '#2563EB', icon: Shirt },
  other: { bg: '#F1F5F9', text: '#475569', icon: Sparkles },
};

export default function DiscoveryFeedScreen() {
  const { user } = useAuth();
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

  const initializeFeed = useCallback(async () => {
    try {
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();

      let lat = 28.6139;
      let lng = 77.209;

      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
        setUserCoords({ lat, lng });

        const rev = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (rev && rev.length > 0) {
          const item = rev[0];
          setLocationName(item.name || item.district || item.city || 'Campus Area');
        } else {
          setLocationName('Campus Area');
        }
      } else {
        setUserCoords({ lat, lng });
        setLocationName('Campus Area (Default)');
      }

      await fetchErrands(lat, lng, radiusKm, selectedCategory, searchQuery);
    } catch (err) {
      console.warn('[Feed initialize error]', err);
      setError('Could not load nearby errands. Please pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [radiusKm, selectedCategory, searchQuery]);

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
      console.warn('[Fetch errands error]', err);
      setError(err.response?.data?.message || 'Failed to fetch nearby errands.');
    }
  };

  useEffect(() => {
    initializeFeed();
  }, [initializeFeed]);

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeFeed();
  };

  const renderErrandCard = ({ item }) => {
    const catStyle = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.other;
    const CategoryIcon = catStyle.icon;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push(`/errand/${item._id}`)}
      >
        {/* Card Top Row */}
        <View style={styles.cardTopRow}>
          <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}>
            <CategoryIcon size={13} color={catStyle.text} />
            <Text style={[styles.categoryBadgeText, { color: catStyle.text }]}>
              {item.category?.toUpperCase() || 'GENERAL'}
            </Text>
          </View>

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

        {/* Location Row */}
        <View style={styles.locationContainer}>
          <MapPin size={14} color={Colors.primary} />
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
                  <CheckCircle2 size={13} color={Colors.secondary} />
                ) : null}
              </View>
              <View style={styles.karmaRow}>
                <Star size={11} color="#D97706" fill="#D97706" />
                <Text style={styles.karmaText}>{item.requesterId?.karmaScore ?? 100} Karma</Text>
              </View>
            </View>
          </View>

          <View style={styles.acceptButtonWrapper}>
            <LinearGradient
              colors={Colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.acceptButton}
            >
              <Text style={styles.acceptButtonText}>Help Peer</Text>
              <ArrowRight size={13} color={Colors.white} strokeWidth={2.5} />
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Greeting & Beacon Header */}
      <LinearGradient
        colors={Colors.gradientHero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerHero}
      >
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

          <View style={styles.locationChip}>
            <Navigation size={12} color={Colors.white} />
            <Text style={styles.locationChipText} numberOfLines={1}>
              {locationName}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Maggi, medicine, prints, tea..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
      </LinearGradient>

      {/* Filter Bar */}
      <View style={styles.filterSection}>
        {/* Radius Row */}
        <View style={styles.radiusRow}>
          <SlidersHorizontal size={13} color={Colors.textSecondary} />
          <Text style={styles.radiusLabel}>Distance:</Text>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusPill, radiusKm === r && styles.radiusPillActive]}
              onPress={() => setRadiusKm(r)}
            >
              <Text style={[styles.radiusPillText, radiusKm === r && styles.radiusPillTextActive]}>
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
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
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <View
                  style={[
                    styles.categoryIconCircle,
                    { backgroundColor: isSelected ? Colors.white : cat.bg },
                  ]}
                >
                  <Icon size={16} color={isSelected ? Colors.primary : cat.color} />
                </View>
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

      {/* Errand List Feed */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
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
              colors={[Colors.primary]}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                <Flame size={36} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Errands Around You</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to post an errand or expand your distance radius!
              </Text>
              <TouchableOpacity
                style={styles.emptyBtnWrapper}
                onPress={() => router.push('/errand/post')}
              >
                <LinearGradient
                  colors={Colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyBtn}
                >
                  <Plus size={16} color={Colors.white} />
                  <Text style={styles.emptyBtnText}>Post Errand Request</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
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
          <Plus size={26} color={Colors.white} strokeWidth={2.5} />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerHero: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    ...Shadows.glow,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  greetingText: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.white,
  },
  beaconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  beaconDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#4ADE80',
  },
  beaconText: {
    fontSize: Typography.xs - 2,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500',
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    maxWidth: 140,
  },
  locationChipText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
    color: Colors.white,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.xs,
    ...Shadows.subtle,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.text,
  },
  filterSection: {
    backgroundColor: Colors.card,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.subtle,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  radiusLabel: {
    fontSize: Typography.xs - 1,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  radiusPill: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radiusPillText: {
    fontSize: Typography.xs - 2,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  radiusPillTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  categoryScroller: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryCardActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCardLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryCardLabelActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  feedList: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 40,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.card,
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
  },
  categoryBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  priceLabel: {
    fontSize: Typography.xs - 3,
    fontWeight: 'bold',
    color: Colors.secondaryDark,
    textTransform: 'uppercase',
  },
  priceAmount: {
    fontSize: Typography.sm + 1,
    fontWeight: 'bold',
    color: Colors.secondaryDark,
  },
  errandTitle: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 4,
  },
  errandDescription: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  locationText: {
    fontSize: Typography.xs - 1,
    color: Colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  requesterProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  requesterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requesterInitial: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  requesterName: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.text,
  },
  karmaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  karmaText: {
    fontSize: Typography.xs - 2,
    color: '#B45309',
    fontWeight: '600',
  },
  acceptButtonWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  acceptButtonText: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.white,
  },
  fabWrapper: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    borderRadius: 28,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  emptyBtnWrapper: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  emptyBtnText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
});
