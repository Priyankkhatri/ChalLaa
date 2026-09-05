import React from 'react';
import { Tabs } from 'expo-router';
import { LiquidGlassTabBar } from '../../components/navigation';
import { Colors } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        animation: 'shift',
        headerStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(226, 232, 240, 0.80)',
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
