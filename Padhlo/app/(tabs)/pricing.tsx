import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AppHeader from '@/components/AppHeader';
import { 
  Rocket, 
  Crown, 
  Star, 
  Check, 
  X,
  ArrowRight
} from 'lucide-react-native';
import {
  useSubscriptionStatus,
  useStartTrial,
  useRenewSubscription,
} from '@/hooks/useApi';
import { showToast } from '@/utils/toast';

interface SubscriptionStatus {
  active: boolean;
  type: 'free' | 'trial' | 'lite' | 'pro';
  expiresAt: string | null;
  startDate: string | null;
}

interface Plan {
  name: string;
  icon: React.ReactNode;
  price: string;
  duration: string;
  description: string;
  features: string[];
  excludedFeatures?: string[];
  type: 'trial' | 'lite' | 'pro';
  color: string;
  badge: string;
}

const Pricing: React.FC = () => {
  const router = useRouter();
  const { data: statusData, isLoading: loadingStatus, refetch } = useSubscriptionStatus();
  const startTrialMutation = useStartTrial();
  const renewSubscriptionMutation = useRenewSubscription();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (statusData?.data) {
      const data = statusData.data as any;
      setSubscriptionStatus({
        active: data.active || false,
        type: data.type || 'free',
        expiresAt: data.expiresAt || null,
        startDate: data.startDate || null,
      });
    }
  }, [statusData]);

  const getDaysRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return 0;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const isCurrentPlan = (planType: 'trial' | 'lite' | 'pro') => {
    if (!subscriptionStatus) return false;
    return subscriptionStatus.type === planType && subscriptionStatus.active;
  };

  const handleStartTrial = async () => {
    try {
      await startTrialMutation.mutateAsync();
      showToast.success('Trial started successfully! You have 3 days of full access.', 'Trial Activated');
      setSuccessMessage('Your 3-day trial has started. You now have access to all Pro features including Community, Leaderboard, and AI Insights. After 3 days, you can choose to auto-pay to Pro (₹79/month) or switch to the free plan.');
      setShowSuccessModal(true);
      await refetch();
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Pricing] Error starting trial:', error);
      }
      showToast.error(error?.message || 'Failed to start trial. Please try again.');
    }
  };

  const handleSubscribe = async (planType: 'lite' | 'pro') => {
    // Navigate to payment screen
    const amount = planType === 'pro' ? '79' : '59';
    router.push({
      pathname: '/payment',
      params: {
        planType,
        amount,
      },
    });
  };

  const handleRenew = async () => {
    try {
      await renewSubscriptionMutation.mutateAsync();
      showToast.success('Subscription renewed successfully for 30 more days!', 'Renewal Successful');
      await refetch();
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Pricing] Error renewing subscription:', error);
      }
      showToast.error(error?.message || 'Failed to renew subscription. Please try again.');
    }
  };

  const plans: Plan[] = [
    {
      name: 'Free',
      icon: <Star size={32} color="#8c8c8c" />,
      price: 'Free',
      duration: 'Forever',
      description: 'Basic features with daily limits',
      features: [
        'Practice & Exams',
        '3 practice sessions per day',
        '3 exam sessions per day',
        'Progress tracking',
        'Study materials'
      ],
      excludedFeatures: [
        'No Community access',
        'No Notes access',
        'No Leaderboard',
        'No AI Insights'
      ],
      type: 'free',
      color: '#8c8c8c'
    },
    {
      name: 'Trial',
      icon: <Rocket size={32} color="#52c41a" />,
      price: 'Free',
      duration: '3 days',
      description: 'Full access to all Pro features for 3 days',
      features: [
        'All Pro features',
        'Community access',
        'Leaderboard',
        'AI Insights',
        'Unlimited Practice & Exams',
        'Progress tracking',
        'Study materials',
        'Notes & bookmarks',
        'Auto-pay to Pro (₹79/month) or switch to Free after 3 days'
      ],
      type: 'trial',
      color: '#52c41a',
      badge: 'Best to Start'
    },
    {
      name: 'Lite',
      icon: <Star size={32} color="#1890ff" />,
      price: '₹59',
      duration: '30 days',
      description: 'Essential features for focused learning',
      features: [
        'Practice & Exams',
        'Progress tracking',
        'Study materials',
        'Notes & bookmarks',
        'Performance analytics',
        'Exam preparation',
        'Daily practice sessions',
        'Unlimited questions'
      ],
      excludedFeatures: [
        'No Community access',
        'No Leaderboard',
        'No AI Insights'
      ],
      type: 'lite',
      color: '#1890ff',
      badge: 'Popular'
    },
    {
      name: 'Pro',
      icon: <Crown size={32} color="#ff7846" />,
      price: '₹79',
      duration: '30 days',
      description: 'Complete learning experience with all features',
      features: [
        'Everything in Lite',
        'Community access',
        'Leaderboard',
        'AI Insights',
        'Advanced analytics',
        'Priority support',
        'Early access to features',
        'Auto-renewal every 30 days'
      ],
      type: 'pro',
      color: '#ff7846',
      badge: 'Premium'
    }
  ];

  if (loadingStatus) {
    return (
      <View style={styles.container}>
        <AppHeader title="Pricing & Plans" showLogo={true} extraTopSpacing={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading subscription status...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Pricing & Plans" showLogo={true} extraTopSpacing={true} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <Text style={styles.headerSubtitle}>
            Unlock your learning potential with our flexible subscription plans
          </Text>
        </View>

        {/* Current Subscription Status */}
        {subscriptionStatus && subscriptionStatus.active && (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Current Plan</Text>
            <View style={styles.statusInfo}>
              <Text style={styles.statusType}>
                {subscriptionStatus.type.charAt(0).toUpperCase() + subscriptionStatus.type.slice(1)}
              </Text>
              {subscriptionStatus.expiresAt && (
                <Text style={styles.statusExpiry}>
                  Expires in {getDaysRemaining(subscriptionStatus.expiresAt)} days
                </Text>
              )}
            </View>
            {(subscriptionStatus.type === 'pro' || subscriptionStatus.type === 'lite') && (
              <TouchableOpacity
                style={styles.renewButton}
                onPress={handleRenew}
                disabled={renewSubscriptionMutation.isPending}
              >
                {renewSubscriptionMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.renewButtonText}>
                    {subscriptionStatus.type === 'pro' ? 'Renew Pro (₹79)' : 'Renew Lite (₹59)'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Plans */}
        <View style={styles.plansContainer}>
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.type);
            const isLoading = 
              (plan.type === 'trial' && startTrialMutation.isPending);

            return (
              <View key={plan.type} style={[styles.planCard, isCurrent && styles.planCardActive]}>
                {plan.badge && (
                  <View style={[styles.badge, { backgroundColor: plan.color }]}>
                    <Text style={styles.badgeText}>{plan.badge}</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  {plan.icon}
                  <Text style={styles.planName}>{plan.name}</Text>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{plan.price}</Text>
                  <Text style={styles.duration}>/{plan.duration}</Text>
                </View>

                <Text style={styles.planDescription}>{plan.description}</Text>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <Check size={16} color="#52c41a" />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                  {plan.excludedFeatures?.map((feature, index) => (
                    <View key={`excluded-${index}`} style={styles.featureItem}>
                      <X size={16} color="#ff4d4f" />
                      <Text style={[styles.featureText, styles.excludedFeature]}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.subscribeButton,
                    { backgroundColor: plan.color },
                    isCurrent && styles.subscribeButtonActive,
                    isLoading && styles.subscribeButtonDisabled
                  ]}
                  onPress={() => {
                    if (plan.type === 'trial') {
                      handleStartTrial();
                    } else {
                      handleSubscribe(plan.type);
                    }
                  }}
                  disabled={isLoading || isCurrent}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : isCurrent ? (
                    <Text style={styles.subscribeButtonText}>Current Plan</Text>
                  ) : (
                    <>
                      <Text style={styles.subscribeButtonText}>
                        {plan.type === 'trial' ? 'Start Trial' : plan.type === 'pro' ? 'Subscribe' : 'Subscribe'}
                      </Text>
                      <ArrowRight size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What's the difference between Lite and Pro?</Text>
            <Text style={styles.faqAnswer}>
              Lite plan is ₹59/month and includes all core learning features but excludes Community, Leaderboard, and AI Insights.
              Pro plan is ₹79/month and includes everything with access to social features and AI-powered insights.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>How long is the trial period?</Text>
            <Text style={styles.faqAnswer}>
              The trial period lasts 7 days with full access to all Pro features. After 7 days, you'll need to
              subscribe to continue using premium features.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Do plans auto-renew?</Text>
            <Text style={styles.faqAnswer}>
              Pro plan renews automatically every 30 days at ₹79/month. Lite plan renews automatically every 30 days at ₹59/month.
              You can cancel any subscription anytime from your profile settings.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I switch plans?</Text>
            <Text style={styles.faqAnswer}>
              Yes! You can upgrade from Lite to Pro anytime. Your subscription will be prorated based on remaining
              days.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Check size={48} color="#52c41a" />
              <Text style={styles.modalTitle}>Success!</Text>
            </View>
            <Text style={styles.modalMessage}>{successMessage}</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                router.back();
              }}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  headerSection: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  statusCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
    marginBottom: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusExpiry: {
    fontSize: 14,
    color: '#6B7280',
  },
  renewButton: {
    marginTop: 12,
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  renewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  plansContainer: {
    padding: 16,
    gap: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#F0F9FF',
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  price: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  duration: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  excludedFeature: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  subscribeButtonActive: {
    backgroundColor: '#9CA3AF',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  faqSection: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginTop: 16,
  },
  faqTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  faqItem: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  modalButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Pricing;

