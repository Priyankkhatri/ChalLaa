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
} from 'lucide-react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

const RADIUS_OPTIONS = [1, 2, 5];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'grocery', label: 'Grocery', icon: ShoppingBag },
  { id: 'food', label: 'Food & Mess', icon: Utensils },
  { id: 'medicine', label: 'Pharmacy', icon: Pill },
  { id: 'courier', label: 'Courier', icon: Package },
  { id: 'stationery', label: 'Stationery', icon: FileText },
];

const CATEGORY_STYLES = {
  grocery: { bg: '#E0F2FE', text: '#0284C7', icon: ShoppingBag },
  food: { bg: '#FEF3C7', text: '#D97706', icon: Utensils },
  medicine: { bg: '#FEE2E2', text: '#DC2626', icon: Pill },
  courier: { bg: '#F3E8FF', text: '#7C3AED', icon: Package },
  stationery: { bg: '#ECFDF5', text: '#059669', icon: FileText },
  other: { bg: '#F1F5F9', text: '#475569', icon: Sparkles },
};

export default function DiscoveryFeedScreen() {
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
  const [locationName, setLocationName] = useState('Locating campus...');

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
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.categoryBadge, { backgroundColor: catStyle.bg }]}>
            <CategoryIcon size={12} color={catStyle.text} />
            <Text style={[styles.categoryBadgeText, { color: catStyle.text }]}>
              {item.category?.toUpperCase() || 'GENERAL'}
            </Text>
          </View>

          <View style={styles.budgetPill}>
            <Text style={styles.budgetValue}>₹{item.budget || 0}</Text>
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
        <View style={styles.locationRow}>
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

          <View style={styles.helpButtonWrapper}>
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.helpButton}
            >
              <Text style={styles.helpButtonText}>Help Peer</Text>
              <ArrowRight size={13} color={Colors.white} strokeWidth={2.5} />
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Campus Radar & Search Header */}
      <View style={styles.headerBar}>
        <View style={styles.radarPill}>
          <View style={styles.livePulseDot} />
          <Navigation size={14} color={Colors.primary} />
          <Text style={styles.radarLocation} numberOfLines={1}>
            {locationName}
          </Text>
          <Text style={styles.radiusBadge}>{radiusKm} km</Text>
        </View>

        {/* Search Box */}
        <View style={styles.searchBox}>
          <Search size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groceries, medicines, courier..."
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

        {/* Radius Filter Pills */}
        <View style={styles.radiusRow}>
          <SlidersHorizontal size={13} color={Colors.textSecondary} />
          <Text style={styles.radiusLabel}>Radius:</Text>
          {RADIUS_OPTIONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.radiusChip, radiusKm === r && styles.radiusChipActive]}
              onPress={() => setRadiusKm(r)}
            >
              <Text style={[styles.radiusChipText, radiusKm === r && styles.radiusChipTextActive]}>
                {r} km
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Categories Horizontal Scroller */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Icon size={14} color={isSelected ? Colors.white : Colors.textSecondary} />
                <Text
                  style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}
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
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Scanning campus errands...</Text>
        </View>
      ) : (
        <FlatList
          data={errands}
          keyExtractor={(item) => item._id}
          renderItem={renderErrandCard}
          contentContainerStyle={styles.feedContent}
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
                <Sparkles size={36} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Errands Found Nearby</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to broadcast a request or expand your search radius!
              </Text>
              <TouchableOpacity
                style={styles.emptyBtnWrapper}
                onPress={() => router.push('/errand/post')}
              >
                <LinearGradient
                  colors={['#4F46E5', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyBtn}
                >
                  <Plus size={16} color={Colors.white} />
                  <Text style={styles.emptyBtnText}>Post New Errand</Text>
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
          colors={['#4F46E5', '#7C3AED']}
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
  headerBar: {
    backgroundColor: Colors.card,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.subtle,
  },
  radarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 6,
    marginBottom: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  radarLocation: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  radiusBadge: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 42,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.xs,
    marginBottom: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.text,
  },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
    marginBottom: 6,
  },
  radiusLabel: {
    fontSize: Typography.xs - 1,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  radiusChip: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radiusChipText: {
    fontSize: Typography.xs - 2,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  radiusChipTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  feedContent: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
  },
  budgetPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  budgetValue: {
    fontSize: Typography.sm,
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
  locationRow: {
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
  helpButtonWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  helpButtonText: {
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
  centerBox: {
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
