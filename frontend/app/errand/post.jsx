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
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ShoppingBag,
  Utensils,
  Pill,
  Package,
  FileText,
  Sparkles,
  Send,
  LocateFixed,
  AlertCircle,
  Shirt,
} from 'lucide-react-native';
import { router } from 'expo-router';
import api from '../../services/api';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { LiquidGlassCard, LiquidCanvas } from '../../components/ui/LiquidGlass';

const CATEGORIES = [
  { id: 'grocery', label: 'Grocery', icon: ShoppingBag },
  { id: 'food', label: 'Food & Mess', icon: Utensils },
  { id: 'medicine', label: 'Pharmacy', icon: Pill },
  { id: 'courier', label: 'Courier', icon: Package },
  { id: 'stationery', label: 'Stationery', icon: FileText },
  { id: 'laundry', label: 'Laundry', icon: Shirt },
  { id: 'other', label: 'Other', icon: Sparkles },
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
        latitude: lat,
        longitude: lng,
        address: address.trim() || 'Campus Hostels',
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      });

      Alert.alert(
        'Errand Broadcasted! 🚀',
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
    <LiquidCanvas style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flexFill}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Liquid Glass Header Hero */}
          <View style={styles.headerHeroWrapper}>
            <BlurView intensity={Platform.OS === 'ios' ? 45 : 60} tint="dark" style={styles.headerBlur}>
              <LinearGradient
                colors={['rgba(52, 73, 102, 0.65)', 'rgba(13, 24, 33, 0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.9, y: 1 }}
                style={styles.headerHero}
              >
                <View style={styles.headerSpecular} />
                <Text style={styles.headerTitle}>Need something done? 🏃</Text>
                <Text style={styles.headerSubtitle}>
                  Broadcast your request to active peers across campus
                </Text>
              </LinearGradient>
            </BlurView>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#F87171" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* 1. Category Selection */}
          <LiquidGlassCard variant="default">
            <Text style={styles.sectionTitle}>1. Choose Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                const Icon = cat.icon;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryTile, isSelected && styles.categoryTileActive]}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      size={22}
                      color={isSelected ? Colors.inkBlack : Colors.powderBlue}
                      strokeWidth={2.4}
                    />
                    <Text style={[styles.categoryTileText, isSelected && styles.categoryTileTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </LiquidGlassCard>

          {/* 2. Task Details */}
          <LiquidGlassCard variant="default">
            <Text style={styles.sectionTitle}>2. Errand Details</Text>

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
              placeholder="e.g. Pick up from Night Canteen and deliver to H4 Room 302."
              placeholderTextColor={Colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </LiquidGlassCard>

          {/* 3. Budget & Compensation */}
          <LiquidGlassCard variant="sage">
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
              {BUDGET_PRESETS.map((amt) => {
                const active = budget === amt.toString();
                return (
                  <TouchableOpacity
                    key={amt}
                    style={[styles.presetChip, active && styles.presetChipActive]}
                    onPress={() => setBudget(amt.toString())}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>
                      ₹{amt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </LiquidGlassCard>

          {/* 4. Delivery Destination */}
          <LiquidGlassCard variant="default">
            <View style={styles.locationHeaderRow}>
              <Text style={styles.sectionTitle}>4. Delivery Address</Text>
              <TouchableOpacity
                style={styles.refreshLocBtn}
                onPress={fetchCurrentLocation}
                disabled={loadingLocation}
                activeOpacity={0.8}
              >
                {loadingLocation ? (
                  <ActivityIndicator size="small" color={Colors.powderBlue} />
                ) : (
                  <>
                    <LocateFixed size={14} color={Colors.powderBlue} />
                    <Text style={styles.refreshLocText}>GPS Auto-Fill</Text>
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
          </LiquidGlassCard>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
            style={styles.submitBtnWrapper}
          >
            <LinearGradient
              colors={Colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.submitButton, submitting && styles.btnDisabled]}
            >
              {submitting ? (
                <ActivityIndicator color={Colors.inkBlack} />
              ) : (
                <>
                  <Send size={18} color={Colors.inkBlack} strokeWidth={2.6} />
                  <Text style={styles.submitButtonText}>Broadcast Errand</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </LiquidCanvas>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flexFill: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl + 40,
    gap: Spacing.md,
  },
  headerHeroWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: Colors.glassBorder,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(30px) saturate(190%)',
      WebkitBackdropFilter: 'blur(30px) saturate(190%)',
      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(240, 244, 239, 0.3)',
    } : {}),
    ...Shadows.glow,
  },
  headerBlur: {
    width: '100%',
  },
  headerHero: {
    padding: Spacing.lg,
  },
  headerSpecular: {
    position: 'absolute',
    top: 0,
    left: 30,
    right: 30,
    height: 1,
    backgroundColor: 'rgba(240, 244, 239, 0.25)',
  },
  headerTitle: {
    fontSize: Typography.lg,
    fontWeight: '800',
    color: Colors.porcelain,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    marginTop: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm + 2,
  },
  errorText: {
    color: '#F87171',
    fontSize: Typography.xs,
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.sm,
    fontWeight: '800',
    color: Colors.porcelain,
    marginBottom: Spacing.sm,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  categoryTile: {
    width: '31%',
    backgroundColor: 'rgba(13, 24, 33, 0.65)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    gap: 4,
  },
  categoryTileActive: {
    backgroundColor: Colors.powderBlue,
    borderColor: Colors.powderBlue,
  },
  categoryTileText: {
    fontSize: Typography.xs - 2,
    fontWeight: '700',
    color: Colors.porcelain,
    textAlign: 'center',
  },
  categoryTileTextActive: {
    color: Colors.inkBlack,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.powderBlue,
    marginTop: Spacing.xs,
    marginBottom: 4,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.sm,
    color: Colors.porcelain,
    backgroundColor: 'rgba(13, 24, 33, 0.65)',
    marginBottom: Spacing.xs,
  },
  textArea: {
    height: 76,
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
    fontWeight: '800',
    color: Colors.drySage,
    marginRight: Spacing.sm,
  },
  budgetInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.glassSageBorder,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.drySage,
    backgroundColor: 'rgba(13, 24, 33, 0.65)',
  },
  presetChipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  presetChip: {
    flex: 1,
    backgroundColor: 'rgba(52, 73, 102, 0.35)',
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  presetChipActive: {
    backgroundColor: Colors.drySage,
    borderColor: Colors.drySage,
  },
  presetChipText: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.porcelain,
  },
  presetChipTextActive: {
    color: Colors.inkBlack,
    fontWeight: '800',
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
    backgroundColor: 'rgba(52, 73, 102, 0.45)',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  refreshLocText: {
    fontSize: Typography.xs - 2,
    fontWeight: '700',
    color: Colors.powderBlue,
  },
  submitBtnWrapper: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.glow,
    marginTop: Spacing.xs,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    height: 52,
  },
  submitButtonText: {
    color: Colors.inkBlack,
    fontSize: Typography.base,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
