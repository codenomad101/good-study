import { pgTable, serial, varchar, timestamp, boolean, text, integer, decimal, uuid, date, time, json, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enable UUID extension (this should be done in migration)
// CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

// Enums
export const subscriptionTypeEnum = pgEnum('subscription_type', ['free', 'premium', 'premium_plus']);
export const genderEnum = pgEnum('gender', ['male', 'female', 'other']);
export const difficultyLevelEnum = pgEnum('difficulty_level', ['easy', 'medium', 'hard']);
export const questionTypeEnum = pgEnum('question_type', ['mcq', 'numerical', 'true_false', 'fill_blank']);
export const testStatusEnum = pgEnum('test_status', ['not_started', 'in_progress', 'completed', 'abandoned']);
export const masteryLevelEnum = pgEnum('mastery_level', ['beginner', 'intermediate', 'advanced', 'expert']);
export const testTypeEnum = pgEnum('test_type', ['full_length', 'sectional', 'topic_wise', 'previous_year', 'daily_practice']);
export const sessionTypeEnum = pgEnum('session_type', ['daily', 'custom', 'revision']);
export const materialTypeEnum = pgEnum('material_type', ['pdf', 'video', 'article', 'formula_sheet', 'shortcut']);
export const importanceEnum = pgEnum('importance', ['low', 'medium', 'high', 'critical']);
export const achievementTypeEnum = pgEnum('achievement_type', ['streak', 'questions', 'tests', 'accuracy', 'special']);
export const notificationTypeEnum = pgEnum('notification_type', ['practice_reminder', 'test_available', 'achievement', 'streak_alert', 'community', 'general']);
export const transactionStatusEnum = pgEnum('transaction_status', ['pending', 'success', 'failed', 'refunded']);
export const transactionTypeEnum = pgEnum('transaction_type', ['subscription', 'test_purchase', 'material_purchase', 'coins']);
export const practiceCategoryEnum = pgEnum('practice_category', [
  'economy',
  'gk',
  'history',
  'geography',
  'english',
  'aptitude',
  'agriculture',
  'marathi',
  'polity',
  'current-affairs'
]);
export const practiceStatusEnum = pgEnum('practice_status', ['in_progress', 'completed', 'abandoned']);
export const examStatusEnum = pgEnum('exam_status', ['not_started', 'in_progress', 'completed', 'abandoned']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'student', 'moderator']);
export const categoryStatusEnum = pgEnum('category_status', ['active', 'inactive', 'draft']);
export const questionStatusEnum = pgEnum('question_status', ['active', 'inactive', 'draft']);

