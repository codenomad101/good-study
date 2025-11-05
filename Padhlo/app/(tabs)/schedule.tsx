import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '@/components/AppHeader';
import {
  Plus,
  Clock,
  CheckCircle,
  Edit,
  Trash2,
  X,
  Calendar as CalendarIcon,
  BookOpen,
  Trophy,
  TrendingUp,
  Play,
} from 'lucide-react-native';
import {
  useSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  useStudyLogs,
  useLogStudySession,
  useReminders,
  useCreateReminder,
  useUpdateReminder,
  useDeleteReminder,
} from '@/hooks/useApi';
import { showToast } from '@/utils/toast';

const SUBJECTS = [
  'History',
  'Geography',
  'English',
  'Aptitude',
  'Economy',
  'GK',
  'Agriculture',
  'Marathi',
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120]; // minutes

// Default MPSC exam dates
const DEFAULT_MPSC_EXAMS = [
  { name: 'MPSC Group B (Non-Gazetted) Prelims', date: '2025-01-05' },
  { name: 'MPSC Group C Prelims', date: '2025-06-01' },
  { name: 'MPSC Group C Mains', date: '2026-01-07' },
  { name: 'MPSC Rajyaseva Prelims', date: '2025-11-09' },
  { name: 'MPSC Group B Mains', date: '2026-12-05' },
];

