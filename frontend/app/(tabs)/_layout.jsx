import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Compass, ListChecks, User } from 'lucide-react-native';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.powderBlue,
        tabBarInactiveTintColor: 'rgba(240, 244, 239, 0.45)',
        tabBarBackground: () => (
          <BlurView
            intensity={Platform.OS === 'ios' ? 50 : 80}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 14,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(13, 24, 33, 0.80)',
          borderWidth: 1.2,
          borderColor: 'rgba(180, 205, 237, 0.35)',
          borderRadius: BorderRadius.xxl,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
          ...(Platform.OS === 'web' ? {
            backdropFilter: 'blur(28px) saturate(190%)',
            WebkitBackdropFilter: 'blur(28px) saturate(190%)',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(240, 244, 239, 0.3)',
          } : {}),
          ...Shadows.glow,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 10,
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: 'rgba(13, 24, 33, 0.85)',
          borderBottomWidth: 1,
          borderBottomColor: Colors.glassBorder,
        },
        headerTintColor: Colors.porcelain,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
          color: Colors.porcelain,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Campus Feed',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconGlow : null}>
              <Compass size={20} color={color} strokeWidth={focused ? 2.6 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="my-errands"
        options={{
          title: 'My Errands',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconGlow : null}>
              <ListChecks size={20} color={color} strokeWidth={focused ? 2.6 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconGlow : null}>
              <User size={20} color={color} strokeWidth={focused ? 2.6 : 2} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeIconGlow: {
    shadowColor: Colors.powderBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 10,
    ...(Platform.OS === 'web' ? { filter: 'drop-shadow(0 0 6px rgba(180, 205, 237, 0.7))' } : {}),
  },
});