// Users table
export const users = pgTable('users', {
  userId: uuid('user_id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 15 }).unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').default('student'),
  profilePictureUrl: text('profile_picture_url'),
  dateOfBirth: date('date_of_birth'),
  gender: genderEnum('gender'),
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('en'),
  
  // Subscription details
  subscriptionType: subscriptionTypeEnum('subscription_type').default('free'),
  subscriptionStartDate: timestamp('subscription_start_date'),
  subscriptionEndDate: timestamp('subscription_end_date'),
  
  // Gamification
  totalPoints: integer('total_points').default(0),
  level: integer('level').default(1),
  coins: integer('coins').default(0),
  
  // Activity tracking
  currentStreak: integer('current_streak').default(0),
  longestStreak: integer('longest_streak').default(0),
  lastActivityDate: date('last_activity_date'),
  totalStudyTimeMinutes: integer('total_study_time_minutes').default(0),
  
  // Practice session tracking
  totalPracticeSessions: integer('total_practice_sessions').default(0),
  totalPracticeScore: integer('total_practice_score').default(0),
  weeklyPracticeScore: integer('weekly_practice_score').default(0),
  monthlyPracticeScore: integer('monthly_practice_score').default(0),
  lastPracticeDate: timestamp('last_practice_date'),
  weeklyPracticeCount: integer('weekly_practice_count').default(0),
  monthlyPracticeCount: integer('monthly_practice_count').default(0),
  
  // Account status
  isActive: boolean('is_active').default(true),
  isVerified: boolean('is_verified').default(false),
  emailVerifiedAt: timestamp('email_verified_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLoginAt: timestamp('last_login_at'),
});

// Exams table
export const exams = pgTable('exams', {
  examId: uuid('exam_id').primaryKey().defaultRandom(),
  examName: varchar('exam_name', { length: 100 }).notNull(),
  examCode: varchar('exam_code', { length: 20 }).notNull().unique(),
  description: text('description'),
  examPattern: text('exam_pattern'),
  totalMarks: integer('total_marks'),
  durationMinutes: integer('duration_minutes'),
  negativeMarking: boolean('negative_marking').default(false),
  negativeMarksRatio: decimal('negative_marks_ratio', { precision: 3, scale: 2 }).default('0.25'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Subjects table
export const subjects = pgTable('subjects', {
  subjectId: uuid('subject_id').primaryKey().defaultRandom(),
  examId: uuid('exam_id').references(() => exams.examId, { onDelete: 'cascade' }).notNull(),
  subjectName: varchar('subject_name', { length: 100 }).notNull(),
  subjectCode: varchar('subject_code', { length: 20 }).notNull(),
  weightagePercentage: decimal('weightage_percentage', { precision: 5, scale: 2 }),
  totalQuestions: integer('total_questions'),
  displayOrder: integer('display_order'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Topics table
export const topics = pgTable('topics', {
  topicId: uuid('topic_id').primaryKey().defaultRandom(),
  subjectId: uuid('subject_id').references(() => subjects.subjectId, { onDelete: 'cascade' }).notNull(),
  topicName: varchar('topic_name', { length: 200 }).notNull(),
  difficultyLevel: difficultyLevelEnum('difficulty_level'),
  estimatedTimeMinutes: integer('estimated_time_minutes'),
  parentTopicId: uuid('parent_topic_id'),
  displayOrder: integer('display_order'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Questions table
export const questions = pgTable('questions', {
  questionId: uuid('question_id').primaryKey().defaultRandom(),
  topicId: uuid('topic_id').references(() => topics.topicId, { onDelete: 'cascade' }).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.subjectId, { onDelete: 'cascade' }).notNull(),
  examId: uuid('exam_id').references(() => exams.examId, { onDelete: 'cascade' }).notNull(),
  
  questionText: text('question_text').notNull(),
  questionImageUrl: text('question_image_url'),
  questionType: questionTypeEnum('question_type').default('mcq'),
  
  difficultyLevel: difficultyLevelEnum('difficulty_level'),
  marks: decimal('marks', { precision: 4, scale: 2 }).default('1.00'),
  negativeMarks: decimal('negative_marks', { precision: 4, scale: 2 }).default('0.25'),
  
  // Options for MCQ
  optionA: text('option_a'),
  optionB: text('option_b'),
  optionC: text('option_c'),
  optionD: text('option_d'),
  optionE: text('option_e'),
  
  correctAnswer: varchar('correct_answer', { length: 10 }).notNull(),
  detailedSolution: text('detailed_solution'),
  solutionVideoUrl: text('solution_video_url'),
  hint: text('hint'),
  
  // Metadata
  yearAppeared: integer('year_appeared'),
  source: varchar('source', { length: 100 }),
  timesAttempted: integer('times_attempted').default(0),
  timesCorrect: integer('times_correct').default(0),
  averageTimeSeconds: integer('average_time_seconds'),
  
  language: varchar('language', { length: 10 }).default('en'),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by').references(() => users.userId),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Exam Preferences table
export const userExamPreferences = pgTable('user_exam_preferences', {
  preferenceId: uuid('preference_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  examId: uuid('exam_id').references(() => exams.examId, { onDelete: 'cascade' }).notNull(),
  targetExamDate: date('target_exam_date'),
  dailyStudyGoalMinutes: integer('daily_study_goal_minutes').default(30),
  isPrimaryExam: boolean('is_primary_exam').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Test Templates table
export const testTemplates = pgTable('test_templates', {
  templateId: uuid('template_id').primaryKey().defaultRandom(),
  examId: uuid('exam_id').references(() => exams.examId, { onDelete: 'cascade' }).notNull(),
  templateName: varchar('template_name', { length: 200 }).notNull(),
  testType: testTypeEnum('test_type'),
  
  totalQuestions: integer('total_questions').notNull(),
  totalMarks: decimal('total_marks', { precision: 6, scale: 2 }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  
  isFree: boolean('is_free').default(false),
  price: decimal('price', { precision: 8, scale: 2 }).default('0'),
  
  instructions: text('instructions'),
  syllabusCoverage: text('syllabus_coverage'),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Tests table
export const userTests = pgTable('user_tests', {
  userTestId: uuid('user_test_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  templateId: uuid('template_id').references(() => testTemplates.templateId, { onDelete: 'cascade' }).notNull(),
  
  testStatus: testStatusEnum('test_status').default('not_started'),
  
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  timeTakenSeconds: integer('time_taken_seconds'),
  
  // Scores
  totalQuestionsAttempted: integer('total_questions_attempted').default(0),
  correctAnswers: integer('correct_answers').default(0),
  incorrectAnswers: integer('incorrect_answers').default(0),
  skippedQuestions: integer('skipped_questions').default(0),
  
  marksObtained: decimal('marks_obtained', { precision: 8, scale: 2 }).default('0'),
  totalMarks: decimal('total_marks', { precision: 8, scale: 2 }),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  
  // Rankings
  rank: integer('rank'),
  totalParticipants: integer('total_participants'),
  percentile: decimal('percentile', { precision: 5, scale: 2 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Progress table
export const userProgress = pgTable('user_progress', {
  progressId: uuid('progress_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  topicId: uuid('topic_id').references(() => topics.topicId, { onDelete: 'cascade' }).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.subjectId, { onDelete: 'cascade' }).notNull(),
  
  totalQuestionsAttempted: integer('total_questions_attempted').default(0),
  correctAnswers: integer('correct_answers').default(0),
  totalTimeSpentSeconds: integer('total_time_spent_seconds').default(0),
  
  masteryLevel: masteryLevelEnum('mastery_level').default('beginner'),
  masteryPercentage: decimal('mastery_percentage', { precision: 5, scale: 2 }).default('0'),
  
  lastPracticedAt: timestamp('last_practiced_at'),
  practiceCount: integer('practice_count').default(0),
  
  averageAccuracy: decimal('average_accuracy', { precision: 5, scale: 2 }),
  averageTimePerQuestionSeconds: integer('average_time_per_question_seconds'),
  
  needsRevision: boolean('needs_revision').default(false),
  
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Notes table
export const userNotes = pgTable('user_notes', {
  noteId: uuid('note_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  
  noteTitle: varchar('note_title', { length: 200 }).notNull(),
  noteContent: text('note_content').notNull(),
  noteColor: varchar('note_color', { length: 7 }).default('#FFD700'),
  
  // Association with study material
  topicId: uuid('topic_id').references(() => topics.topicId, { onDelete: 'set null' }),
  subjectId: uuid('subject_id').references(() => subjects.subjectId, { onDelete: 'set null' }),
  questionId: uuid('question_id').references(() => questions.questionId, { onDelete: 'set null' }),
  
  isPinned: boolean('is_pinned').default(false),
  isFavorite: boolean('is_favorite').default(false),
  
  tags: json('tags').$type<string[]>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Study Materials table
export const studyMaterials = pgTable('study_materials', {
  materialId: uuid('material_id').primaryKey().defaultRandom(),
  topicId: uuid('topic_id').references(() => topics.topicId, { onDelete: 'cascade' }).notNull(),
  subjectId: uuid('subject_id').references(() => subjects.subjectId, { onDelete: 'cascade' }).notNull(),
  
  materialTitle: varchar('material_title', { length: 200 }).notNull(),
  materialType: materialTypeEnum('material_type'),
  
  contentUrl: text('content_url'),
  fileSizeMb: decimal('file_size_mb', { precision: 8, scale: 2 }),
  durationMinutes: integer('duration_minutes'),
  
  description: text('description'),
  
  isFree: boolean('is_free').default(false),
  price: decimal('price', { precision: 8, scale: 2 }).default('0'),
  
  viewCount: integer('view_count').default(0),
  downloadCount: integer('download_count').default(0),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  
  language: varchar('language', { length: 10 }).default('en'),
  
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications table
export const notifications = pgTable('notifications', {
  notificationId: uuid('notification_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  
  notificationType: notificationTypeEnum('notification_type'),
  
  title: varchar('title', { length: 200 }).notNull(),
  message: text('message').notNull(),
  
  actionUrl: text('action_url'),
  
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Practice Sessions table
export const practiceSessions = pgTable('practice_sessions', {
  sessionId: uuid('session_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  
  category: practiceCategoryEnum('category').notNull(),
  status: practiceStatusEnum('status').default('in_progress'),
  
  // Session details
  totalQuestions: integer('total_questions').default(20),
  timeLimitMinutes: integer('time_limit_minutes').default(15),
  
  // Timing
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  timeSpentSeconds: integer('time_spent_seconds').default(0),
  
  // Results
  questionsAttempted: integer('questions_attempted').default(0),
  correctAnswers: integer('correct_answers').default(0),
  incorrectAnswers: integer('incorrect_answers').default(0),
  skippedQuestions: integer('skipped_questions').default(0),
  
  // Score
  score: decimal('score', { precision: 5, scale: 2 }).default('0'),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).default('0'),
  
  // Questions data (JSON array of question details with explanations)
  questionsData: json('questions_data').$type<Array<{
    questionId: string;
    questionText: string;
    options: Array<{ id: number; text: string }>;
    correctAnswer: string;
    correctOption: number | null;
    userAnswer: string;
    isCorrect: boolean;
    timeSpentSeconds: number;
    explanation: string;
    category: string;
    topic?: string;
  }>>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
export type NewSubject = typeof subjects.$inferInsert;
export type Topic = typeof topics.$inferSelect;
export type NewTopic = typeof topics.$inferInsert;
export type Question = typeof questions.$inferSelect;
export type NewQuestion = typeof questions.$inferInsert;
export type UserExamPreference = typeof userExamPreferences.$inferSelect;
export type NewUserExamPreference = typeof userExamPreferences.$inferInsert;
export type TestTemplate = typeof testTemplates.$inferSelect;
export type NewTestTemplate = typeof testTemplates.$inferInsert;
export type UserTest = typeof userTests.$inferSelect;
export type NewUserTest = typeof userTests.$inferInsert;
export type UserProgress = typeof userProgress.$inferSelect;
export type NewUserProgress = typeof userProgress.$inferInsert;
export type UserNote = typeof userNotes.$inferSelect;
export type NewUserNote = typeof userNotes.$inferInsert;
export type StudyMaterial = typeof studyMaterials.$inferSelect;
export type NewStudyMaterial = typeof studyMaterials.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
// Dynamic Exam Sessions table
export const dynamicExamSessions = pgTable('dynamic_exam_sessions', {
  sessionId: uuid('session_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.userId).notNull(),
  
  // Exam Configuration
  examName: varchar('exam_name', { length: 255 }).notNull(),
  totalMarks: integer('total_marks').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  negativeMarking: boolean('negative_marking').default(false),
  negativeMarksRatio: decimal('negative_marks_ratio', { precision: 3, scale: 2 }).default('0.25'),
  
  // Question Distribution
  questionDistribution: json('question_distribution').$type<Array<{
    category: string;
    count: number;
    marksPerQuestion: number;
    topic?: string;
  }>>().notNull(),
  
  // Session Status
  status: examStatusEnum('status').default('not_started'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  
  // Results
  timeSpentSeconds: integer('time_spent_seconds').default(0),
  questionsAttempted: integer('questions_attempted').default(0),
  correctAnswers: integer('correct_answers').default(0),
  incorrectAnswers: integer('incorrect_answers').default(0),
  skippedQuestions: integer('skipped_questions').default(0),
  marksObtained: decimal('marks_obtained', { precision: 5, scale: 2 }).default('0'),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).default('0'),
  
  // Questions Data
  questionsData: json('questions_data').$type<Array<{
    questionId: string;
    questionText: string;
    options: Array<{ id: number; text: string }>;
    correctAnswer: string;
    userAnswer: string;
    isCorrect: boolean;
    timeSpentSeconds: number;
    marksObtained: number;
    category: string;
  }>>(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type DynamicExamSession = typeof dynamicExamSessions.$inferSelect;
export type NewDynamicExamSession = typeof dynamicExamSessions.$inferInsert;

// Practice Categories table
export const practiceCategories = pgTable('practice_categories', {
  categoryId: uuid('category_id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 50 }).notNull().unique(),
  color: varchar('color', { length: 7 }).default('#1890ff'),
  language: varchar('language', { length: 10 }).default('en'),
  icon: varchar('icon', { length: 50 }),
  
  // Category settings
  totalQuestions: integer('total_questions').default(0),
  timeLimitMinutes: integer('time_limit_minutes').default(15),
  questionsPerSession: integer('questions_per_session').default(20),
  
  // Status and metadata
  status: categoryStatusEnum('status').default('active'),
  sortOrder: integer('sort_order').default(0),
  
  // Admin tracking
  createdBy: uuid('created_by').references(() => users.userId),
  updatedBy: uuid('updated_by').references(() => users.userId),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Practice Questions table
export const practiceQuestions = pgTable('practice_questions', {
  questionId: uuid('question_id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => practiceCategories.categoryId, { onDelete: 'cascade' }).notNull(),
  jobId: uuid('job_id').references(() => jobs.jobId, { onDelete: 'set null' }),
  
  // Question content
  questionText: text('question_text').notNull(),
  options: json('options').$type<Array<{ id: number; text: string }>>().notNull(),
  correctAnswer: varchar('correct_answer', { length: 500 }).notNull(),
  correctOption: integer('correct_option'), // Numeric option ID (1, 2, 3, 4)
  explanation: text('explanation'),
  topic: varchar('topic', { length: 100 }),
  
  // Question metadata
  difficulty: difficultyLevelEnum('difficulty').default('medium'),
  marks: integer('marks').default(1),
  questionType: questionTypeEnum('question_type').default('mcq'),
  
  // Job associations
  job: json('job').$type<Array<string>>().default([]), // Array of job names like ['MPSC', 'Grade-B', 'Grade-C']
  
  // Additional fields from JSON
  originalCategory: varchar('original_category', { length: 100 }),
  source: varchar('source', { length: 100 }).default('json_import'),
  
  // Status and tracking
  status: questionStatusEnum('status').default('active'),
  usageCount: integer('usage_count').default(0),
  correctCount: integer('correct_count').default(0),
  
  // Admin tracking
  createdBy: uuid('created_by').references(() => users.userId),
  updatedBy: uuid('updated_by').references(() => users.userId),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Practice Topics table
export const practiceTopics = pgTable('practice_topics', {
  topicId: uuid('topic_id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => practiceCategories.categoryId, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 150 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 100 }).notNull(),
  sortOrder: integer('sort_order').default(0),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Study Materials (concise notes) per category/topic
export const practiceStudyMaterials = pgTable('practice_study_materials', {
  materialId: uuid('material_id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => practiceCategories.categoryId, { onDelete: 'cascade' }).notNull(),
  topicSlug: varchar('topic_slug', { length: 100 }),
  language: varchar('language', { length: 10 }).default('en'),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  tags: json('tags').$type<Array<string>>().default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Jobs table (for different exam types like MPSC, Grade-B, etc.)
export const jobs = pgTable('jobs', {
  jobId: uuid('job_id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  displayName: varchar('display_name', { length: 150 }).notNull(),
  description: text('description'),
  shortCode: varchar('short_code', { length: 20 }).notNull().unique(),
  
  // Job settings
  totalMarks: integer('total_marks').default(100),
  durationMinutes: integer('duration_minutes').default(120),
  totalQuestions: integer('total_questions').default(100),
  
  // Job requirements
  minQualification: varchar('min_qualification', { length: 100 }),
  ageLimit: integer('age_limit'),
  experienceRequired: varchar('experience_required', { length: 200 }),
  
  // Status and metadata
  status: categoryStatusEnum('status').default('active'),
  isActive: boolean('is_active').default(true),
  sortOrder: integer('sort_order').default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// JSON Import Logs table (for tracking JSON file imports)
export const jsonImportLogs = pgTable('json_import_logs', {
  importId: uuid('import_id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => practiceCategories.categoryId),
  
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  
  // Import statistics
  totalQuestions: integer('total_questions').default(0),
  importedQuestions: integer('imported_questions').default(0),
  skippedQuestions: integer('skipped_questions').default(0),
  errorCount: integer('error_count').default(0),
  
  // Import status
  status: varchar('status', { length: 20 }).default('pending'), // pending, completed, failed
  errorMessage: text('error_message'),
  
  // Admin tracking
  importedBy: uuid('imported_by').references(() => users.userId).notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// User Statistics table
export const userStatistics = pgTable('user_statistics', {
  userId: uuid('user_id').primaryKey().references(() => users.userId, { onDelete: 'cascade' }),
  
  // Practice Statistics
  totalPracticeSessions: integer('total_practice_sessions').default(0).notNull(),
  totalQuestionsAttempted: integer('total_questions_attempted').default(0).notNull(),
  totalCorrectAnswers: integer('total_correct_answers').default(0).notNull(),
  totalIncorrectAnswers: integer('total_incorrect_answers').default(0).notNull(),
  totalSkippedQuestions: integer('total_skipped_questions').default(0).notNull(),
  
  // Exam Statistics
  totalExamSessions: integer('total_exam_sessions').default(0).notNull(),
  totalExamQuestionsAttempted: integer('total_exam_questions_attempted').default(0).notNull(),
  totalExamCorrectAnswers: integer('total_exam_correct_answers').default(0).notNull(),
  totalExamIncorrectAnswers: integer('total_exam_incorrect_answers').default(0).notNull(),
  
  // Streak Information
  currentStreak: integer('current_streak').default(0).notNull(),
  longestStreak: integer('longest_streak').default(0).notNull(),
  lastActivityDate: date('last_activity_date'),
  
  // Time Statistics
  totalTimeSpentMinutes: integer('total_time_spent_minutes').default(0).notNull(),
  averageTimePerQuestion: decimal('average_time_per_question', { precision: 5, scale: 2 }).default('0'),
  
  // Accuracy Statistics
  overallAccuracy: decimal('overall_accuracy', { precision: 5, scale: 2 }).default('0'),
  practiceAccuracy: decimal('practice_accuracy', { precision: 5, scale: 2 }).default('0'),
  examAccuracy: decimal('exam_accuracy', { precision: 5, scale: 2 }).default('0'),
  
  // Ranking Points (calculated field)
  rankingPoints: integer('ranking_points').default(0).notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Rankings table (for leaderboard)
export const userRankings = pgTable('user_rankings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  
  // Ranking metrics
  totalPoints: integer('total_points').notNull(),
  practicePoints: integer('practice_points').notNull(),
  examPoints: integer('exam_points').notNull(),
  streakPoints: integer('streak_points').notNull(),
  accuracyPoints: integer('accuracy_points').notNull(),
  
  // Rankings
  overallRank: integer('overall_rank'),
  practiceRank: integer('practice_rank'),
  examRank: integer('exam_rank'),
  streakRank: integer('streak_rank'),
  accuracyRank: integer('accuracy_rank'),
  
  // Period (daily, weekly, monthly, all-time)
  period: text('period').notNull(), // 'daily', 'weekly', 'monthly', 'alltime'
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Subject-specific user statistics
export const subjectStatistics = pgTable('subject_statistics', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => practiceCategories.categoryId, { onDelete: 'cascade' }),
  
  // Practice Statistics for this subject
  totalPracticeSessions: integer('total_practice_sessions').default(0).notNull(),
  totalQuestionsAttempted: integer('total_questions_attempted').default(0).notNull(),
  totalCorrectAnswers: integer('total_correct_answers').default(0).notNull(),
  totalIncorrectAnswers: integer('total_incorrect_answers').default(0).notNull(),
  totalSkippedQuestions: integer('total_skipped_questions').default(0).notNull(),
  
  // Exam Statistics for this subject
  totalExamSessions: integer('total_exam_sessions').default(0).notNull(),
  totalExamQuestionsAttempted: integer('total_exam_questions_attempted').default(0).notNull(),
  totalExamCorrectAnswers: integer('total_exam_correct_answers').default(0).notNull(),
  totalExamIncorrectAnswers: integer('total_exam_incorrect_answers').default(0).notNull(),
  
  // Time Statistics
  totalTimeSpentMinutes: integer('total_time_spent_minutes').default(0).notNull(),
  averageTimePerQuestion: decimal('average_time_per_question', { precision: 5, scale: 2 }).default('0'),
  
  // Accuracy Statistics
  overallAccuracy: decimal('overall_accuracy', { precision: 5, scale: 2 }).default('0'),
  practiceAccuracy: decimal('practice_accuracy', { precision: 5, scale: 2 }).default('0'),
  examAccuracy: decimal('exam_accuracy', { precision: 5, scale: 2 }).default('0'),
  
  // Ranking Points for this subject
  rankingPoints: integer('ranking_points').default(0).notNull(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Subject-specific rankings
export const subjectRankings = pgTable('subject_rankings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.userId, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => practiceCategories.categoryId, { onDelete: 'cascade' }),
  
  // Ranking metrics for this subject
  totalPoints: integer('total_points').notNull(),
  practicePoints: integer('practice_points').notNull(),
  examPoints: integer('exam_points').notNull(),
  accuracyPoints: integer('accuracy_points').notNull(),
  
  // Rankings for this subject
  overallRank: integer('overall_rank'),
  practiceRank: integer('practice_rank'),
  examRank: integer('exam_rank'),
  accuracyRank: integer('accuracy_rank'),
  
  // Period (daily, weekly, monthly, all-time)
  period: text('period').notNull(), // 'daily', 'weekly', 'monthly', 'alltime'
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User Personal Notes table (like Google Keep)
export const userPersonalNotes = pgTable('user_personal_notes', {
  noteId: uuid('note_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.userId, { onDelete: 'cascade' }).notNull(),
  
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  
  // Category/subject association
  categoryId: uuid('category_id').references(() => practiceCategories.categoryId, { onDelete: 'set null' }),
  categorySlug: varchar('category_slug', { length: 50 }),
  topicSlug: varchar('topic_slug', { length: 100 }),
  
  // Organization
  color: varchar('color', { length: 7 }).default('#fffacd'),
  tags: json('tags').$type<Array<string>>().default([]),
  isPinned: boolean('is_pinned').default(false),
  isArchived: boolean('is_archived').default(false),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Type exports for new tables
export type PracticeCategory = typeof practiceCategories.$inferSelect;
export type NewPracticeCategory = typeof practiceCategories.$inferInsert;
export type PracticeQuestion = typeof practiceQuestions.$inferSelect;
export type NewPracticeQuestion = typeof practiceQuestions.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type JsonImportLog = typeof jsonImportLogs.$inferSelect;
export type NewJsonImportLog = typeof jsonImportLogs.$inferInsert;
export type UserStatistics = typeof userStatistics.$inferSelect;
export type NewUserStatistics = typeof userStatistics.$inferInsert;
export type UserRanking = typeof userRankings.$inferSelect;
export type NewUserRanking = typeof userRankings.$inferInsert;
export type SubjectStatistics = typeof subjectStatistics.$inferSelect;
export type NewSubjectStatistics = typeof subjectStatistics.$inferInsert;
export type SubjectRanking = typeof subjectRankings.$inferSelect;
export type NewSubjectRanking = typeof subjectRankings.$inferInsert;
export type UserPersonalNote = typeof userPersonalNotes.$inferSelect;
export type NewUserPersonalNote = typeof userPersonalNotes.$inferInsert;
