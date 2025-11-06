import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Crown,
  Trophy,
  Settings,
  LogOut,
  Star,
  Target,
  Calendar,
  ChevronDown,
  ChevronUp,
  Camera,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useRouter } from 'expo-router';
import { apiService } from '../services/api';
import { useTranslation } from '../hooks/useTranslation';

const { width } = Dimensions.get('window');

interface UserProfileDropdownProps {
  visible: boolean;
  onClose: () => void;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ visible, onClose }) => {
  const { user, logout, updateProfile } = useAuth();
  const { language, changeLang } = useLanguage();
  const { t } = useTranslation();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<'lite' | 'pro'>('lite');
  const [isPlansExpanded, setIsPlansExpanded] = useState(false);
  const [isRankingsExpanded, setIsRankingsExpanded] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleLogout = () => {
    onClose();
    logout();
  };

  const handleNavigateToLeaderboard = () => {
    onClose();
    router.push('/(tabs)/leaderboard');
  };

  const handleNavigateToSettings = () => {
    onClose();
    // Navigate to settings when settings page is created
    // router.push('/(tabs)/settings');
  };

  const handlePickProfileImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access camera roll is required to upload profile picture.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Upload the image
        setUploadingImage(true);
        try {
          const uploadResponse = await apiService.uploadNoteAttachment(
            asset.uri,
            `profile-${Date.now()}.jpg`,
            asset.mimeType || 'image/jpeg'
          );

          if (uploadResponse.success && uploadResponse.data?.url) {
            // Update profile with new picture URL
            await updateProfile({
              profilePictureUrl: uploadResponse.data.url,
            });
            
            Alert.alert('Success', 'Profile picture updated successfully!');
          } else {
            Alert.alert('Error', 'Failed to upload image. Please try again.');
          }
        } catch (uploadError: any) {
          console.error('[UserProfile] Error uploading image:', uploadError);
          Alert.alert('Error', uploadError?.message || 'Failed to upload image');
        } finally {
          setUploadingImage(false);
        }
      }
    } catch (error: any) {
      console.error('[UserProfile] Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      setUploadingImage(false);
    }
  };

  const renderPlanCard = (planType: 'lite' | 'pro', title: string, price: string, features: string[], isPopular: boolean = false) => (
    <TouchableOpacity
      key={planType}
      style={[
        styles.planCard,
        selectedPlan === planType && styles.selectedPlan,
        isPopular && styles.popularPlan
      ]}
      onPress={() => setSelectedPlan(planType)}
    >
      {isPopular && (
        <View style={styles.popularBadge}>
          <Crown size={16} color="#FFFFFF" />
          <Text style={styles.popularText}>POPULAR</Text>
        </View>
      )}
      
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{title}</Text>
        <Text style={styles.planPrice}>{price}</Text>
      </View>
      
      <View style={styles.featuresList}>
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Star size={16} color="#10B981" />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity
        style={[
          styles.selectButton,
          selectedPlan === planType && styles.selectedButton
        ]}
      >
        <Text style={[
          styles.selectButtonText,
          selectedPlan === planType && styles.selectedButtonText
        ]}>
          {selectedPlan === planType ? 'Selected' : 'Select Plan'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* User Info Section */}
          <View style={styles.userInfoSection}>
            <TouchableOpacity 
              style={styles.userAvatar}
              onPress={handlePickProfileImage}
              disabled={uploadingImage}
            >
              {uploadingImage ? (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator size="small" color="#2563EB" />
                </View>
              ) : (
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: user?.profilePictureUrl || 'https://via.placeholder.com/80' }}
                    style={styles.avatarImage}
                  />
                  <View style={styles.avatarEditOverlay}>
                    <Camera size={20} color="#FFFFFF" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
            
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.fullName || 'User Name'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
              <View style={styles.userStats}>
                <View style={styles.statItem}>
                  <Trophy size={16} color="#F59E0B" />
                  <Text style={styles.statText}>Level {user?.level || 1}</Text>
                </View>
                <View style={styles.statItem}>
                  <Target size={16} color="#3B82F6" />
                  <Text style={styles.statText}>{user?.totalPoints || 0} Points</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Current Plan Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Plan</Text>
            <TouchableOpacity 
              style={styles.currentPlanCard}
              onPress={() => {
                onClose();
                router.push('/(tabs)/pricing');
              }}
            >
              <View style={styles.planInfo}>
                <Crown size={24} color="#F59E0B" />
                <View style={styles.planDetails}>
                  <Text style={styles.currentPlanName}>View Plans & Pricing</Text>
                  <Text style={styles.currentPlanDescription}>Manage your subscription</Text>
                </View>
              </View>
              <ChevronDown size={20} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
            </TouchableOpacity>
          </View>


          {/* Rankings Section */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setIsRankingsExpanded(!isRankingsExpanded)}
            >
              <Text style={styles.sectionTitle}>Your Rankings</Text>
              {isRankingsExpanded ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
            
            {isRankingsExpanded && (
              <View style={styles.rankingsContainer}>
                <View style={styles.rankingCard}>
                  <View style={styles.rankingHeader}>
                    <Trophy size={20} color="#F59E0B" />
                    <Text style={styles.rankingTitle}>Overall Rank</Text>
                  </View>
                  <Text style={styles.rankingNumber}>#1,247</Text>
                  <Text style={styles.rankingSubtext}>Top 15% of users</Text>
                </View>

                <View style={styles.rankingCard}>
                  <View style={styles.rankingHeader}>
                    <Calendar size={20} color="#10B981" />
                    <Text style={styles.rankingTitle}>This Month</Text>
                  </View>
                  <Text style={styles.rankingNumber}>#89</Text>
                  <Text style={styles.rankingSubtext}>Great progress!</Text>
                </View>
              </View>
            )}
          </View>

          {/* Quick Actions Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={handleNavigateToLeaderboard}
            >
              <Trophy size={20} color="#F59E0B" />
              <Text style={styles.actionText}>Leaderboard</Text>
              <ChevronDown size={20} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionItem}
              onPress={handleNavigateToSettings}
            >
              <Settings size={20} color="#6B7280" />
              <Text style={styles.actionText}>Settings</Text>
              <ChevronDown size={20} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionItem}
              onPress={() => {
                onClose();
                router.push('/(tabs)/pricing');
              }}
            >
              <Crown size={20} color="#6B7280" />
              <Text style={styles.actionText}>Plans & Pricing</Text>
              <ChevronDown size={20} color="#9CA3AF" style={{ transform: [{ rotate: '-90deg' }] }} />
            </TouchableOpacity>
          </View>

          {/* Settings Section (Optional - Expanded Settings) */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setIsSettingsExpanded(!isSettingsExpanded)}
            >
              <Text style={styles.sectionTitle}>More Settings</Text>
              {isSettingsExpanded ? (
                <ChevronUp size={20} color="#6B7280" />
              ) : (
                <ChevronDown size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
            
            {isSettingsExpanded && (
              <View style={styles.settingsContainer}>
                <View style={styles.settingItem}>
                  <View style={styles.settingItemLeft}>
                    <Target size={20} color="#6B7280" />
                    <Text style={styles.settingText}>Practice Preferences</Text>
                  </View>
                  <ChevronDown size={20} color="#9CA3AF" />
                </View>
                
                <View style={styles.settingItem}>
                  <View style={styles.settingItemLeft}>
                    <Calendar size={20} color="#6B7280" />
                    <Text style={styles.settingText}>Study Schedule</Text>
                  </View>
                  <ChevronDown size={20} color="#9CA3AF" />
                </View>

                {/* Language Selector */}
                <View style={styles.languageSelector}>
                  <Text style={styles.languageLabel}>Language</Text>
                  <View style={styles.languageButtons}>
                    <TouchableOpacity
                      style={[styles.languageButton, language === 'en' && styles.languageButtonActive]}
                      onPress={() => changeLang('en')}
                    >
                      <Text style={[styles.languageButtonText, language === 'en' && styles.languageButtonTextActive]}>
                        English
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.languageButton, language === 'mr' && styles.languageButtonActive]}
                      onPress={() => changeLang('mr')}
                    >
                      <Text style={[styles.languageButtonText, language === 'mr' && styles.languageButtonTextActive]}>
                        मराठी
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Logout Section */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <LogOut size={20} color="#EF4444" />
              <Text style={styles.logoutText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  userInfoSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  avatarLoading: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  userStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  plansContainer: {
    marginTop: 8,
  },
  rankingsContainer: {
    marginTop: 8,
  },
  settingsContainer: {
    marginTop: 8,
  },
  currentPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  planInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planDetails: {
    marginLeft: 12,
  },
  currentPlanName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  currentPlanDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  upgradeButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedPlan: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  popularPlan: {
    borderColor: '#F59E0B',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  popularText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planHeader: {
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  featuresList: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#374151',
  },
  selectButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedButton: {
    backgroundColor: '#3B82F6',
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  selectedButtonText: {
    color: '#FFFFFF',
  },
  rankingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rankingTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  rankingNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  rankingSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
  },
  languageSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  languageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  languageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  languageButtonTextActive: {
    color: '#FFFFFF',
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  actionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
});

export default UserProfileDropdown;
