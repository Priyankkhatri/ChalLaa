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
            intensity={Platform.OS === 'ios' ? 45 : 70}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 18,
          right: 18,
          backgroundColor: 'rgba(13, 24, 33, 0.75)',
          borderWidth: 1,
          borderColor: Colors.glassBorder,
          borderRadius: BorderRadius.xxl,
          height: 64,
          paddingBottom: Platform.OS === 'ios' ? 8 : 10,
          paddingTop: 8,
          ...Shadows.glow,
        },
        tabBarLabelStyle: {
          fontWeight: '700',
          fontSize: 11,
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: Colors.inkBlack,
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
              <Compass size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
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
              <ListChecks size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
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
              <User size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
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
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
});
