import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import AppHeader from '@/components/AppHeader';
import { 
  CreditCard, 
  Building2, 
  Smartphone,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react-native';
import { showToast } from '@/utils/toast';
import { useSubscribeToLite, useSubscribeToPro } from '@/hooks/useApi';
import { Clipboard } from 'react-native';

type PaymentMethod = 'razorpay' | 'card' | 'netbanking' | 'autopay' | 'bank';

interface PaymentScreenParams {
  planType: 'lite' | 'pro';
  amount: string;
}

const PaymentScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams<PaymentScreenParams>();
  const planType = params.planType || 'pro';
  const amount = params.amount || (planType === 'pro' ? '79' : '59');
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const subscribeToLiteMutation = useSubscribeToLite();
  const subscribeToProMutation = useSubscribeToPro();

  const RAZORPAY_PAYMENT_ID = 'razorpay.me/@mondayhumor';
  const BANK_ACCOUNT = '646401009031';

  const handlePaymentMethodSelect = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    
    if (method === 'razorpay') {
      // Open Razorpay payment link in browser
      const razorpayUrl = `https://${RAZORPAY_PAYMENT_ID}?amount=${amount}&plan=${planType}`;
      await openPaymentBrowser(razorpayUrl);
    } else if (method === 'card' || method === 'netbanking') {
      // For card and netbanking, also use Razorpay
      const razorpayUrl = `https://${RAZORPAY_PAYMENT_ID}?amount=${amount}&plan=${planType}&method=${method}`;
      await openPaymentBrowser(razorpayUrl);
    } else if (method === 'autopay') {
      // Auto-pay setup - show confirmation
      Alert.alert(
        'Enable Auto-Pay',
        `Your ${planType === 'pro' ? 'Pro' : 'Lite'} subscription will automatically renew every 30 days at ₹${amount}/month. You can cancel anytime from your profile settings.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable Auto-Pay',
            onPress: () => handleAutoPay(),
          },
        ]
      );
    } else if (method === 'bank') {
      // Show bank transfer details
      Alert.alert(
        'Bank Transfer Details',
        `Account Number: ${BANK_ACCOUNT}\n\nPlease transfer ₹${amount} and share the transaction ID. Our team will activate your subscription within 24 hours.`,
        [
          { text: 'Copy Account Number', onPress: () => copyToClipboard(BANK_ACCOUNT) },
          { text: 'OK', style: 'default' },
        ]
      );
    }
  };

  const copyToClipboard = (text: string) => {
    try {
      Clipboard.setString(text);
      showToast.success('Copied to clipboard!', 'Success');
    } catch (error) {
      showToast.error('Failed to copy', 'Error');
    }
  };

  const handleAutoPay = async () => {
    try {
      setIsProcessing(true);
      
      if (planType === 'pro') {
        await subscribeToProMutation.mutateAsync();
        showToast.success('Pro subscription activated with Auto-Pay! (₹79/month)', 'Subscription Activated');
      } else {
        await subscribeToLiteMutation.mutateAsync();
        showToast.success('Lite plan activated with Auto-Pay! (₹59/month)', 'Subscription Activated');
      }
      
      router.back();
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Payment] Error enabling auto-pay:', error);
      }
      showToast.error(error?.message || 'Failed to enable auto-pay. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openPaymentBrowser = async (url: string) => {
    try {
      const result = await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
      });
      
      // Check if payment was successful (user closed browser after payment)
      // Note: In a real implementation, you'd use webhooks or check payment status via API
      if (result.type === 'dismiss') {
        // Show confirmation dialog
        Alert.alert(
          'Payment Status',
          'Did you complete the payment successfully?',
          [
            {
              text: 'No',
              style: 'cancel',
            },
            {
              text: 'Yes',
              onPress: handlePaymentSuccess,
            },
          ]
        );
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[Payment] Error opening browser:', error);
      }
      showToast.error('Unable to open payment link', 'Error');
    }
  };

  const handlePaymentSuccess = async () => {
    setIsProcessing(true);
    
    try {
      if (planType === 'pro') {
        await subscribeToProMutation.mutateAsync();
        showToast.success('Payment successful! Pro subscription activated (₹79/month)', 'Payment Success');
      } else {
        await subscribeToLiteMutation.mutateAsync();
        showToast.success('Payment successful! Lite plan activated (₹59/month)', 'Payment Success');
      }
      
      router.back();
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Payment] Error activating subscription:', error);
      }
      showToast.error(error?.message || 'Payment successful but subscription activation failed. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openRazorpayLink = () => {
    const url = `https://${RAZORPAY_PAYMENT_ID}?amount=${amount}&plan=${planType}`;
    Linking.openURL(url).catch(() => {
      showToast.error('Unable to open payment link', 'Error');
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader 
        title="Payment" 
        showLogo={false}
        extraTopSpacing={true}
      />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Plan Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Plan Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan:</Text>
            <Text style={styles.summaryValue}>
              {planType === 'pro' ? 'Pro Plan' : 'Lite Plan'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount:</Text>
            <Text style={styles.summaryValue}>₹{amount}/month</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Duration:</Text>
            <Text style={styles.summaryValue}>30 days</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>₹{amount}</Text>
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedMethod === 'razorpay' && styles.selectedCard
            ]}
            onPress={() => handlePaymentMethodSelect('razorpay')}
          >
            <View style={styles.methodHeader}>
              <Smartphone size={24} color="#2563EB" />
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>Razorpay</Text>
                <Text style={styles.methodDescription}>
                  Pay via Razorpay (UPI, Cards, Wallets)
                </Text>
              </View>
              {selectedMethod === 'razorpay' && (
                <CheckCircle size={24} color="#10B981" />
              )}
            </View>
            <TouchableOpacity
              style={styles.externalLinkButton}
              onPress={openRazorpayLink}
            >
              <Text style={styles.externalLinkText}>Open in Browser</Text>
              <ExternalLink size={16} color="#2563EB" />
            </TouchableOpacity>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedMethod === 'card' && styles.selectedCard
            ]}
            onPress={() => handlePaymentMethodSelect('card')}
          >
            <View style={styles.methodHeader}>
              <CreditCard size={24} color="#8B5CF6" />
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>Credit/Debit Card</Text>
                <Text style={styles.methodDescription}>
                  Visa, Mastercard, RuPay, Amex
                </Text>
              </View>
              {selectedMethod === 'card' && (
                <CheckCircle size={24} color="#10B981" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedMethod === 'netbanking' && styles.selectedCard
            ]}
            onPress={() => handlePaymentMethodSelect('netbanking')}
          >
            <View style={styles.methodHeader}>
              <Building2 size={24} color="#F59E0B" />
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>Net Banking</Text>
                <Text style={styles.methodDescription}>
                  All major banks supported
                </Text>
              </View>
              {selectedMethod === 'netbanking' && (
                <CheckCircle size={24} color="#10B981" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedMethod === 'autopay' && styles.selectedCard
            ]}
            onPress={() => handlePaymentMethodSelect('autopay')}
          >
            <View style={styles.methodHeader}>
              <CheckCircle size={24} color="#10B981" />
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>Auto-Pay</Text>
                <Text style={styles.methodDescription}>
                  Automatic renewal every 30 days
                </Text>
              </View>
              {selectedMethod === 'autopay' && (
                <CheckCircle size={24} color="#10B981" />
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentMethodCard,
              selectedMethod === 'bank' && styles.selectedCard
            ]}
            onPress={() => handlePaymentMethodSelect('bank')}
          >
            <View style={styles.methodHeader}>
              <Building2 size={24} color="#EF4444" />
              <View style={styles.methodInfo}>
                <Text style={styles.methodName}>Bank Transfer</Text>
                <Text style={styles.methodDescription}>
                  Direct bank transfer
                </Text>
              </View>
              {selectedMethod === 'bank' && (
                <CheckCircle size={24} color="#10B981" />
              )}
            </View>
            <View style={styles.bankDetails}>
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankLabel}>Account Number:</Text>
                <View style={styles.bankValueRow}>
                  <Text style={styles.bankValue}>{BANK_ACCOUNT}</Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(BANK_ACCOUNT)}
                    style={styles.copyButton}
                  >
                    <Copy size={16} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Section */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Payment Information</Text>
          <Text style={styles.infoText}>
            • All payments are secure and encrypted{'\n'}
            • Subscription will be activated immediately after successful payment{'\n'}
            • You can cancel your subscription anytime from profile settings{'\n'}
            • For bank transfers, activation may take up to 24 hours
          </Text>
        </View>
      </ScrollView>

      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>Processing payment...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  paymentMethodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  externalLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginTop: 8,
  },
  externalLinkText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginRight: 6,
  },
  bankDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  bankValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bankValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  copyButton: {
    padding: 4,
  },
  infoCard: {
    backgroundColor: '#F0F9FF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    fontWeight: '600',
  },
});

export default PaymentScreen;

