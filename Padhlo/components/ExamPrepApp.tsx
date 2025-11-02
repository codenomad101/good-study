import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Award,
  CheckCircle,
  Bell,
  Calendar,
  Users,
  FileText,
  Play,
  LogOut,
} from 'lucide-react-native';
import { responsiveValues, scaleWidth, scaleHeight, scaleFont } from '../utils/responsive';

interface ExamPrepAppProps {
  onLogout: () => void;
  activeTab?: string;
}

const ExamPrepApp: React.FC<ExamPrepAppProps> = ({ onLogout, activeTab = 'home' }) => {
  const insets = useSafeAreaInsets();
  const [selectedExam, setSelectedExam] = useState('SSC CGL');

  const exams = ['SSC CGL', 'RRB NTPC', 'IBPS PO', 'State PSC', 'SSC CHSL'];
  
  const dailyTopics = [
    { subject: 'Quantitative Aptitude', progress: 65, time: '12 min', questions: 15 },
    { subject: 'General Awareness', progress: 80, time: '10 min', questions: 20 },
    { subject: 'English', progress: 45, time: '15 min', questions: 12 },
    { subject: 'Reasoning', progress: 90, time: '8 min', questions: 10 }
  ];

  const stats = {
    streak: 12,
    totalQuestions: 1240,
    accuracy: 76,
    rank: 156
  };

  const renderHome = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Streak Card */}
      <View style={styles.streakCard}>
        <View style={styles.streakHeader}>
          <View>
            <Text style={styles.streakDays}>{stats.streak} Days</Text>
            <Text style={styles.streakSubtext}>Learning Streak 🔥</Text>
          </View>
          <Trophy size={48} color="#FCD34D" />
        </View>
        <Text style={styles.streakDescription}>Keep it up! You're in top 5% learners</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Target size={24} color="#2563EB" />
          <Text style={styles.statNumber}>{stats.totalQuestions}</Text>
          <Text style={styles.statLabel}>Questions Solved</Text>
        </View>
        <View style={styles.statCard}>
          <TrendingUp size={24} color="#059669" />
          <Text style={styles.statNumber}>{stats.accuracy}%</Text>
          <Text style={styles.statLabel}>Accuracy</Text>
        </View>
        <View style={styles.statCard}>
          <Award size={24} color="#7C3AED" />
          <Text style={styles.statNumber}>#{stats.rank}</Text>
          <Text style={styles.statLabel}>Your Rank</Text>
        </View>
      </View>

      {/* Today's Practice */}
      <View style={styles.practiceCard}>
        <View style={styles.practiceHeader}>
          <Text style={styles.practiceTitle}>Today's Practice</Text>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>15 Oct 2025</Text>
          </View>
        </View>
        
        <View style={styles.topicsContainer}>
          {dailyTopics.map((topic, idx) => (
            <View key={idx} style={styles.topicCard}>
              <View style={styles.topicHeader}>
                <View style={styles.topicInfo}>
                  <Text style={styles.topicTitle}>{topic.subject}</Text>
                  <View style={styles.topicMeta}>
                    <View style={styles.metaItem}>
                      <Clock size={12} color="#6B7280" />
                      <Text style={styles.metaText}> {topic.time}</Text>
                    </View>
                    <Text style={styles.metaText}>{topic.questions} questions</Text>
                  </View>
                </View>
                {topic.progress === 100 ? (
                  <CheckCircle size={20} color="#10B981" />
                ) : (
                  <TouchableOpacity style={styles.startButton}>
                    <Text style={styles.startButtonText}>Start</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[styles.progressFill, { width: `${topic.progress}%` }]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Previous Year Papers */}
      <View style={styles.papersCard}>
        <View style={styles.papersHeader}>
          <View>
            <Text style={styles.papersTitle}>Previous Year Papers</Text>
            <Text style={styles.papersSubtext}>50+ papers available</Text>
          </View>
          <FileText size={40} color="#C7D2FE" />
        </View>
        <TouchableOpacity style={styles.papersButton}>
          <Text style={styles.papersButtonText}>Browse Papers</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderPractice = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Practice by Topic</Text>
      
      {['Quantitative Aptitude', 'Reasoning', 'General Awareness', 'English', 'Computer Knowledge'].map((subject, idx) => (
        <View key={idx} style={styles.subjectCard}>
          <View style={styles.subjectInfo}>
            <Text style={styles.subjectTitle}>{subject}</Text>
            <Text style={styles.subjectSubtext}>250+ questions</Text>
          </View>
          <TouchableOpacity style={styles.practiceButton}>
            <Text style={styles.practiceButtonText}>Practice</Text>
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.mockTestCard}>
        <Play size={24} color="#D97706" />
        <View style={styles.mockTestInfo}>
          <Text style={styles.mockTestTitle}>Mock Test Series</Text>
          <Text style={styles.mockTestDescription}>Full-length mock tests with detailed analysis</Text>
          <TouchableOpacity style={styles.mockTestButton}>
            <Text style={styles.mockTestButtonText}>Start Mock Test</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderProgress = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Your Progress</Text>
      
      <View style={styles.progressCard}>
        <Text style={styles.cardTitle}>Weekly Performance</Text>
        <View style={styles.weeklyContainer}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
            <View key={idx} style={styles.dayItem}>
              <Text style={styles.dayLabel}>{day}</Text>
              <View style={styles.dayProgressBar}>
                <View 
                  style={[styles.dayProgressFill, { width: `${Math.random() * 100}%` }]}
                />
              </View>
              <Text style={styles.dayTime}>{Math.floor(Math.random() * 50) + 10} min</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.progressCard}>
        <Text style={styles.cardTitle}>Subject-wise Accuracy</Text>
        <View style={styles.accuracyContainer}>
          {dailyTopics.map((topic, idx) => (
            <View key={idx} style={styles.accuracyItem}>
              <View style={styles.accuracyHeader}>
                <Text style={styles.accuracyLabel}>{topic.subject}</Text>
                <Text style={styles.accuracyValue}>{topic.progress}%</Text>
              </View>
              <View style={styles.accuracyBar}>
                <View 
                  style={[styles.accuracyFill, { width: `${topic.progress}%` }]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.streakProgressCard}>
        <Calendar size={32} color="#FFFFFF" />
        <Text style={styles.streakProgressTitle}>Study Streak: {stats.streak} days</Text>
        <Text style={styles.streakProgressDescription}>You've practiced for 12 days straight! Keep going!</Text>
      </View>
    </ScrollView>
  );

  const renderCommunity = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Community</Text>
      
      <View style={styles.communityCard}>
        <Users size={32} color="#2563EB" />
        <Text style={styles.communityTitle}>Study Groups</Text>
        <Text style={styles.communityDescription}>Join study groups and connect with fellow learners</Text>
        <TouchableOpacity style={styles.communityButton}>
          <Text style={styles.communityButtonText}>Join Groups</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.communityCard}>
        <Award size={32} color="#F59E0B" />
        <Text style={styles.communityTitle}>Leaderboard</Text>
        <Text style={styles.communityDescription}>Compete with other learners and climb the ranks</Text>
        <TouchableOpacity style={styles.communityButton}>
          <Text style={styles.communityButtonText}>View Rankings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.communityCard}>
        <FileText size={32} color="#10B981" />
        <Text style={styles.communityTitle}>Discussion Forum</Text>
        <Text style={styles.communityDescription}>Ask questions and share knowledge with the community</Text>
        <TouchableOpacity style={styles.communityButton}>
          <Text style={styles.communityButtonText}>Start Discussion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'home': return renderHome();
      case 'practice': return renderPractice();
      case 'progress': return renderProgress();
      case 'community': return renderCommunity();
      default: return renderHome();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2563EB" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + responsiveValues.padding.large }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerSubtext}>Preparing for</Text>
            <Text style={styles.headerTitle}>{selectedExam}</Text>
          </View>
          <View style={styles.headerActions}>
            <View style={styles.notificationContainer}>
              <Bell size={24} color="#FFFFFF" />
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>3</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
              <LogOut size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#2563EB',
    paddingHorizontal: responsiveValues.padding.large,
    paddingBottom: responsiveValues.padding.xlarge,
    borderBottomLeftRadius: responsiveValues.borderRadius.xlarge,
    borderBottomRightRadius: responsiveValues.borderRadius.xlarge,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerSubtext: {
    fontSize: responsiveValues.fontSize.sm,
    color: '#BFDBFE',
  },
  headerTitle: {
    fontSize: responsiveValues.fontSize.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  notificationContainer: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  logoutButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: responsiveValues.padding.medium,
    marginTop: -responsiveValues.padding.small,
  },
  content: {
    flex: 1,
    paddingTop: responsiveValues.padding.small,
  },
  streakCard: {
    backgroundColor: '#F97316',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  streakDays: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  streakSubtext: {
    fontSize: 14,
    color: '#FED7AA',
  },
  streakDescription: {
    fontSize: 12,
    color: '#FED7AA',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 10,
    color: '#2563EB',
    marginTop: 4,
  },
  practiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  practiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  practiceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  dateBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 10,
    color: '#065F46',
  },
  topicsContainer: {
    gap: 12,
  },
  topicCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  topicInfo: {
    flex: 1,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  topicMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  startButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    height: 8,
  },
  progressFill: {
    backgroundColor: '#2563EB',
    borderRadius: 4,
    height: 8,
  },
  papersCard: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    padding: 20,
    marginBottom: 80,
  },
  papersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  papersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  papersSubtext: {
    fontSize: 12,
    color: '#C7D2FE',
    marginTop: 4,
  },
  papersButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  papersButtonText: {
    color: '#4F46E5',
    fontSize: 12,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  subjectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subjectInfo: {
    flex: 1,
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  subjectSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  practiceButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  practiceButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  mockTestCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  mockTestInfo: {
    flex: 1,
  },
  mockTestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  mockTestDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  mockTestButton: {
    backgroundColor: '#D97706',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  mockTestButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  weeklyContainer: {
    gap: 12,
  },
  dayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayLabel: {
    width: 32,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  dayProgressBar: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    height: 12,
  },
  dayProgressFill: {
    backgroundColor: '#10B981',
    borderRadius: 6,
    height: 12,
  },
  dayTime: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    width: 40,
    textAlign: 'right',
  },
  accuracyContainer: {
    gap: 16,
  },
  accuracyItem: {
    gap: 8,
  },
  accuracyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accuracyLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  accuracyValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  accuracyBar: {
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    height: 8,
  },
  accuracyFill: {
    backgroundColor: '#2563EB',
    borderRadius: 4,
    height: 8,
  },
  streakProgressCard: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 20,
    marginBottom: 80,
  },
  streakProgressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  streakProgressDescription: {
    fontSize: 12,
    color: '#A7F3D0',
  },
  communityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  communityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 12,
    marginBottom: 8,
  },
  communityDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  communityButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  communityButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ExamPrepApp;
