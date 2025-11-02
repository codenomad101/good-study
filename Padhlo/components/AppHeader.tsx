import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import UserProfileDropdown from './UserProfileDropdown';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  extraTopSpacing?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, showLogo = true, extraTopSpacing = false }) => {
  const { user } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  return (
    <>
      <View style={[styles.header, extraTopSpacing && styles.headerWithExtraSpacing]}>
        <View style={styles.leftSection}>
          {showLogo && (
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>
                <Text style={styles.logoG}>G</Text>
                <Text style={styles.logoS}>
                  S
                  <Text style={styles.logoAccent}>&gt;</Text>
                </Text>
              </Text>
            </View>
          )}
          {title && (
            <Text style={styles.title}>{title}</Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setShowProfileDropdown(true)}
        >
          <Image
            source={{ uri: user?.profilePictureUrl || 'https://via.placeholder.com/40' }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>
      
      <UserProfileDropdown
        visible={showProfileDropdown}
        onClose={() => setShowProfileDropdown(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#1E3A8A', // Dark blue
    borderBottomWidth: 1,
    borderBottomColor: '#1E40AF',
  },
  headerWithExtraSpacing: {
    paddingTop: 32, // Increased spacing more
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoContainer: {
    marginRight: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  logoG: {
    color: '#93C5FD', // Light blue for G
    fontFamily: 'System',
  },
  logoS: {
    color: '#FFFFFF', // White for S
    fontFamily: 'System',
    position: 'relative',
  },
  logoAccent: {
    position: 'absolute',
    top: -4,
    right: -6,
    fontSize: 14,
    transform: [{ rotate: '-45deg' }],
    color: '#FFFFFF', // White for accent
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF', // White text
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E40AF', // Slightly lighter blue for button
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#3B82F6', // Light blue border
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default AppHeader;

