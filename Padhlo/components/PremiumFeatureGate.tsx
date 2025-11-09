import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Lock,
  Crown,
  Users,
  FileText,
  Trophy,
  Check,
  ArrowRight,
} from 'lucide-react-native';
import { useSubscriptionStatus } from '../hooks/useApi';
import AppHeader from './AppHeader';

interface PremiumFeatureGateProps {
  featureName: 'community' | 'notes' | 'leaderboard';
  children?: React.ReactNode;
}

const featureDetails = {
  community: {
    title: 'Community',
    icon: Users,
    iconColor: '#2563EB',
    description: 'Connect with fellow learners, join study groups, share knowledge, and collaborate on your exam preparation journey.',
    features: [
      'Join and create study groups',
      'Share posts and discussions',
      'Comment and interact with peers',
      'Get help from the community',
      'Collaborate on study materials',
    ],
  },
  notes: {
    title: 'Notes',
    icon: FileText,
    iconColor: '#10B981',
    description: 'Create, organize, and manage your personal study notes with rich formatting, attachments, and easy access.',
    features: [
      'Create unlimited notes',
      'Organize with colors and tags',
      'Attach images and files',
      'Pin important notes',
      'Search and filter notes',
    ],
  },
  leaderboard: {
    title: 'Leaderboard',
    icon: Trophy,
    iconColor: '#F59E0B',
    description: 'Compete with other learners, track your rankings, and see how you compare across different categories and time periods.',
    features: [
      'View global rankings',
      'Track your position',
      'Compare performance',
      'Category-wise rankings',
      'Daily, weekly, and monthly leaderboards',
    ],
  },
};

export const PremiumFeatureGate: React.FC<PremiumFeatureGateProps> = ({
  featureName,
  children,
}) => {
  const router = useRouter();
  const { data: subscriptionData, isLoading } = useSubscriptionStatus();

  // Check if user has active subscription
  const subscription = subscriptionData?.data as any;
  const subscriptionType = subscription?.type || 'free';
  const isActive = subscription?.active || false;
  const hasAccess = (subscriptionType === 'trial' || subscriptionType === 'pro') && isActive;

  // If user has access, render children
  if (hasAccess && children) {
    return <>{children}</>;
  }

  // If loading, show nothing or loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader showLogo={true} extraTopSpacing={true} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const feature = featureDetails[featureName];
  const FeatureIcon = feature.icon;

  return (
    <View style={styles.container}>
      <AppHeader showLogo={true} extraTopSpacing={true} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${feature.iconColor}15` }]}>
            <Lock size={48} color={feature.iconColor} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Premium Feature Required</Text>

          {/* Feature Name */}
          <View style={styles.featureNameContainer}>
            <FeatureIcon size={24} color={feature.iconColor} />
            <Text style={[styles.featureName, { color: feature.iconColor }]}>
              {feature.title}
            </Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            {feature.title} requires a Trial or Pro subscription. Start your free 3-day trial or subscribe to Pro plan (₹59/month).
          </Text>

          {/* What's Included */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What's included:</Text>
            {feature.features.map((item, index) => (
              <View key={index} style={styles.featureItem}>
                <Check size={18} color={feature.iconColor} />
                <Text style={styles.featureText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* CTA Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: feature.iconColor }]}
              onPress={() => router.push('/(tabs)/pricing')}
              activeOpacity={0.8}
            >
              <Crown size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>View Plans & Pricing</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.secondaryButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  featureNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  featureName: {
    fontSize: 20,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: '#4B5563',
    flex: 1,
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
});

