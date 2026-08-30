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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

const RADIUS_OPTIONS = [1, 2, 5];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps' },
  { id: 'grocery', label: 'Grocery', icon: 'cart' },
  { id: 'food', label: 'Food & Snacks', icon: 'fast-food' },
  { id: 'medicine', label: 'Pharmacy', icon: 'medkit' },
  { id: 'courier', label: 'Courier', icon: 'cube' },
  { id: 'stationery', label: 'Stationery', icon: 'document-text' },
  { id: 'laundry', label: 'Laundry', icon: 'shirt' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const CATEGORY_COLORS = {
  grocery: { bg: '#E0F2FE', text: '#0284C7' },
  food: { bg: '#FEF3C7', text: '#D97706' },
  medicine: { bg: '#FEE2E2', text: '#DC2626' },
  courier: { bg: '#F3E8FF', text: '#7C3AED' },
  stationery: { bg: '#ECFDF5', text: '#059669' },
  laundry: { bg: '#EFF6FF', text: '#2563EB' },
  other: { bg: '#F1F5F9', text: '#475569' },
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
    const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => router.push(`/errand/${item._id}`)}
      >
        {/* Card Header Row */}
        <View style={styles.cardHeader}>
          <View style={[styles.categoryPill, { backgroundColor: catStyle.bg }]}>
            <Ionicons
              name={
                item.category === 'grocery'
                  ? 'cart'
                  : item.category === 'food'
                  ? 'fast-food'
                  : item.category === 'medicine'
                  ? 'medkit'
                  : item.category === 'courier'
                  ? 'cube'
                  : item.category === 'stationery'
                  ? 'document-text'
                  : 'bicycle'
              }
              size={12}
              color={catStyle.text}
            />
            <Text style={[styles.categoryPillText, { color: catStyle.text }]}>
              {item.category?.toUpperCase() || 'GENERAL'}
            </Text>
          </View>

          <View style={styles.budgetBadge}>
            <Text style={styles.budgetText}>₹{item.budget || 0}</Text>
          </View>
        </View>

        {/* Title & Description */}
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
          <Ionicons name="location" size={14} color={Colors.primary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.address || 'Campus Hostels'}
          </Text>
        </View>

        {/* Requester & Action Row */}
        <View style={styles.cardFooter}>
          <View style={styles.requesterInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.requesterId?.name ? item.requesterId.name.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
            <View>
              <View style={styles.requesterNameRow}>
                <Text style={styles.requesterName} numberOfLines={1}>
                  {item.requesterId?.name || 'Student'}
                </Text>
                {item.requesterId?.isVerified ? (
                  <Ionicons name="checkmark-circle" size={14} color={Colors.secondaryDark} />
                ) : null}
              </View>
              <Text style={styles.karmaScore}>⭐ {item.requesterId?.karmaScore ?? 100} Karma</Text>
            </View>
          </View>

          <View style={styles.helpBtnWrapper}>
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.helpBtn}
            >
              <Text style={styles.helpBtnText}>Help Peer 🏃</Text>
            </LinearGradient>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Campus Radar & Search Header */}
      <View style={styles.headerSection}>
        <View style={styles.locationPillRow}>
          <View style={styles.liveRadarDot} />
          <Ionicons name="navigate-circle" size={16} color={Colors.primary} />
          <Text style={styles.locationPillText} numberOfLines={1}>
            {locationName}
          </Text>
          <Text style={styles.radiusPill}>{radiusKm} km radius</Text>
        </View>

        {/* Modern Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search groceries, medicines, snacks..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Radius Selector Chips */}
        <View style={styles.radiusRow}>
          <Text style={styles.filterTitle}>Radius:</Text>
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

        {/* Category Horizontal Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isSelected ? Colors.white : Colors.textSecondary}
                />
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

      {/* Main Feed Content */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Scanning campus errands...</Text>
        </View>
      ) : (
        <FlatList
          data={errands}
          keyExtractor={(item) => item._id}
          renderItem={renderErrandCard}
          contentContainerStyle={styles.listContent}
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
                <Ionicons name="sparkles" size={36} color={Colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>No Errands Found Nearby</Text>
              <Text style={styles.emptySubtitle}>
                Be the first to post a campus request or expand your search radius!
              </Text>
              <TouchableOpacity
                style={styles.emptyActionWrapper}
                onPress={() => router.push('/errand/post')}
              >
                <LinearGradient
                  colors={['#4F46E5', '#6366F1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.emptyActionButton}
                >
                  <Ionicons name="add-circle" size={18} color={Colors.white} />
                  <Text style={styles.emptyActionText}>Post an Errand</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button (FAB) */}
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
          <Ionicons name="add" size={28} color={Colors.white} />
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
  headerSection: {
    backgroundColor: Colors.card,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    ...Shadows.subtle,
  },
  locationPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 6,
    marginBottom: Spacing.xs,
  },
  liveRadarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  locationPillText: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  radiusPill: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
    color: Colors.primary,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  searchBar: {
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
    marginVertical: 4,
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
    marginTop: 4,
    marginBottom: 4,
  },
  filterTitle: {
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
    paddingTop: 4,
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
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 30,
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  categoryPillText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
  },
  budgetBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  budgetText: {
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
  requesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  requesterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  requesterName: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.text,
  },
  karmaScore: {
    fontSize: Typography.xs - 2,
    color: '#B45309',
    fontWeight: '600',
  },
  helpBtnWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.subtle,
  },
  helpBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
  },
  helpBtnText: {
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
  emptyActionWrapper: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
  },
  emptyActionText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
});