interface Schedule {
  scheduleId: string;
  subjectName: string;
  durationMinutes: number;
  preferredTime?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Reminder {
  reminderId: string;
  examName: string;
  examDate: string;
  examTime?: string;
  description?: string;
  reminderBeforeDays: number;
  reminderEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ScheduleScreen() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'calendar'>('schedule');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [selectedTime, setSelectedTime] = useState('');
  const [reminderExamName, setReminderExamName] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [reminderDescription, setReminderDescription] = useState('');
  const [activeSession, setActiveSession] = useState<Schedule | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  const { data: schedulesResponse, isLoading, refetch } = useSchedules({ active: 'true' });
  const { data: logsResponse } = useStudyLogs({ limit: '10' });
  const { data: remindersResponse, refetch: refetchReminders } = useReminders({ upcoming: 'true' });
  const createScheduleMutation = useCreateSchedule();
  const updateScheduleMutation = useUpdateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();
  const logStudySessionMutation = useLogStudySession();
  const createReminderMutation = useCreateReminder();
  const updateReminderMutation = useUpdateReminder();
  const deleteReminderMutation = useDeleteReminder();

  const schedules = schedulesResponse?.data || [];
  const logs = logsResponse?.data || [];
  const summary = logsResponse?.summary || [];
  const reminders = remindersResponse?.data || [];

  const openScheduleModal = (schedule?: Schedule) => {
    if (schedule) {
      setEditingSchedule(schedule);
      setSelectedSubject(schedule.subjectName);
      setSelectedDuration(schedule.durationMinutes);
      setSelectedTime(schedule.preferredTime || '');
    } else {
      setEditingSchedule(null);
      setSelectedSubject('');
      setSelectedDuration(30);
      setSelectedTime('');
    }
    setShowScheduleModal(true);
  };

  const closeScheduleModal = () => {
    setShowScheduleModal(false);
    setEditingSchedule(null);
    setSelectedSubject('');
    setSelectedDuration(30);
    setSelectedTime('');
  };

  const handleSaveSchedule = async () => {
    if (!selectedSubject) {
      showToast.error('Please select a subject');
      return;
    }

    try {
      if (editingSchedule) {
        await updateScheduleMutation.mutateAsync({
          scheduleId: editingSchedule.scheduleId,
          schedule: {
            subjectName: selectedSubject,
            durationMinutes: selectedDuration,
            preferredTime: selectedTime || undefined,
            isActive: true,
          },
        });
        showToast.success('Schedule updated successfully');
      } else {
        await createScheduleMutation.mutateAsync({
          subjectName: selectedSubject,
          durationMinutes: selectedDuration,
          preferredTime: selectedTime || undefined,
          isActive: true,
        });
        showToast.success('Schedule created successfully');
      }
      closeScheduleModal();
      await refetch();
    } catch (error: any) {
      console.error('[Schedule] Error saving schedule:', error);
      showToast.error(error?.message || 'Failed to save schedule');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to delete this schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteScheduleMutation.mutateAsync(scheduleId);
              showToast.success('Schedule deleted successfully');
              await refetch();
            } catch (error: any) {
              console.error('[Schedule] Error deleting schedule:', error);
              showToast.error(error?.message || 'Failed to delete schedule');
            }
          },
        },
      ]
    );
  };

  const handleStartSession = (schedule: Schedule) => {
    setActiveSession(schedule);
    setSessionStartTime(new Date());
    showToast.success(`Started ${schedule.subjectName} study session`);
  };

  const handleCompleteSession = async () => {
    if (!activeSession || !sessionStartTime) return;

    const endTime = new Date();
    const durationMs = endTime.getTime() - sessionStartTime.getTime();
    const durationMinutes = Math.round(durationMs / 60000);

    if (durationMinutes < 1) {
      showToast.error('Session too short. Minimum 1 minute required.');
      return;
    }

    try {
      await logStudySessionMutation.mutateAsync({
        scheduleId: activeSession.scheduleId,
        subjectName: activeSession.subjectName,
        durationMinutes,
        completed: true,
      });

      showToast.success(
        `Great! You studied ${activeSession.subjectName} for ${durationMinutes} minutes! 🎉`
      );

      setActiveSession(null);
      setSessionStartTime(null);
      await refetch();
    } catch (error: any) {
      console.error('[Schedule] Error logging session:', error);
      showToast.error(error?.message || 'Failed to log session');
    }
  };

  const getTotalHours = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleAddMPSCExams = async () => {
    try {
      let added = 0;
      for (const exam of DEFAULT_MPSC_EXAMS) {
        try {
          await createReminderMutation.mutateAsync({
            examName: exam.name,
            examDate: exam.date,
            reminderBeforeDays: 7,
            reminderEnabled: true,
          });
          added++;
        } catch (error) {
          console.error(`Error adding ${exam.name}:`, error);
        }
      }
      if (added > 0) {
        showToast.success(`Added ${added} exam reminders successfully!`);
        await refetchReminders();
      }
    } catch (error: any) {
      console.error('[Schedule] Error adding MPSC exams:', error);
      showToast.error('Failed to add some exam reminders');
    }
  };

  const openReminderModal = (reminder?: Reminder) => {
    if (reminder) {
      setEditingReminder(reminder);
      setReminderExamName(reminder.examName);
      setReminderDate(reminder.examDate);
      setReminderTime(reminder.examTime || '');
      setReminderDescription(reminder.description || '');
    } else {
      setEditingReminder(null);
      setReminderExamName('');
      setReminderDate('');
      setReminderTime('');
      setReminderDescription('');
    }
    setShowReminderModal(true);
  };

  const closeReminderModal = () => {
    setShowReminderModal(false);
    setEditingReminder(null);
    setReminderExamName('');
    setReminderDate('');
    setReminderTime('');
    setReminderDescription('');
  };

  const handleSaveReminder = async () => {
    if (!reminderExamName || !reminderDate) {
      showToast.error('Please enter exam name and date');
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(reminderDate)) {
      showToast.error('Please enter date in YYYY-MM-DD format');
      return;
    }

    try {
      if (editingReminder) {
        await updateReminderMutation.mutateAsync({
          reminderId: editingReminder.reminderId,
          reminder: {
            examName: reminderExamName,
            examDate: reminderDate,
            examTime: reminderTime || undefined,
            description: reminderDescription || undefined,
          },
        });
        showToast.success('Exam reminder updated successfully');
      } else {
        await createReminderMutation.mutateAsync({
          examName: reminderExamName,
          examDate: reminderDate,
          examTime: reminderTime || undefined,
          description: reminderDescription || undefined,
          reminderBeforeDays: 7,
          reminderEnabled: true,
        });
        showToast.success('Exam reminder created successfully');
      }
      closeReminderModal();
      await refetchReminders();
    } catch (error: any) {
      console.error('[Schedule] Error saving reminder:', error);
      showToast.error(error?.message || 'Failed to save reminder');
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this exam reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteReminderMutation.mutateAsync(reminderId);
              showToast.success('Reminder deleted successfully');
              await refetchReminders();
            } catch (error: any) {
              console.error('[Schedule] Error deleting reminder:', error);
              showToast.error(error?.message || 'Failed to delete reminder');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil === 0) return 'Today';
    if (daysUntil === 1) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title="Schedule" showLogo={true} extraTopSpacing={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading schedule...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader title="Schedule" showLogo={true} extraTopSpacing={true} />
      
      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'schedule' && styles.activeTab]}
          onPress={() => setActiveTab('schedule')}
        >
          <BookOpen size={18} color={activeTab === 'schedule' ? '#2563EB' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'schedule' && styles.activeTabText]}>
            Study Schedule
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          onPress={() => setActiveTab('calendar')}
        >
          <CalendarIcon size={18} color={activeTab === 'calendar' ? '#2563EB' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText]}>
            Exam Calendar
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Active Session */}
        {activeSession && sessionStartTime && (
          <View style={styles.activeSessionCard}>
            <View style={styles.activeSessionHeader}>
              <View>
                <Text style={styles.activeSessionTitle}>Active Session</Text>
                <Text style={styles.activeSessionSubject}>{activeSession.subjectName}</Text>
                <Text style={styles.activeSessionDuration}>
                  Target: {activeSession.durationMinutes} minutes
                </Text>
              </View>
              <Clock size={32} color="#2563EB" />
            </View>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleCompleteSession}
            >
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.completeButtonText}>Complete Session</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Study Summary */}
        {summary.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Study Summary</Text>
            <View style={styles.summaryGrid}>
              {summary.map((item: any, index: number) => (
                <View key={index} style={styles.summaryCard}>
                  <Text style={styles.summarySubject}>{item.subjectName}</Text>
                  <Text style={styles.summaryTime}>
                    {getTotalHours(Number(item.totalMinutes) || 0)}
                  </Text>
                  <Text style={styles.summarySessions}>
                    {item.totalSessions || 0} sessions
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Study Schedule Tab */}
        {activeTab === 'schedule' && (
          <>
            {/* Active Schedules */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Schedule</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => openScheduleModal()}
                >
                  <Plus size={20} color="#2563EB" />
                </TouchableOpacity>
              </View>

          {schedules.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>No schedule set</Text>
              <Text style={styles.emptyStateSubtext}>
                Add a study schedule to get started
              </Text>
            </View>
          ) : (
            schedules.map((schedule: Schedule) => (
              <View key={schedule.scheduleId} style={styles.scheduleCard}>
                <View style={styles.scheduleInfo}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.scheduleSubject}>{schedule.subjectName}</Text>
                    {!activeSession && (
                      <View style={styles.scheduleActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => openScheduleModal(schedule)}
                        >
                          <Edit size={16} color="#6B7280" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteSchedule(schedule.scheduleId)}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <View style={styles.scheduleDetails}>
                    <View style={styles.scheduleDetailItem}>
                      <Clock size={16} color="#6B7280" />
                      <Text style={styles.scheduleDetailText}>
                        {schedule.durationMinutes} minutes
                      </Text>
                    </View>
                    {schedule.preferredTime && (
                      <View style={styles.scheduleDetailItem}>
                        <CalendarIcon size={16} color="#6B7280" />
                        <Text style={styles.scheduleDetailText}>
                          {schedule.preferredTime}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                {!activeSession && (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => handleStartSession(schedule)}
                  >
                    <Play size={16} color="#FFFFFF" />
                    <Text style={styles.startButtonText}>Start</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

            {/* Recent Activity */}
            {logs.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                {logs.slice(0, 5).map((log: any, index: number) => (
                  <View key={index} style={styles.logCard}>
                    <View style={styles.logInfo}>
                      <Text style={styles.logSubject}>{log.subjectName}</Text>
                      <Text style={styles.logDate}>
                        {new Date(log.sessionTime).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text style={styles.logDuration}>
                      {getTotalHours(log.durationMinutes)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Exam Calendar Tab */}
        {activeTab === 'calendar' && (
          <>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Exam Reminders</Text>
                <View style={styles.calendarActions}>
                  {reminders.length === 0 && (
                    <TouchableOpacity
                      style={styles.quickAddButton}
                      onPress={handleAddMPSCExams}
                    >
                      <Text style={styles.quickAddText}>Add MPSC Exams</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => openReminderModal()}
                  >
                    <Plus size={20} color="#2563EB" />
                  </TouchableOpacity>
                </View>
              </View>

              {reminders.length === 0 ? (
                <View style={styles.emptyState}>
                  <CalendarIcon size={48} color="#9CA3AF" />
                  <Text style={styles.emptyStateText}>No exam reminders</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Add exam dates to get reminders
                  </Text>
                  <TouchableOpacity
                    style={styles.quickAddButton}
                    onPress={handleAddMPSCExams}
                  >
                    <Text style={styles.quickAddButtonText}>Quick Add MPSC Exams</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                reminders.map((reminder: Reminder) => {
                  const examDate = new Date(reminder.examDate);
                  const today = new Date();
                  const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <View key={reminder.reminderId} style={styles.reminderCard}>
                      <View style={styles.reminderContent}>
                        <View style={styles.reminderHeader}>
                          <View style={styles.reminderInfo}>
                            <Text style={styles.reminderExamName}>{reminder.examName}</Text>
                            <View style={styles.reminderDateRow}>
                              <CalendarIcon size={14} color="#6B7280" />
                              <Text style={styles.reminderDate}>
                                {formatDate(reminder.examDate)}
                              </Text>
                              {reminder.examTime && (
                                <Text style={styles.reminderTime}> • {reminder.examTime}</Text>
                              )}
                              {daysUntil > 0 && (
                                <Text style={styles.reminderDaysAway}>
                                  {' '}({daysUntil} {daysUntil === 1 ? 'day' : 'days'} away)
                                </Text>
                              )}
                            </View>
                            {reminder.description && (
                              <Text style={styles.reminderDescription} numberOfLines={2}>
                                {reminder.description}
                              </Text>
                            )}
                          </View>
                          <View style={styles.reminderActions}>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => openReminderModal(reminder)}
                            >
                              <Edit size={16} color="#6B7280" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.actionButton}
                              onPress={() => handleDeleteReminder(reminder.reminderId)}
                            >
                              <Trash2 size={16} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Reminder Modal */}
      <Modal
        visible={showReminderModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeReminderModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingReminder ? 'Edit Exam Reminder' : 'New Exam Reminder'}
            </Text>
            <TouchableOpacity onPress={closeReminderModal}>
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Exam Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Exam Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g., MPSC Group B Prelims"
                value={reminderExamName}
                onChangeText={setReminderExamName}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Exam Date */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Exam Date * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2025-01-05"
                value={reminderDate}
                onChangeText={setReminderDate}
                placeholderTextColor="#9CA3AF"
              />
              <Text style={styles.inputHint}>
                Format: YYYY-MM-DD (e.g., 2025-01-05)
              </Text>
            </View>

            {/* Exam Time (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Exam Time (Optional - HH:MM)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="09:00"
                value={reminderTime}
                onChangeText={setReminderTime}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Description (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Add any additional notes..."
                value={reminderDescription}
                onChangeText={setReminderDescription}
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveReminder}
              disabled={createReminderMutation.isPending || updateReminderMutation.isPending}
            >
              {(createReminderMutation.isPending || updateReminderMutation.isPending) ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Reminder</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Schedule Modal */}
      <Modal
        visible={showScheduleModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeScheduleModal}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
            </Text>
            <TouchableOpacity onPress={closeScheduleModal}>
              <X size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Subject Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject</Text>
              <View style={styles.subjectGrid}>
                {SUBJECTS.map((subject) => (
                  <TouchableOpacity
                    key={subject}
                    style={[
                      styles.subjectButton,
                      selectedSubject === subject && styles.subjectButtonActive,
                    ]}
                    onPress={() => setSelectedSubject(subject)}
                  >
                    <Text
                      style={[
                        styles.subjectButtonText,
                        selectedSubject === subject && styles.subjectButtonTextActive,
                      ]}
                    >
                      {subject}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Duration Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Duration (minutes)</Text>
              <View style={styles.durationGrid}>
                {DURATION_OPTIONS.map((duration) => (
                  <TouchableOpacity
                    key={duration}
                    style={[
                      styles.durationButton,
                      selectedDuration === duration && styles.durationButtonActive,
                    ]}
                    onPress={() => setSelectedDuration(duration)}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        selectedDuration === duration && styles.durationButtonTextActive,
                      ]}
                    >
                      {duration}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time Selection (Optional) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Preferred Time (Optional)</Text>
              <TextInput
                style={styles.timeInput}
                placeholder="HH:MM (e.g., 09:00)"
                value={selectedTime}
                onChangeText={setSelectedTime}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveSchedule}
              disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
            >
              {(createScheduleMutation.isPending || updateScheduleMutation.isPending) ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Schedule</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  activeSessionCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2563EB',
  },
  activeSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activeSessionTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  activeSessionSubject: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  activeSessionDuration: {
    fontSize: 14,
    color: '#6B7280',
  },
  completeButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  addButton: {
    padding: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summarySubject: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  summarySessions: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  scheduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scheduleSubject: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scheduleActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 4,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleDetails: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  scheduleDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleDetailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  startButton: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  logCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logInfo: {
    flex: 1,
  },
  logSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  logDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  logDuration: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2563EB',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  subjectButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  subjectButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  subjectButtonTextActive: {
    color: '#FFFFFF',
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  durationButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  durationButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  durationButtonTextActive: {
    color: '#FFFFFF',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  saveButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#DBEAFE',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#2563EB',
    fontWeight: '600',
  },
  calendarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickAddButton: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  quickAddText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
  },
  quickAddButtonText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 12,
  },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderContent: {
    flex: 1,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderExamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  reminderDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reminderDate: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  reminderTime: {
    fontSize: 13,
    color: '#6B7280',
  },
  reminderDaysAway: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reminderDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  reminderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});

