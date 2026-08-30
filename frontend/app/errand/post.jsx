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
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

const CATEGORIES = [
  { id: 'grocery', label: 'Grocery', icon: 'cart' },
  { id: 'food', label: 'Food & Mess', icon: 'fast-food' },
  { id: 'medicine', label: 'Pharmacy', icon: 'medkit' },
  { id: 'courier', label: 'Courier', icon: 'cube' },
  { id: 'stationery', label: 'Stationery', icon: 'document-text' },
  { id: 'laundry', label: 'Laundry', icon: 'shirt' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const BUDGET_PRESETS = [50, 100, 150, 200, 300];

export default function PostErrandScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('grocery');
  const [budget, setBudget] = useState('100');
  const [address, setAddress] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = async () => {
    setLoadingLocation(true);
    setErrorMessage(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setLatitude(28.6139);
        setLongitude(77.209);
        setAddress('Campus Hostels Area');
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
        ]
          .filter(Boolean)
          .join(', ');

        setAddress(formattedAddress || `Campus (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      } else {
        setAddress(`Campus (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
      }
    } catch (error) {
      console.warn('[Location fetch error]', error);
      setLatitude(28.6139);
      setLongitude(77.209);
      setAddress('Campus Hostels (Manual)');
    } finally {
      setLoadingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter an errand title.');
      return;
    }

    const numericBudget = parseFloat(budget);
    if (isNaN(numericBudget) || numericBudget < 0) {
      setErrorMessage('Please enter a valid budget amount.');
      return;
    }

    const lat = latitude || 28.6139;
    const lng = longitude || 77.209;

    setErrorMessage(null);
    setSubmitting(true);

    try {
      await api.post('/errands', {
        title: title.trim(),
        description: description.trim(),
        category,
        budget: numericBudget,
        address: address.trim() || 'Campus Hostels',
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      });

      Alert.alert(
        'Errand Posted! 🚀',
        'Nearby hostel peers can now discover and fulfill your request.',
        [
          {
            text: 'View My Errands',
            onPress: () => router.replace('/(tabs)/my-errands'),
          },
        ]
      );
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to post errand. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header Intro */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>What do you need done? 🏃</Text>
          <Text style={styles.headerSubtitle}>
            Broadcast an errand to nearby campus peers heading your way.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* 1. Category Selection */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>1. Choose Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => {
              const isSelected = category === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryTile, isSelected && styles.categoryTileActive]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Ionicons
                    name={cat.icon}
                    size={22}
                    color={isSelected ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.categoryTileText, isSelected && styles.categoryTileTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 2. Task Details */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>2. Task Details</Text>

          <Text style={styles.inputLabel}>Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 2 Packets of Maggi & 1 Amul Milk"
            placeholderTextColor={Colors.textMuted}
            value={title}
            onChangeText={(val) => {
              setTitle(val);
              if (errorMessage) setErrorMessage(null);
            }}
          />

          <Text style={styles.inputLabel}>Notes & Instructions (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g. Please pick up from Night Canteen and deliver to Hostel 4 Room 302."
            placeholderTextColor={Colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* 3. Budget & Compensation */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>3. Estimated Budget (₹)</Text>

          <View style={styles.budgetInputRow}>
            <Text style={styles.rupeeSymbol}>₹</Text>
            <TextInput
              style={styles.budgetInput}
              placeholder="100"
              placeholderTextColor={Colors.textMuted}
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
          </View>

          {/* Quick preset chips */}
          <View style={styles.presetChipsRow}>
            {BUDGET_PRESETS.map((amt) => (
              <TouchableOpacity
                key={amt}
                style={[styles.presetChip, budget === amt.toString() && styles.presetChipActive]}
                onPress={() => setBudget(amt.toString())}
              >
                <Text
                  style={[
                    styles.presetChipText,
                    budget === amt.toString() && styles.presetChipTextActive,
                  ]}
                >
                  ₹{amt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Delivery Destination */}
        <View style={styles.sectionCard}>
          <View style={styles.locationHeaderRow}>
            <Text style={styles.sectionTitle}>4. Delivery Location</Text>
            <TouchableOpacity
              style={styles.refreshLocBtn}
              onPress={fetchCurrentLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <Ionicons name="locate" size={14} color={Colors.primary} />
                  <Text style={styles.refreshLocText}>GPS Auto-Detect</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="e.g. Hostel 4, Room 302"
            placeholderTextColor={Colors.textMuted}
            value={address}
            onChangeText={setAddress}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="paper-plane" size={18} color={Colors.white} />
              <Text style={styles.submitButtonText}>Broadcast Errand to Campus</Text>
            </>
          )}
        </TouchableOpacity>
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
    gap: Spacing.md,
  },
  headerCard: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.primaryDark,
  },
  headerSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.danger,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.xs,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  categoryTile: {
    width: '31%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  categoryTileActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  categoryTileText: {
    fontSize: Typography.xs - 2,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  categoryTileTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.text,
    backgroundColor: Colors.white,
    marginBottom: Spacing.xs,
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
    paddingTop: Spacing.sm,
  },
  budgetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  rupeeSymbol: {
    fontSize: Typography.xxl,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginRight: Spacing.sm,
  },
  budgetInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.xl,
    fontWeight: 'bold',
    color: Colors.text,
    backgroundColor: Colors.white,
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  presetChip: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  presetChipText: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  presetChipTextActive: {
    color: Colors.white,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  refreshLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  refreshLocText: {
    fontSize: Typography.xs - 2,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: BorderRadius.lg,
    ...Shadows.glow,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
