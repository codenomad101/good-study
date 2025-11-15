import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Camera,
  Save,
  X,
  Trophy,
  Flame,
  Clock,
  Book,
  ChevronLeft,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { showToast } from '@/utils/toast';
import AppHeader from '@/components/AppHeader';
import { useTranslation } from '@/hooks/useTranslation';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    preferredLanguage: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        gender: user.gender || '',
        preferredLanguage: '',
      });
    }
  }, [user]);

  const handlePickProfileImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Permission to access camera roll is required to upload profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setUploading(true);

        try {
          // Upload using the profile picture endpoint
          const uploadResponse = await apiService.uploadProfilePicture(
            asset.uri,
            `profile-${Date.now()}.jpg`,
            asset.mimeType || 'image/jpeg'
          );

          if (uploadResponse.success && uploadResponse.data?.url) {
            // Profile is automatically updated by the backend
            showToast.success('Profile picture updated successfully!');
            // Refresh user data
            if (uploadResponse.data.user) {
              // The AuthContext should handle this, but we can trigger a refresh
            }
          } else {
            showToast.error(uploadResponse.message || 'Failed to upload profile picture');
          }
        } catch (uploadError: any) {
          console.error('[Settings] Error uploading image:', uploadError);
          showToast.error(uploadError?.message || 'Failed to upload image');
        } finally {
          setUploading(false);
        }
      }
    } catch (error: any) {
      console.error('[Settings] Error picking image:', error);
      showToast.error('Failed to pick image');
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await updateProfile({
        fullName: formData.fullName,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender as 'male' | 'female' | 'other' | undefined,
      });
      showToast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      showToast.error(error?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      showToast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      showToast.error(error?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { title: 'Total Points', value: user?.totalPoints || 0, iconName: 'trophy', color: '#F59E0B' },
    { title: 'Current Level', value: user?.level || 1, iconName: 'fire', color: '#EF4444' },
    { title: 'Current Streak', value: `${user?.currentStreak || 0} days`, iconName: 'clock', color: '#10B981' },
    { title: 'Study Time', value: `${Math.round((user?.totalStudyTimeMinutes || 0) / 60)}h`, iconName: 'book', color: '#3B82F6' },
  ];

  const renderIcon = (iconName: string, size: number, color: string) => {
    switch (iconName) {
      case 'trophy':
        return <Trophy size={size} color={color} />;
      case 'fire':
        return <Flame size={size} color={color} />;
      case 'clock':
        return <Clock size={size} color={color} />;
      case 'book':
        return <Book size={size} color={color} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader showLogo={true} extraTopSpacing={true} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          {!isEditing ? (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.editButton}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity
                onPress={() => {
                  setIsEditing(false);
                  // Reset form data
                  if (user) {
                    setFormData({
                      fullName: user.fullName || '',
                      phone: user.phone || '',
                      dateOfBirth: user.dateOfBirth || '',
                      gender: user.gender || '',
                      preferredLanguage: '',
                    });
                  }
                }}
                style={styles.cancelButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveProfile}
                style={styles.saveButton}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Save size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              {renderIcon(stat.iconName, 24, stat.color)}
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* Profile Picture */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Picture</Text>
          <View style={styles.profilePictureContainer}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handlePickProfileImage}
              disabled={uploading}
            >
              {uploading ? (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator size="large" color="#2563EB" />
                </View>
              ) : (
                <>
                  <Image
                    source={{ uri: user?.profilePictureUrl || 'https://via.placeholder.com/120' }}
                    style={styles.avatar}
                  />
                  <View style={styles.avatarOverlay}>
                    <Camera size={24} color="#FFFFFF" />
                  </View>
                </>
              )}
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
            <Text style={styles.avatarHintSmall}>JPG, PNG or GIF. Max size 5MB</Text>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.inputContainer}>
            <User size={20} color="#6B7280" />
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              placeholder="Full Name"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              editable={isEditing}
            />
          </View>

          <View style={styles.inputContainer}>
            <Mail size={20} color="#6B7280" />
            <TextInput
              style={[styles.input, styles.inputDisabled]}
              placeholder="Email"
              value={user?.email || ''}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Phone size={20} color="#6B7280" />
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputContainer}>
            <Calendar size={20} color="#6B7280" />
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              placeholder="Date of Birth (YYYY-MM-DD)"
              value={formData.dateOfBirth}
              onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
              editable={isEditing}
            />
          </View>

          <View style={styles.inputContainer}>
            <User size={20} color="#6B7280" />
            <TextInput
              style={[styles.input, !isEditing && styles.inputDisabled]}
              placeholder="Gender (male/female/other)"
              value={formData.gender}
              onChangeText={(text) => setFormData({ ...formData, gender: text })}
              editable={isEditing}
            />
          </View>
        </View>

        {/* Change Password */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.passwordButton}
            onPress={() => setShowPasswordModal(true)}
          >
            <Lock size={20} color="#6B7280" />
            <Text style={styles.passwordButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Status</Text>
            <View style={styles.infoValue}>
              <View style={[styles.statusBadge, { backgroundColor: user?.isActive ? '#10B981' : '#EF4444' }]}>
                <Text style={styles.statusText}>{user?.isActive ? 'Active' : 'Inactive'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Subscription</Text>
            <Text style={styles.infoValueText}>{user?.subscriptionType || 'Free'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValueText}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Longest Streak</Text>
            <Text style={[styles.infoValueText, { color: '#F59E0B', fontWeight: '600' }]}>
              {user?.longestStreak || 0} days
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity
              onPress={() => setShowPasswordModal(false)}
              style={styles.modalCloseButton}
            >
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputContainer}>
              <Lock size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                style={styles.eyeButton}
              >
                {showCurrentPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity
                onPress={() => setShowNewPassword(!showNewPassword)}
                style={styles.eyeButton}
              >
                {showNewPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Lock size={20} color="#6B7280" />
              <TextInput
                style={styles.input}
                placeholder="Confirm New Password"
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalSaveButton, loading && styles.modalSaveButtonDisabled]}
              onPress={handleChangePassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.modalSaveButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F97316',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  saveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F97316',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  profilePictureContainer: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarLoading: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarHint: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  avatarHintSmall: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputDisabled: {
    color: '#9CA3AF',
  },
  passwordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passwordButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValueText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  eyeButton: {
    padding: 4,
  },
  modalSaveButton: {
    backgroundColor: '#F97316',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  modalSaveButtonDisabled: {
    opacity: 0.6,
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

