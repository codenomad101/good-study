import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart3,
  Users,
  FileText,
  Database,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  BookOpen,
  UserCheck,
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useAdminDashboardStats, useAdminCategories, useAdminQuestions, useAdminUsers, useAdminImportLogs } from '../../hooks/useAdmin';
import AppHeader from '../../components/AppHeader';
import { showToast } from '../../utils/toast';

export default function AdminScreen() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'dashboard' | 'questions' | 'categories' | 'users' | 'imports'>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Admin data hooks
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useAdminDashboardStats();
  const { data: categoriesData, isLoading: categoriesLoading, refetch: refetchCategories } = useAdminCategories();
  const { data: questionsData, isLoading: questionsLoading, refetch: refetchQuestions } = useAdminQuestions({
    categoryId: selectedCategory || undefined,
    limit: 50,
  });
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useAdminUsers();
  const { data: importLogsData, isLoading: importLogsLoading, refetch: refetchImportLogs } = useAdminImportLogs();

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchCategories(),
        refetchQuestions(),
        refetchUsers(),
        refetchImportLogs(),
      ]);
    } catch (error) {
      showToast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <AppHeader showLogo={true} extraTopSpacing={true} />
        <View style={styles.accessDeniedContainer}>
          <AlertCircle size={64} color="#EF4444" />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You need administrator privileges to access this page.
          </Text>
        </View>
      </View>
    );
  }

  const stats = statsData?.data as any;
  const categories = (categoriesData?.data as any) || [];
  const questions = (questionsData?.data as any) || [];
  const users = (usersData?.data as any) || [];
  const importLogs = (importLogsData?.data as any) || [];

  const renderDashboard = () => {
    if (statsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.dashboardContent}>
          <Text style={styles.sectionTitle}>Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Users size={24} color="#2563EB" />
              <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            
            <View style={styles.statCard}>
              <BookOpen size={24} color="#10B981" />
              <Text style={styles.statValue}>{stats?.totalQuestions || 0}</Text>
              <Text style={styles.statLabel}>Total Questions</Text>
            </View>
            
            <View style={styles.statCard}>
              <FileText size={24} color="#F59E0B" />
              <Text style={styles.statValue}>{stats?.totalCategories || 0}</Text>
              <Text style={styles.statLabel}>Categories</Text>
            </View>
            
            <View style={styles.statCard}>
              <Database size={24} color="#8B5CF6" />
              <Text style={styles.statValue}>{stats?.activeQuestions || 0}</Text>
              <Text style={styles.statLabel}>Active Questions</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Question Sources</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>
              ✓ Practice sessions use questions from database via API
            </Text>
            <Text style={styles.infoText}>
              ✓ Exam sessions use questions from database via API
            </Text>
            <Text style={styles.infoText}>
              ✓ Local JSON files are only used as fallback for some categories
            </Text>
            <Text style={styles.infoText}>
              ✓ Polity and Science questions come exclusively from database
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderQuestions = () => {
    if (questionsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      );
    }

    const questionsList = Array.isArray(questions) ? questions : (questions?.data || []);

    return (
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Questions ({questionsList.length})</Text>
          
          {categories.length > 0 && (
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Filter by Category:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
                <TouchableOpacity
                  style={[styles.filterChip, !selectedCategory && styles.filterChipActive]}
                  onPress={() => setSelectedCategory('')}
                >
                  <Text style={[styles.filterChipText, !selectedCategory && styles.filterChipTextActive]}>
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((cat: any) => (
                  <TouchableOpacity
                    key={cat.categoryId || cat.id}
                    style={[styles.filterChip, selectedCategory === (cat.categoryId || cat.id) && styles.filterChipActive]}
                    onPress={() => setSelectedCategory(cat.categoryId || cat.id)}
                  >
                    <Text style={[styles.filterChipText, selectedCategory === (cat.categoryId || cat.id) && styles.filterChipTextActive]}>
                      {cat.name || cat.slug}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {questionsList.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No questions found</Text>
            </View>
          ) : (
            <View style={styles.questionsList}>
              {questionsList.slice(0, 50).map((q: any, index: number) => (
                <View key={q.questionId || index} style={styles.questionCard}>
                  <View style={styles.questionHeader}>
                    <Text style={styles.questionNumber}>Q{index + 1}</Text>
                    <View style={[styles.statusBadge, q.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                      <Text style={styles.statusText}>{q.status || 'active'}</Text>
                    </View>
                  </View>
                  <Text style={styles.questionText} numberOfLines={3}>
                    {q.questionText || q.question || 'No question text'}
                  </Text>
                  <View style={styles.questionMeta}>
                    <Text style={styles.questionCategory}>{q.category || 'Unknown'}</Text>
                    <Text style={styles.questionSource}>
                      {q.source ? `Source: ${q.source}` : 'Database'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderCategories = () => {
    if (categoriesLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      );
    }

    const categoriesList = Array.isArray(categories) ? categories : (categories?.data || []);

    return (
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Categories ({categoriesList.length})</Text>
          
          {categoriesList.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No categories found</Text>
            </View>
          ) : (
            <View style={styles.categoriesList}>
              {categoriesList.map((cat: any) => (
                <View key={cat.categoryId || cat.id} style={styles.categoryCard}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>{cat.name || cat.slug}</Text>
                    <View style={[styles.statusBadge, cat.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                      <Text style={styles.statusText}>{cat.status || 'active'}</Text>
                    </View>
                  </View>
                  <Text style={styles.categorySlug}>Slug: {cat.slug}</Text>
                  <Text style={styles.categoryQuestions}>
                    Questions: {cat.totalQuestions || 0}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderUsers = () => {
    if (usersLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      );
    }

    const usersList = Array.isArray(users) ? users : (users?.data || []);

    return (
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Users ({usersList.length})</Text>
          
          {usersList.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No users found</Text>
            </View>
          ) : (
            <View style={styles.usersList}>
              {usersList.slice(0, 50).map((u: any) => (
                <View key={u.userId} style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <Text style={styles.userName}>{u.fullName || u.email}</Text>
                    <View style={[styles.roleBadge, u.role === 'admin' && styles.roleAdmin]}>
                      <Text style={styles.roleText}>{u.role || 'student'}</Text>
                    </View>
                  </View>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  <Text style={styles.userPlan}>Plan: {u.subscriptionType || 'free'}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderImports = () => {
    if (importLogsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      );
    }

    const logsList = Array.isArray(importLogs) ? importLogs : (importLogs?.data || []);

    return (
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Import Logs ({logsList.length})</Text>
          
          {logsList.length === 0 ? (
            <View style={styles.emptyState}>
              <Database size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No import logs found</Text>
            </View>
          ) : (
            <View style={styles.importsList}>
              {logsList.slice(0, 50).map((log: any, index: number) => (
                <View key={log.importId || index} style={styles.importCard}>
                  <View style={styles.importHeader}>
                    <Text style={styles.importCategory}>{log.categoryName || 'Unknown'}</Text>
                    <View style={[styles.statusBadge, log.status === 'success' ? styles.statusActive : styles.statusInactive]}>
                      <Text style={styles.statusText}>{log.status || 'pending'}</Text>
                    </View>
                  </View>
                  <Text style={styles.importDetails}>
                    Imported: {log.importedCount || 0} | Failed: {log.failedCount || 0}
                  </Text>
                  <Text style={styles.importDate}>
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'Unknown date'}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader showLogo={true} extraTopSpacing={true} />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'dashboard' && styles.tabActive]}
            onPress={() => setSelectedTab('dashboard')}
          >
            <BarChart3 size={18} color={selectedTab === 'dashboard' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.tabText, selectedTab === 'dashboard' && styles.tabTextActive]}>
              Dashboard
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'questions' && styles.tabActive]}
            onPress={() => setSelectedTab('questions')}
          >
            <FileText size={18} color={selectedTab === 'questions' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.tabText, selectedTab === 'questions' && styles.tabTextActive]}>
              Questions
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'categories' && styles.tabActive]}
            onPress={() => setSelectedTab('categories')}
          >
            <BookOpen size={18} color={selectedTab === 'categories' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.tabText, selectedTab === 'categories' && styles.tabTextActive]}>
              Categories
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'users' && styles.tabActive]}
            onPress={() => setSelectedTab('users')}
          >
            <Users size={18} color={selectedTab === 'users' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.tabText, selectedTab === 'users' && styles.tabTextActive]}>
              Users
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'imports' && styles.tabActive]}
            onPress={() => setSelectedTab('imports')}
          >
            <Database size={18} color={selectedTab === 'imports' ? '#2563EB' : '#6B7280'} />
            <Text style={[styles.tabText, selectedTab === 'imports' && styles.tabTextActive]}>
              Imports
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Content */}
      {selectedTab === 'dashboard' && renderDashboard()}
      {selectedTab === 'questions' && renderQuestions()}
      {selectedTab === 'categories' && renderCategories()}
      {selectedTab === 'users' && renderUsers()}
      {selectedTab === 'imports' && renderImports()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  accessDeniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  accessDeniedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  accessDeniedText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  tabContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabs: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#EFF6FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#2563EB',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  dashboardContent: {
    padding: 16,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  infoText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  categoryFilter: {
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  questionsList: {
    gap: 12,
  },
  questionCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  statusActive: {
    backgroundColor: '#D1FAE5',
  },
  statusInactive: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  questionText: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 20,
  },
  questionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  questionCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  questionSource: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  categoriesList: {
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categorySlug: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  categoryQuestions: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  roleAdmin: {
    backgroundColor: '#FEF3C7',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  userPlan: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  importsList: {
    gap: 12,
  },
  importCard: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  importHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  importCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  importDetails: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  importDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});

