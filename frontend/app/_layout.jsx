import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { Colors } from '../constants/theme';

function NavigationGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if user is not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main app feed if user is logged in
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.powderBlue} />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: 'rgba(255, 255, 255, 0.90)',
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(226, 232, 240, 0.80)',
          },
          headerTintColor: Colors.porcelain,
          headerTitleStyle: {
            fontWeight: '800',
            color: Colors.porcelain,
            letterSpacing: -0.2,
          },
          contentStyle: {
            backgroundColor: Colors.inkBlack,
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="errand/post"
          options={{ title: 'Post New Errand', presentation: 'card' }}
        />
        <Stack.Screen name="errand/[id]" options={{ title: 'Errand Details' }} />
        <Stack.Screen name="admin/index" options={{ title: 'Campus Moderation' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  const content = (
    <AuthProvider>
      <NavigationGuard />
    </AuthProvider>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webViewport}>
        <View style={styles.webAmbientGlow1} />
        <View style={styles.webAmbientGlow2} />
        <View style={styles.mobileShell}>
          {content}
        </View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.inkBlack,
  },
  webViewport: {
    flex: 1,
    width: '100%',
    height: '100vh',
    backgroundColor: '#E6EBF2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  webAmbientGlow1: {
    position: 'absolute',
    top: '5%',
    left: '15%',
    width: 600,
    height: 600,
    borderRadius: 9999,
    backgroundColor: '#BFDBFE',
    opacity: 0.55,
    ...(Platform.OS === 'web' ? { filter: 'blur(140px)' } : {}),
  },
  webAmbientGlow2: {
    position: 'absolute',
    bottom: '5%',
    right: '15%',
    width: 500,
    height: 500,
    borderRadius: 9999,
    backgroundColor: '#C7D2FE',
    opacity: 0.45,
    ...(Platform.OS === 'web' ? { filter: 'blur(130px)' } : {}),
  },
  mobileShell: {
    width: '100%',
    maxWidth: 440,
    height: '100%',
    maxHeight: 920,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.90)',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0 25px 70px -10px rgba(15, 23, 42, 0.16), 0 0 35px rgba(59, 130, 246, 0.08)',
    } : {}),
    backgroundColor: '#F6F8FB',
  },
});
