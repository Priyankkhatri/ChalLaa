import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
            backgroundColor: Colors.inkBlack,
            borderBottomWidth: 1,
            borderBottomColor: Colors.glassBorder,
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
        <Stack.Screen name="admin/index" options={{ title: 'Campus Moderation Panel' }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NavigationGuard />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.inkBlack,
  },
});
