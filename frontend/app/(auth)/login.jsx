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
import {
  Bike,
  Mail,
  Lock,
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../constants/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleLogin = async (customEmail, customPassword) => {
    const loginEmail = customEmail || email;
    const loginPass = customPassword || password;

    if (!loginEmail.trim() || !loginPass) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await login(loginEmail.trim(), loginPass);
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        'Login failed. Please check your credentials.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleLogin(demoEmail, demoPass);
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
        {/* Luxury Hero Banner */}
        <LinearGradient
          colors={['#4F46E5', '#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={styles.logoBadge}>
            <Bike size={32} color={Colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={styles.brandTitle}>ChalLaa</Text>
          <View style={styles.taglineRow}>
            <Sparkles size={14} color="#FDE68A" />
            <Text style={styles.taglineText}>Peer-to-Peer Campus Errands</Text>
          </View>
          <Text style={styles.subtext}>Deliveries, food, prints & pharmacy in minutes</Text>
        </LinearGradient>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formHeader}>Sign In</Text>
          <Text style={styles.formSubHeader}>Access your hostel errand feed</Text>

          <Text style={styles.inputLabel}>Campus Email</Text>
          <View style={styles.inputBox}>
            <Mail size={18} color={Colors.textMuted} style={styles.fieldIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. aryan@campus.edu"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (errorMessage) setErrorMessage(null);
              }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputBox}>
            <Lock size={18} color={Colors.textMuted} style={styles.fieldIcon} />
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

          {/* Glowing CTA Button */}
          <TouchableOpacity
            onPress={() => handleLogin()}
            disabled={loading}
            activeOpacity={0.85}
            style={styles.ctaWrapper}
          >
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.ctaButton, loading && styles.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <View style={styles.ctaInner}>
                  <Text style={styles.ctaText}>Continue to Campus Feed</Text>
                  <ArrowRight size={18} color={Colors.white} strokeWidth={2.5} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 1-Tap Quick Demo Logins */}
        <View style={styles.demoSection}>
          <Text style={styles.demoHeader}>⚡ Instant 1-Tap Demo Logins</Text>
          <View style={styles.demoGrid}>
            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => fillDemoAccount('aryan@campus.edu', 'Password@123')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[styles.demoBadgeIcon, { backgroundColor: '#EEF2FF' }]}>
                <ShieldCheck size={18} color={Colors.primary} />
              </View>
              <Text style={styles.demoRole}>Admin</Text>
              <Text style={styles.demoName}>Aryan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => fillDemoAccount('priya@campus.edu', 'Password@123')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[styles.demoBadgeIcon, { backgroundColor: '#ECFDF5' }]}>
                <User size={18} color={Colors.secondaryDark} />
              </View>
              <Text style={styles.demoRole}>Student</Text>
              <Text style={styles.demoName}>Priya</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => fillDemoAccount('rahul@campus.edu', 'Password@123')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[styles.demoBadgeIcon, { backgroundColor: '#FEF3C7' }]}>
                <Bike size={18} color="#D97706" />
              </View>
              <Text style={styles.demoRole}>Runner</Text>
              <Text style={styles.demoName}>Rahul</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New to ChalLaa? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.registerLink}>Create Student Account</Text>
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
    paddingTop: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  heroBanner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.glow,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  brandTitle: {
    fontSize: Typography.title + 2,
    fontWeight: 'bold',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  taglineText: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
  },
  subtext: {
    fontSize: Typography.xs,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 4,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.dangerLight,
    borderColor: Colors.danger,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  errorText: {
    color: Colors.dangerDark,
    fontSize: Typography.xs,
    flex: 1,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.card,
  },
  formHeader: {
    fontSize: Typography.xl,
    fontWeight: 'bold',
    color: Colors.text,
  },
  formSubHeader: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 6,
    marginTop: Spacing.xs,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  fieldIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.text,
  },
  ctaWrapper: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  ctaButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  ctaText: {
    color: Colors.white,
    fontSize: Typography.sm + 1,
    fontWeight: 'bold',
  },
  demoSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    ...Shadows.subtle,
  },
  demoHeader: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  demoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  demoCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  demoRole: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.text,
  },
  demoName: {
    fontSize: Typography.xs - 2,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  footerText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  registerLink: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
