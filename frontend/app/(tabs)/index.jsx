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
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

const RADIUS_OPTIONS = [1, 2, 5];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: 'apps-outline' },
  { id: 'grocery', label: 'Grocery', icon: 'cart-outline' },
  { id: 'food', label: 'Food', icon: 'fast-food-outline' },
  { id: 'medicine', label: 'Pharmacy', icon: 'medkit-outline' },
  { id: 'courier', label: 'Courier', icon: 'cube-outline' },
  { id: 'stationery', label: 'Stationery', icon: 'document-text-outline' },
  { id: 'laundry', label: 'Laundry', icon: 'shirt-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

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
  const [locationName, setLocationName] = useState('Detecting location...');

  // Fetch Location and nearby Errands
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
      const msg = err.response?.data?.message || err.message || 'Failed to fetch nearby errands';
      setError(msg);
    }
  };

  useEffect(() => {
    initializeFeed();
  }, [radiusKm, selectedCategory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await initializeFeed();
  };

  const handleSearchSubmit = () => {
    if (userCoords) {
      setLoading(true);
      fetchErrands(userCoords.lat, userCoords.lng, radiusKm, selectedCategory, searchQuery).finally(() =>
        setLoading(false)
      );
    }
  };

  const getCategoryIcon = (cat) => {
    const found = CATEGORIES.find((c) => c.id === cat);
    return found ? found.icon : 'ellipsis-horizontal-circle-outline';
  };

  const renderErrandCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => router.push(`/errand/${item._id}`)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.categoryBadge}>
          <Ionicons name={getCategoryIcon(item.category)} size={14} color={Colors.primary} />
          <Text style={styles.categoryBadgeText}>
            {item.category?.toUpperCase() || 'OTHER'}
          </Text>
        </View>

        <View style={styles.budgetBadge}>
          <Text style={styles.budgetText}>₹{item.budget || 0}</Text>
        </View>
      </View>

      <Text style={styles.cardTitle}>{item.title}</Text>
      {item.description ? (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.locationRow}>
        <Ionicons name="location-outline" size={14} color={Colors.textSecondary} />
        <Text style={styles.locationText} numberOfLines={1}>
          {item.address || 'Campus Hostels'}
        </Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.requesterInfo}>
          <View style={styles.requesterAvatar}>
            <Text style={styles.requesterAvatarText}>
              {item.requesterId?.name ? item.requesterId.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.requesterName}>{item.requesterId?.name || 'Peer'}</Text>
              {item.requesterId?.isVerified ? (
                <Ionicons name="checkmark-circle" size={13} color={Colors.secondaryDark} />
              ) : null}
            </View>
            <Text style={styles.karmaText}>⭐ {item.requesterId?.karmaScore ?? 100} Karma</Text>
          </View>
        </View>

        <View style={styles.actionPrompt}>
          <Text style={styles.actionPromptText}>View & Accept</Text>
          <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with Search and Current Location Bar */}
      <View style={styles.topBar}>
        <View style={styles.locationHeaderRow}>
          <View style={styles.locationLabelRow}>
            <Ionicons name="navigate-circle" size={18} color={Colors.primary} />
            <Text style={styles.currentLocationText} numberOfLines={1}>
              {locationName}
            </Text>
          </View>

          {/* Radius Selector */}
          <View style={styles.radiusSelector}>
            {RADIUS_OPTIONS.map((rad) => (
              <TouchableOpacity
                key={rad}
                style={[styles.radiusBtn, radiusKm === rad && styles.radiusBtnActive]}
                onPress={() => setRadiusKm(rad)}
              >
                <Text
                  style={[
                    styles.radiusBtnText,
                    radiusKm === rad && styles.radiusBtnTextActive,
                  ]}
                >
                  {rad} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search nearby errands (e.g. milk, medicine)..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                if (userCoords) {
                  fetchErrands(userCoords.lat, userCoords.lng, radiusKm, selectedCategory, '');
                }
              }}
            >
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Horizontal Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, active && styles.catChipActive]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={active ? Colors.white : Colors.textSecondary}
                />
                <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Errand List */}
      {loading && !refreshing ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding errands near you...</Text>
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
              <Ionicons name="bicycle-outline" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Errands Nearby</Text>
              <Text style={styles.emptySubtitle}>
                {error ||
                  `No open errands found within ${radiusKm} km. You can post an errand or expand your discovery radius!`}
              </Text>
              <TouchableOpacity
                style={styles.postNowBtn}
                onPress={() => router.push('/errand/post')}
              >
                <Ionicons name="add-circle-outline" size={18} color={Colors.white} />
                <Text style={styles.postNowBtnText}>Post a New Errand</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Floating Action Button for Posting Errand */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/errand/post')}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    marginRight: Spacing.sm,
  },
  currentLocationText: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  radiusSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  radiusBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  radiusBtnActive: {
    backgroundColor: Colors.primary,
  },
  radiusBtnText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  radiusBtnTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.text,
    marginLeft: Spacing.xs,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  categoryBadgeText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  budgetBadge: {
    backgroundColor: '#DCFCE7',
    borderColor: Colors.secondary,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  budgetText: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.secondaryDark,
  },
  cardTitle: {
    fontSize: Typography.base,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 4,
  },
  cardDescription: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  locationText: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  requesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  requesterAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requesterAvatarText: {
    fontSize: Typography.sm,
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
  karmaText: {
    fontSize: Typography.xs - 2,
    color: '#B45309',
    fontWeight: '600',
  },
  actionPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionPromptText: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  emptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  postNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  postNowBtnText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
