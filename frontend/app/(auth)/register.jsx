import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  User,
  Mail,
  Lock,
  Phone,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';
import { LiquidGlassCard } from '../../components/ui/LiquidGlass';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [hostelOrCollegeId, setHostelOrCollegeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Name, email, and password are required.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        hostelOrCollegeId: hostelOrCollegeId.trim(),
      });
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Registration failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
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
        showsVerticalScrollIndicator={false}
      >
        {/* Liquid Glass Hero Banner */}
        <View style={styles.heroOuter}>
          <BlurView intensity={Platform.OS === 'ios' ? 45 : 60} tint="dark" style={styles.heroBlur}>
            <LinearGradient
              colors={['rgba(52, 73, 102, 0.65)', 'rgba(13, 24, 33, 0.9)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.9, y: 1 }}
              style={styles.heroBanner}
            >
              <View style={styles.heroSpecular} />

              <View style={styles.logoBadge}>
                <Sparkles size={30} color={Colors.powderBlue} />
              </View>
              <Text style={styles.heroTitle}>Create Account ✨</Text>
              <Text style={styles.heroSubtitle}>Join your campus hostel peer network</Text>
            </LinearGradient>
          </BlurView>
        </View>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={18} color="#F87171" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Liquid Glass Form Card */}
        <LiquidGlassCard variant="default">
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputBox}>
            <User size={18} color={Colors.powderBlue} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Priyank Khatri"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={(val) => {
                setName(val);
                if (errorMessage) setErrorMessage(null);
              }}
            />
          </View>

          <Text style={styles.label}>Hostel / College Email *</Text>
          <View style={styles.inputBox}>
            <Mail size={18} color={Colors.powderBlue} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. priyank@campus.edu"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (errorMessage) setErrorMessage(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>Password (min 6 characters) *</Text>
          <View style={styles.inputBox}>
            <Lock size={18} color={Colors.powderBlue} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={(val) => {
                setPassword(val);
                if (errorMessage) setErrorMessage(null);
              }}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <Text style={styles.label}>Phone Number (Optional)</Text>
          <View style={styles.inputBox}>
            <Phone size={18} color={Colors.powderBlue} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. +91 9876543210"
              placeholderTextColor={Colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.label}>Hostel Block & Room ID (Optional)</Text>
          <View style={styles.inputBox}>
            <Building2 size={18} color={Colors.powderBlue} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Hostel 4, Room 302"
              placeholderTextColor={Colors.textMuted}
              value={hostelOrCollegeId}
              onChangeText={setHostelOrCollegeId}
            />
          </View>

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={Colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.button, loading && styles.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={Colors.inkBlack} />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Register Student Account</Text>
                  <CheckCircle2 size={18} color={Colors.inkBlack} strokeWidth={2.6} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LiquidGlassCard>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.linkText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.inkBlack,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingTop: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
    paddingBottom: Spacing.xxl + 20,
    gap: Spacing.md,
  },
  heroOuter: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    ...Shadows.glow,
  },
  heroBlur: {
    width: '100%',
  },
  heroBanner: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  heroSpecular: {
    position: 'absolute',
    top: 0,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: 'rgba(240, 244, 239, 0.25)',
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(52, 73, 102, 0.55)',
    borderWidth: 1,
    borderColor: Colors.glassBorderGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.glow,
  },
  heroTitle: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.porcelain,
    marginBottom: 2,
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  errorText: {
    color: '#F87171',
    fontSize: Typography.xs,
    flex: 1,
    fontWeight: '600',
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.powderBlue,
    marginBottom: 4,
    marginTop: Spacing.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(13, 24, 33, 0.6)',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  fieldIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.porcelain,
  },
  buttonWrapper: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  button: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.inkBlack,
    fontSize: Typography.sm + 1,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  footerText: {
    fontSize: Typography.sm,
    color: 'rgba(240, 244, 239, 0.7)',
  },
  linkText: {
    fontSize: Typography.sm,
    color: Colors.powderBlue,
    fontWeight: '800',
  },
});
