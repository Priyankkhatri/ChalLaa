import React from 'react';
import { Tabs } from 'expo-router';
import LiquidGlassTabBar from '../../components/navigation/LiquidGlassTabBar';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        animation: 'shift',
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
        }}
      />
      <Tabs.Screen
        name="my-errands"
        options={{
          title: 'My Errands',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}
