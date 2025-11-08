import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { Globe, ChevronDown, Check, Bell } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import UserProfileDropdown from './UserProfileDropdown';
import NotificationDropdown from './NotificationDropdown';
import { useUnreadCount } from '../hooks/useNotifications';

interface AppHeaderProps {
  title?: string;
  showLogo?: boolean;
  extraTopSpacing?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, showLogo = true, extraTopSpacing = false }) => {
  const { user } = useAuth();
  const { language, changeLang } = useLanguage();
  const { data: unreadCount = 0 } = useUnreadCount();
  const insets = useSafeAreaInsets();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 8 }, extraTopSpacing && styles.headerWithExtraSpacing]}>
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
        
        <View style={styles.rightSection}>
          {/* Language Switcher */}
          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => setShowLanguageDropdown(true)}
          >
            <Globe size={20} color="#FFFFFF" />
            <Text style={styles.languageText}>{language === 'mr' ? 'मराठी' : 'EN'}</Text>
            <ChevronDown size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Notification Button */}
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => setShowNotificationDropdown(true)}
          >
            <Bell size={20} color="#FFFFFF" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Profile Button */}
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
      </View>
      
      {/* Language Dropdown Modal */}
      <Modal
        visible={showLanguageDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageDropdown(false)}
      >
        <Pressable
          style={styles.languageDropdownOverlay}
          onPress={() => setShowLanguageDropdown(false)}
        >
          <View style={styles.languageDropdown} onStartShouldSetResponder={() => true}>
            <TouchableOpacity
              style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}
              onPress={() => {
                changeLang('en');
                setShowLanguageDropdown(false);
              }}
            >
              <Text style={[styles.languageOptionText, language === 'en' && styles.languageOptionTextActive]}>
                English
              </Text>
              {language === 'en' && <Check size={18} color="#2563EB" />}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageOption, language === 'mr' && styles.languageOptionActive]}
              onPress={() => {
                changeLang('mr');
                setShowLanguageDropdown(false);
              }}
            >
              <Text style={[styles.languageOptionText, language === 'mr' && styles.languageOptionTextActive]}>
                मराठी
              </Text>
              {language === 'mr' && <Check size={18} color="#2563EB" />}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
      
      <NotificationDropdown
        visible={showNotificationDropdown}
        onClose={() => setShowNotificationDropdown(false)}
      />
      
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
    paddingBottom: 12,
    backgroundColor: '#1E3A8A', // Dark blue
    borderBottomWidth: 1,
    borderBottomColor: '#1E40AF',
  },
  headerWithExtraSpacing: {
    // Additional spacing is now handled by insets.top in inline style
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  languageText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    minWidth: 40,
    textAlign: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#1E3A8A',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
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
  languageDropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 70,
    paddingRight: 16,
  },
  languageDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  languageOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  languageOptionTextActive: {
    fontWeight: '600',
    color: '#2563EB',
  },
});

export default AppHeader;

