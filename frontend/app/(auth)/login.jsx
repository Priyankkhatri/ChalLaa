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
import { Ionicons } from '@expo/vector-icons';
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
      >
        {/* Gradient Hero Header */}
        <LinearGradient
          colors={['#4F46E5', '#7C3AED', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroHeader}
        >
          <View style={styles.logoBadge}>
            <Ionicons name="bicycle" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>ChalLaa 🏃</Text>
          <Text style={styles.tagline}>Campus Peer-to-Peer Errands</Text>
          <Text style={styles.subtext}>Hyperlocal Hostel & Campus Community</Text>
        </LinearGradient>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color={Colors.danger} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Login Form Card */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome Back</Text>
          <Text style={styles.formSubtitle}>Sign in to your campus account</Text>

          <Text style={styles.label}>College / Hostel Email</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
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

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} style={styles.inputIcon} />
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

          {/* Gradient Submit Button */}
          <TouchableOpacity
            onPress={() => handleLogin()}
            disabled={loading}
            activeOpacity={0.85}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#4F46E5', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.button, loading && styles.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Log In to Campus Feed</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 1-Tap Quick Demo Login Section */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>⚡ 1-Tap Quick Demo Logins</Text>
          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => fillDemoAccount('aryan@campus.edu', 'Password@123')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[styles.demoIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.demoChipTitle}>Admin</Text>
              <Text style={styles.demoChipSub}>Aryan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => fillDemoAccount('priya@campus.edu', 'Password@123')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[styles.demoIconCircle, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="person" size={14} color={Colors.secondaryDark} />
              </View>
              <Text style={styles.demoChipTitle}>Student</Text>
              <Text style={styles.demoChipSub}>Priya</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoChip}
              onPress={() => fillDemoAccount('rahul@campus.edu', 'Password@123')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[styles.demoIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="bicycle" size={14} color="#D97706" />
              </View>
              <Text style={styles.demoChipTitle}>Runner</Text>
              <Text style={styles.demoChipSub}>Rahul</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to ChalLaa? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>Create an Account</Text>
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
  heroHeader: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.glow,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.card,
  },
  appName: {
    fontSize: Typography.title,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 2,
  },
  tagline: {
    fontSize: Typography.sm,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  subtext: {
    fontSize: Typography.xs - 1,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.dangerBg,
    borderColor: Colors.danger,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  errorText: {
    color: Colors.danger,
    fontSize: Typography.xs,
    flex: 1,
  },
  formCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  formTitle: {
    fontSize: Typography.lg,
    fontWeight: 'bold',
    color: Colors.text,
  },
  formSubtitle: {
    fontSize: Typography.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: Typography.xs,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
    marginTop: Spacing.xs,
  },
  inputWrapper: {
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
  inputIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: Typography.sm,
    color: Colors.text,
  },
  buttonWrapper: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.glow,
  },
  button: {
    height: 48,
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
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: 'bold',
  },
  demoSection: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.subtle,
  },
  demoTitle: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  demoChip: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  demoIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  demoChipTitle: {
    fontSize: Typography.xs,
    fontWeight: 'bold',
    color: Colors.text,
  },
  demoChipSub: {
    fontSize: Typography.xs - 2,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  footerText: {
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  linkText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
