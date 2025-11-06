import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  const { accessibilityState, style, children } = props;
  const isSelected = accessibilityState?.selected ?? false;

  console.log('HapticTab - isSelected:', isSelected); // Debug log

  return (
    <View style={styles.container}>
      <View 
        style={[
          styles.tabBackground,
          isSelected && styles.tabBackgroundSelected,
        ]}
      >
        <PlatformPressable
          {...props}
          style={[
            styles.tabButton,
            style && typeof style === 'object' ? style : undefined,
          ]}
          android_ripple={{ 
            color: isSelected ? 'rgba(37, 99, 235, 0.1)' : 'rgba(255, 255, 255, 0.1)',
            borderless: false,
          }}
          onPressIn={(ev) => {
            if (process.env.EXPO_OS === 'ios') {
              // Add a soft haptic feedback when pressing down on the tabs.
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            props.onPressIn?.(ev);
          }}
        >
          {children}
        </PlatformPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  tabBackground: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  tabBackgroundSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
});