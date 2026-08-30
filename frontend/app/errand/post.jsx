import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../services/api';
import { Colors, Spacing, Typography, BorderRadius } from '../../constants/theme';

const CATEGORIES = [
  { id: 'grocery', label: 'Grocery', icon: 'cart-outline' },
  { id: 'food', label: 'Food / Mess', icon: 'fast-food-outline' },
  { id: 'medicine', label: 'Pharmacy', icon: 'medkit-outline' },
  { id: 'courier', label: 'Courier', icon: 'cube-outline' },
  { id: 'stationery', label: 'Stationery', icon: 'document-text-outline' },
  { id: 'laundry', label: 'Laundry', icon: 'shirt-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

export default function PostErrandScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('grocery');
  const [budget, setBudget] = useState('');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Auto-fetch location on component mount per Unit 4 conventions
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    setLoadingLocation(true);
    setErrorMessage(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Needed',
          'Location permission allows nearby hostel peers to discover your errand and fulfill it accurately. Please grant permission or enter your address manually.'
        );
        // Fallback default coordinates if GPS permission is denied
        setLatitude(28.6139);
        setLongitude(77.209);
        setAddress('Campus / Hostel Area (Manual)');
        setLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;
      setLatitude(lat);
      setLongitude(lng);

      // Reverse geocode to get human-readable campus/city address
      const geocodeResults = await Location.reverseGeocodeAsync({
        latitude: lat,
        longitude: lng,
      });

      if (geocodeResults && geocodeResults.length > 0) {
        const item = geocodeResults[0];
        const formattedAddress = [
          item.name,
          item.street,
          item.district || item.subregion,
          item.city,
          item.postalCode,
        ]
          .filter(Boolean)
          .join(', ');

        setAddress(formattedAddress || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
      } else {
        setAddress(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
      }
    } catch (error) {
      console.warn('[Location fetch error]', error);
      Alert.alert('Location Notice', 'Could not detect exact GPS. You can enter the location manually.');
      if (!latitude) {
        setLatitude(28.6139);
        setLongitude(77.209);
        setAddress('Campus Hostels');
      }
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter an errand title (e.g. "Pick up 1L Milk & Eggs").');
      return;
    }

    if (latitude === null || longitude === null) {
      setErrorMessage('GPS coordinates are required to geofence your errand.');
      return;
    }

    const numericBudget = parseFloat(budget) || 0;
    if (numericBudget < 0) {
      setErrorMessage('Estimated budget cannot be negative.');
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        budget: numericBudget,
        latitude,
        longitude,
        address: address.trim() || 'Campus Hostels',
      };

      await api.post('/errands', payload);
      Alert.alert('Errand Posted!', 'Nearby peers will now be able to discover and accept your errand.', [
        {
          text: 'View My Errands',
          onPress: () => {
            router.replace('/(tabs)/my-errands');
          },
        },
      ]);
    } catch (error) {
      const msg =
        error.response?.data?.message || error.message || 'Failed to post errand. Please try again.';
      setErrorMessage(msg);
      Alert.alert('Error', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Post an Errand 📦</Text>
          <Text style={styles.headerSubtitle}>
            Heading out or need something picked up? Broadcast to your campus community.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={20} color={Colors.danger} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          {/* Title */}
          <Text style={styles.label}>Errand Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 1L Milk from Mother Dairy"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={(val) => {
              setTitle(val);
              if (errorMessage) setErrorMessage(null);
            }}
          />

          {/* Category Selector Chips */}
          <Text style={styles.label}>Category *</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsContainer}
          >
            {CATEGORIES.map((cat) => {
              const selected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={16}
                    color={selected ? Colors.white : Colors.textSecondary}
                  />
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Description */}
          <Text style={styles.label}>Description & Specific Instructions</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Blue packet only, please ask for bill. Deliver to Room 302."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />

          {/* Budget */}
          <Text style={styles.label}>Estimated Item Budget / Reimbursement (₹)</Text>
          <View style={styles.budgetInputRow}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={[styles.input, styles.budgetInput]}
              placeholder="e.g. 65"
              placeholderTextColor={Colors.textMuted}
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
          </View>

          {/* Location & Reverse Geocoding Box */}
          <View style={styles.locationSection}>
            <View style={styles.locationSectionHeader}>
              <View style={styles.locationTitleRow}>
                <Ionicons name="location" size={18} color={Colors.primary} />
                <Text style={styles.locationSectionTitle}>Pickup / Drop Location</Text>
              </View>
              <TouchableOpacity
                style={styles.refreshLocBtn}
                onPress={fetchCurrentLocation}
                disabled={loadingLocation}
              >
                {loadingLocation ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Ionicons name="refresh" size={14} color={Colors.primary} />
                    <Text style={styles.refreshLocBtnText}>GPS</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Hostel address / Room location"
              placeholderTextColor={Colors.textMuted}
              value={address}
              onChangeText={setAddress}
            />

            {latitude && longitude ? (
              <View style={styles.coordsBadge}>
                <Ionicons name="navigate-outline" size={14} color={Colors.secondaryDark} />
                <Text style={styles.coordsText}>
                  Coordinates: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Ionicons name="paper-plane" size={18} color={Colors.white} />
                <Text style={styles.submitButtonText}>Post Errand</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.danger,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorBannerText: {
    flex: 1,
    color: Colors.danger,
    fontSize: Typography.sm,
    fontWeight: '500',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.base,
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  textArea: {
    height: 80,
    paddingTop: Spacing.sm,
    textAlignVertical: 'top',
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  budgetInput: {
    flex: 1,
  },
  locationSection: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  locationSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  locationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationSectionTitle: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.text,
  },
  refreshLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight,
  },
  refreshLocBtnText: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  coordsText: {
    fontSize: Typography.xs,
    color: Colors.secondaryDark,
    fontWeight: '500',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: 'bold',
  },
});
