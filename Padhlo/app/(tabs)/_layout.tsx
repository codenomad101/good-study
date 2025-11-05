import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="practice"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="play.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="exam"
        options={{
          title: 'Exam',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="doc.text.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="note.text" color={color} />,
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="calendar" color={color} />,
        }}
      />
      <Tabs.Screen
        name="community/[groupId]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="community/[groupId]/[postId]"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="pricing"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}
