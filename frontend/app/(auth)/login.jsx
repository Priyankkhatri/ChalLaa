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
import { LiquidGlassCard } from '../../components/ui/LiquidGlass';

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
                <Bike size={34} color={Colors.powderBlue} strokeWidth={2.4} />
              </View>
              <Text style={styles.brandTitle}>ChalLaa</Text>
              <View style={styles.taglineRow}>
                <Sparkles size={14} color={Colors.drySage} />
                <Text style={styles.taglineText}>Peer-to-Peer Campus Errands</Text>
              </View>
              <Text style={styles.subtext}>Deliveries, food, prints & pharmacy in minutes</Text>
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
          <Text style={styles.formHeader}>Sign In</Text>
          <Text style={styles.formSubHeader}>Access your hostel errand feed</Text>

          <Text style={styles.inputLabel}>Campus Email</Text>
          <View style={styles.inputBox}>
            <Mail size={18} color={Colors.powderBlue} style={styles.fieldIcon} />
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

          {/* Glowing CTA Button */}
          <TouchableOpacity
            onPress={() => handleLogin()}
            disabled={loading}
            activeOpacity={0.85}
            style={styles.ctaWrapper}
          >
            <LinearGradient
              colors={Colors.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.ctaButton, loading && styles.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color={Colors.inkBlack} />
              ) : (
                <View style={styles.ctaInner}>
                  <Text style={styles.ctaText}>Continue to Campus Feed</Text>
                  <ArrowRight size={18} color={Colors.inkBlack} strokeWidth={2.8} />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LiquidGlassCard>

        {/* 1-Tap Quick Demo Logins */}
        <LiquidGlassCard variant="default">
          <Text style={styles.demoHeader}>⚡ Instant 1-Tap Demo Logins</Text>
          <View style={styles.demoGrid}>
            <TouchableOpacity
              style={styles.demoCard}
              onPress={() => fillDemoAccount('aryan@campus.edu', 'Password@123')}
              disabled={loading}
              activeOpacity={0.8}
            >
              <View style={[styles.demoBadgeIcon, { backgroundColor: 'rgba(180, 205, 237, 0.15)' }]}>
                <ShieldCheck size={18} color={Colors.powderBlue} />
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
              <View style={[styles.demoBadgeIcon, { backgroundColor: 'rgba(191, 204, 148, 0.15)' }]}>
                <User size={18} color={Colors.drySage} />
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
              <View style={[styles.demoBadgeIcon, { backgroundColor: 'rgba(52, 73, 102, 0.4)' }]}>
                <Bike size={18} color={Colors.powderBlue} />
              </View>
              <Text style={styles.demoRole}>Runner</Text>
              <Text style={styles.demoName}>Rahul</Text>
            </TouchableOpacity>
          </View>
        </LiquidGlassCard>

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
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(52, 73, 102, 0.55)',
    borderWidth: 1,
    borderColor: Colors.glassBorderGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.glow,
  },
  brandTitle: {
    fontSize: Typography.title + 2,
    fontWeight: '800',
    color: Colors.porcelain,
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
    fontWeight: '700',
    color: Colors.powderBlue,
  },
  subtext: {
    fontSize: Typography.xs,
    color: 'rgba(240, 244, 239, 0.7)',
    textAlign: 'center',
    marginTop: 4,
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
  formHeader: {
    fontSize: Typography.xl,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  formSubHeader: {
    fontSize: Typography.xs,
    color: Colors.powderBlue,
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: Typography.xs,
    fontWeight: '700',
    color: Colors.powderBlue,
    marginBottom: 6,
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
  ctaWrapper: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.full,
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
    color: Colors.inkBlack,
    fontSize: Typography.sm + 1,
    fontWeight: '800',
  },
  demoHeader: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: Colors.powderBlue,
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
    backgroundColor: 'rgba(13, 24, 33, 0.55)',
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  demoBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  demoRole: {
    fontSize: Typography.xs,
    fontWeight: '800',
    color: Colors.porcelain,
  },
  demoName: {
    fontSize: Typography.xs - 2,
    color: Colors.powderBlue,
    marginTop: 1,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  footerText: {
    fontSize: Typography.sm,
    color: 'rgba(240, 244, 239, 0.7)',
  },
  registerLink: {
    fontSize: Typography.sm,
    color: Colors.powderBlue,
    fontWeight: '800',
  },
});
