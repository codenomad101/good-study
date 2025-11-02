"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamicExamSessions = exports.practiceSessions = exports.notifications = exports.studyMaterials = exports.userNotes = exports.userProgress = exports.userTests = exports.testTemplates = exports.userExamPreferences = exports.questions = exports.topics = exports.subjects = exports.exams = exports.users = exports.examStatusEnum = exports.practiceStatusEnum = exports.practiceCategoryEnum = exports.transactionTypeEnum = exports.transactionStatusEnum = exports.notificationTypeEnum = exports.achievementTypeEnum = exports.importanceEnum = exports.materialTypeEnum = exports.sessionTypeEnum = exports.testTypeEnum = exports.masteryLevelEnum = exports.testStatusEnum = exports.questionTypeEnum = exports.difficultyLevelEnum = exports.genderEnum = exports.subscriptionTypeEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// Enable UUID extension (this should be done in migration)
// CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
// Enums
exports.subscriptionTypeEnum = (0, pg_core_1.pgEnum)('subscription_type', ['free', 'premium', 'premium_plus']);
exports.genderEnum = (0, pg_core_1.pgEnum)('gender', ['male', 'female', 'other']);
exports.difficultyLevelEnum = (0, pg_core_1.pgEnum)('difficulty_level', ['easy', 'medium', 'hard']);
exports.questionTypeEnum = (0, pg_core_1.pgEnum)('question_type', ['mcq', 'numerical', 'true_false', 'fill_blank']);
exports.testStatusEnum = (0, pg_core_1.pgEnum)('test_status', ['not_started', 'in_progress', 'completed', 'abandoned']);
exports.masteryLevelEnum = (0, pg_core_1.pgEnum)('mastery_level', ['beginner', 'intermediate', 'advanced', 'expert']);
exports.testTypeEnum = (0, pg_core_1.pgEnum)('test_type', ['full_length', 'sectional', 'topic_wise', 'previous_year', 'daily_practice']);
exports.sessionTypeEnum = (0, pg_core_1.pgEnum)('session_type', ['daily', 'custom', 'revision']);
exports.materialTypeEnum = (0, pg_core_1.pgEnum)('material_type', ['pdf', 'video', 'article', 'formula_sheet', 'shortcut']);
exports.importanceEnum = (0, pg_core_1.pgEnum)('importance', ['low', 'medium', 'high', 'critical']);
exports.achievementTypeEnum = (0, pg_core_1.pgEnum)('achievement_type', ['streak', 'questions', 'tests', 'accuracy', 'special']);
exports.notificationTypeEnum = (0, pg_core_1.pgEnum)('notification_type', ['practice_reminder', 'test_available', 'achievement', 'streak_alert', 'community', 'general']);
exports.transactionStatusEnum = (0, pg_core_1.pgEnum)('transaction_status', ['pending', 'success', 'failed', 'refunded']);
exports.transactionTypeEnum = (0, pg_core_1.pgEnum)('transaction_type', ['subscription', 'test_purchase', 'material_purchase', 'coins']);
exports.practiceCategoryEnum = (0, pg_core_1.pgEnum)('practice_category', ['economy', 'gk', 'history', 'geography', 'english', 'aptitude', 'agriculture', 'marathi']);
exports.practiceStatusEnum = (0, pg_core_1.pgEnum)('practice_status', ['in_progress', 'completed', 'abandoned']);
exports.examStatusEnum = (0, pg_core_1.pgEnum)('exam_status', ['not_started', 'in_progress', 'completed', 'abandoned']);
// Users table
exports.users = (0, pg_core_1.pgTable)('users', {
    userId: (0, pg_core_1.uuid)('user_id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    phone: (0, pg_core_1.varchar)('phone', { length: 15 }).unique(),
    passwordHash: (0, pg_core_1.varchar)('password_hash', { length: 255 }).notNull(),
    fullName: (0, pg_core_1.varchar)('full_name', { length: 100 }).notNull(),
    profilePictureUrl: (0, pg_core_1.text)('profile_picture_url'),
    dateOfBirth: (0, pg_core_1.date)('date_of_birth'),
    gender: (0, exports.genderEnum)('gender'),
    preferredLanguage: (0, pg_core_1.varchar)('preferred_language', { length: 10 }).default('en'),
    // Subscription details
    subscriptionType: (0, exports.subscriptionTypeEnum)('subscription_type').default('free'),
    subscriptionStartDate: (0, pg_core_1.timestamp)('subscription_start_date'),
    subscriptionEndDate: (0, pg_core_1.timestamp)('subscription_end_date'),
    // Gamification
    totalPoints: (0, pg_core_1.integer)('total_points').default(0),
    level: (0, pg_core_1.integer)('level').default(1),
    coins: (0, pg_core_1.integer)('coins').default(0),
    // Activity tracking
    currentStreak: (0, pg_core_1.integer)('current_streak').default(0),
    longestStreak: (0, pg_core_1.integer)('longest_streak').default(0),
    lastActivityDate: (0, pg_core_1.date)('last_activity_date'),
    totalStudyTimeMinutes: (0, pg_core_1.integer)('total_study_time_minutes').default(0),
    // Practice session tracking
    totalPracticeSessions: (0, pg_core_1.integer)('total_practice_sessions').default(0),
    totalPracticeScore: (0, pg_core_1.integer)('total_practice_score').default(0),
    weeklyPracticeScore: (0, pg_core_1.integer)('weekly_practice_score').default(0),
    monthlyPracticeScore: (0, pg_core_1.integer)('monthly_practice_score').default(0),
    lastPracticeDate: (0, pg_core_1.timestamp)('last_practice_date'),
    weeklyPracticeCount: (0, pg_core_1.integer)('weekly_practice_count').default(0),
    monthlyPracticeCount: (0, pg_core_1.integer)('monthly_practice_count').default(0),
    // Account status
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    isVerified: (0, pg_core_1.boolean)('is_verified').default(false),
    emailVerifiedAt: (0, pg_core_1.timestamp)('email_verified_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
    lastLoginAt: (0, pg_core_1.timestamp)('last_login_at'),
});
// Exams table
exports.exams = (0, pg_core_1.pgTable)('exams', {
    examId: (0, pg_core_1.uuid)('exam_id').primaryKey().defaultRandom(),
    examName: (0, pg_core_1.varchar)('exam_name', { length: 100 }).notNull(),
    examCode: (0, pg_core_1.varchar)('exam_code', { length: 20 }).notNull().unique(),
    description: (0, pg_core_1.text)('description'),
    examPattern: (0, pg_core_1.text)('exam_pattern'),
    totalMarks: (0, pg_core_1.integer)('total_marks'),
    durationMinutes: (0, pg_core_1.integer)('duration_minutes'),
    negativeMarking: (0, pg_core_1.boolean)('negative_marking').default(false),
    negativeMarksRatio: (0, pg_core_1.decimal)('negative_marks_ratio', { precision: 3, scale: 2 }).default('0.25'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// Subjects table
exports.subjects = (0, pg_core_1.pgTable)('subjects', {
    subjectId: (0, pg_core_1.uuid)('subject_id').primaryKey().defaultRandom(),
    examId: (0, pg_core_1.uuid)('exam_id').references(() => exports.exams.examId, { onDelete: 'cascade' }).notNull(),
    subjectName: (0, pg_core_1.varchar)('subject_name', { length: 100 }).notNull(),
    subjectCode: (0, pg_core_1.varchar)('subject_code', { length: 20 }).notNull(),
    weightagePercentage: (0, pg_core_1.decimal)('weightage_percentage', { precision: 5, scale: 2 }),
    totalQuestions: (0, pg_core_1.integer)('total_questions'),
    displayOrder: (0, pg_core_1.integer)('display_order'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// Topics table
exports.topics = (0, pg_core_1.pgTable)('topics', {
    topicId: (0, pg_core_1.uuid)('topic_id').primaryKey().defaultRandom(),
    subjectId: (0, pg_core_1.uuid)('subject_id').references(() => exports.subjects.subjectId, { onDelete: 'cascade' }).notNull(),
    topicName: (0, pg_core_1.varchar)('topic_name', { length: 200 }).notNull(),
    difficultyLevel: (0, exports.difficultyLevelEnum)('difficulty_level'),
    estimatedTimeMinutes: (0, pg_core_1.integer)('estimated_time_minutes'),
    parentTopicId: (0, pg_core_1.uuid)('parent_topic_id'),
    displayOrder: (0, pg_core_1.integer)('display_order'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// Questions table
exports.questions = (0, pg_core_1.pgTable)('questions', {
    questionId: (0, pg_core_1.uuid)('question_id').primaryKey().defaultRandom(),
    topicId: (0, pg_core_1.uuid)('topic_id').references(() => exports.topics.topicId, { onDelete: 'cascade' }).notNull(),
    subjectId: (0, pg_core_1.uuid)('subject_id').references(() => exports.subjects.subjectId, { onDelete: 'cascade' }).notNull(),
    examId: (0, pg_core_1.uuid)('exam_id').references(() => exports.exams.examId, { onDelete: 'cascade' }).notNull(),
    questionText: (0, pg_core_1.text)('question_text').notNull(),
    questionImageUrl: (0, pg_core_1.text)('question_image_url'),
    questionType: (0, exports.questionTypeEnum)('question_type').default('mcq'),
    difficultyLevel: (0, exports.difficultyLevelEnum)('difficulty_level'),
    marks: (0, pg_core_1.decimal)('marks', { precision: 4, scale: 2 }).default('1.00'),
    negativeMarks: (0, pg_core_1.decimal)('negative_marks', { precision: 4, scale: 2 }).default('0.25'),
    // Options for MCQ
    optionA: (0, pg_core_1.text)('option_a'),
    optionB: (0, pg_core_1.text)('option_b'),
    optionC: (0, pg_core_1.text)('option_c'),
    optionD: (0, pg_core_1.text)('option_d'),
    optionE: (0, pg_core_1.text)('option_e'),
    correctAnswer: (0, pg_core_1.varchar)('correct_answer', { length: 10 }).notNull(),
    detailedSolution: (0, pg_core_1.text)('detailed_solution'),
    solutionVideoUrl: (0, pg_core_1.text)('solution_video_url'),
    hint: (0, pg_core_1.text)('hint'),
    // Metadata
    yearAppeared: (0, pg_core_1.integer)('year_appeared'),
    source: (0, pg_core_1.varchar)('source', { length: 100 }),
    timesAttempted: (0, pg_core_1.integer)('times_attempted').default(0),
    timesCorrect: (0, pg_core_1.integer)('times_correct').default(0),
    averageTimeSeconds: (0, pg_core_1.integer)('average_time_seconds'),
    language: (0, pg_core_1.varchar)('language', { length: 10 }).default('en'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdBy: (0, pg_core_1.uuid)('created_by').references(() => exports.users.userId),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// User Exam Preferences table
exports.userExamPreferences = (0, pg_core_1.pgTable)('user_exam_preferences', {
    preferenceId: (0, pg_core_1.uuid)('preference_id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.userId, { onDelete: 'cascade' }).notNull(),
    examId: (0, pg_core_1.uuid)('exam_id').references(() => exports.exams.examId, { onDelete: 'cascade' }).notNull(),
    targetExamDate: (0, pg_core_1.date)('target_exam_date'),
    dailyStudyGoalMinutes: (0, pg_core_1.integer)('daily_study_goal_minutes').default(30),
    isPrimaryExam: (0, pg_core_1.boolean)('is_primary_exam').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// Test Templates table
exports.testTemplates = (0, pg_core_1.pgTable)('test_templates', {
    templateId: (0, pg_core_1.uuid)('template_id').primaryKey().defaultRandom(),
    examId: (0, pg_core_1.uuid)('exam_id').references(() => exports.exams.examId, { onDelete: 'cascade' }).notNull(),
    templateName: (0, pg_core_1.varchar)('template_name', { length: 200 }).notNull(),
    testType: (0, exports.testTypeEnum)('test_type'),
    totalQuestions: (0, pg_core_1.integer)('total_questions').notNull(),
    totalMarks: (0, pg_core_1.decimal)('total_marks', { precision: 6, scale: 2 }).notNull(),
    durationMinutes: (0, pg_core_1.integer)('duration_minutes').notNull(),
    isFree: (0, pg_core_1.boolean)('is_free').default(false),
    price: (0, pg_core_1.decimal)('price', { precision: 8, scale: 2 }).default('0'),
    instructions: (0, pg_core_1.text)('instructions'),
    syllabusCoverage: (0, pg_core_1.text)('syllabus_coverage'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// User Tests table
exports.userTests = (0, pg_core_1.pgTable)('user_tests', {
    userTestId: (0, pg_core_1.uuid)('user_test_id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.userId, { onDelete: 'cascade' }).notNull(),
    templateId: (0, pg_core_1.uuid)('template_id').references(() => exports.testTemplates.templateId, { onDelete: 'cascade' }).notNull(),
    testStatus: (0, exports.testStatusEnum)('test_status').default('not_started'),
    startedAt: (0, pg_core_1.timestamp)('started_at'),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    timeTakenSeconds: (0, pg_core_1.integer)('time_taken_seconds'),
    // Scores
    totalQuestionsAttempted: (0, pg_core_1.integer)('total_questions_attempted').default(0),
    correctAnswers: (0, pg_core_1.integer)('correct_answers').default(0),
    incorrectAnswers: (0, pg_core_1.integer)('incorrect_answers').default(0),
    skippedQuestions: (0, pg_core_1.integer)('skipped_questions').default(0),
    marksObtained: (0, pg_core_1.decimal)('marks_obtained', { precision: 8, scale: 2 }).default('0'),
    totalMarks: (0, pg_core_1.decimal)('total_marks', { precision: 8, scale: 2 }),
    percentage: (0, pg_core_1.decimal)('percentage', { precision: 5, scale: 2 }),
    // Rankings
    rank: (0, pg_core_1.integer)('rank'),
    totalParticipants: (0, pg_core_1.integer)('total_participants'),
    percentile: (0, pg_core_1.decimal)('percentile', { precision: 5, scale: 2 }),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// User Progress table
exports.userProgress = (0, pg_core_1.pgTable)('user_progress', {
    progressId: (0, pg_core_1.uuid)('progress_id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.userId, { onDelete: 'cascade' }).notNull(),
    topicId: (0, pg_core_1.uuid)('topic_id').references(() => exports.topics.topicId, { onDelete: 'cascade' }).notNull(),
    subjectId: (0, pg_core_1.uuid)('subject_id').references(() => exports.subjects.subjectId, { onDelete: 'cascade' }).notNull(),
    totalQuestionsAttempted: (0, pg_core_1.integer)('total_questions_attempted').default(0),
    correctAnswers: (0, pg_core_1.integer)('correct_answers').default(0),
    totalTimeSpentSeconds: (0, pg_core_1.integer)('total_time_spent_seconds').default(0),
    masteryLevel: (0, exports.masteryLevelEnum)('mastery_level').default('beginner'),
    masteryPercentage: (0, pg_core_1.decimal)('mastery_percentage', { precision: 5, scale: 2 }).default('0'),
    lastPracticedAt: (0, pg_core_1.timestamp)('last_practiced_at'),
    practiceCount: (0, pg_core_1.integer)('practice_count').default(0),
    averageAccuracy: (0, pg_core_1.decimal)('average_accuracy', { precision: 5, scale: 2 }),
    averageTimePerQuestionSeconds: (0, pg_core_1.integer)('average_time_per_question_seconds'),
    needsRevision: (0, pg_core_1.boolean)('needs_revision').default(false),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// User Notes table
exports.userNotes = (0, pg_core_1.pgTable)('user_notes', {
    noteId: (0, pg_core_1.uuid)('note_id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.userId, { onDelete: 'cascade' }).notNull(),
    noteTitle: (0, pg_core_1.varchar)('note_title', { length: 200 }).notNull(),
    noteContent: (0, pg_core_1.text)('note_content').notNull(),
    noteColor: (0, pg_core_1.varchar)('note_color', { length: 7 }).default('#FFD700'),
    // Association with study material
    topicId: (0, pg_core_1.uuid)('topic_id').references(() => exports.topics.topicId, { onDelete: 'set null' }),
    subjectId: (0, pg_core_1.uuid)('subject_id').references(() => exports.subjects.subjectId, { onDelete: 'set null' }),
    questionId: (0, pg_core_1.uuid)('question_id').references(() => exports.questions.questionId, { onDelete: 'set null' }),
    isPinned: (0, pg_core_1.boolean)('is_pinned').default(false),
    isFavorite: (0, pg_core_1.boolean)('is_favorite').default(false),
    tags: (0, pg_core_1.json)('tags').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Study Materials table
exports.studyMaterials = (0, pg_core_1.pgTable)('study_materials', {
    materialId: (0, pg_core_1.uuid)('material_id').primaryKey().defaultRandom(),
    topicId: (0, pg_core_1.uuid)('topic_id').references(() => exports.topics.topicId, { onDelete: 'cascade' }).notNull(),
    subjectId: (0, pg_core_1.uuid)('subject_id').references(() => exports.subjects.subjectId, { onDelete: 'cascade' }).notNull(),
    materialTitle: (0, pg_core_1.varchar)('material_title', { length: 200 }).notNull(),
    materialType: (0, exports.materialTypeEnum)('material_type'),
    contentUrl: (0, pg_core_1.text)('content_url'),
    fileSizeMb: (0, pg_core_1.decimal)('file_size_mb', { precision: 8, scale: 2 }),
    durationMinutes: (0, pg_core_1.integer)('duration_minutes'),
    description: (0, pg_core_1.text)('description'),
    isFree: (0, pg_core_1.boolean)('is_free').default(false),
    price: (0, pg_core_1.decimal)('price', { precision: 8, scale: 2 }).default('0'),
    viewCount: (0, pg_core_1.integer)('view_count').default(0),
    downloadCount: (0, pg_core_1.integer)('download_count').default(0),
    rating: (0, pg_core_1.decimal)('rating', { precision: 3, scale: 2 }),
    language: (0, pg_core_1.varchar)('language', { length: 10 }).default('en'),
    isActive: (0, pg_core_1.boolean)('is_active').default(true),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// Notifications table
exports.notifications = (0, pg_core_1.pgTable)('notifications', {
    notificationId: (0, pg_core_1.uuid)('notification_id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.userId, { onDelete: 'cascade' }).notNull(),
    notificationType: (0, exports.notificationTypeEnum)('notification_type'),
    title: (0, pg_core_1.varchar)('title', { length: 200 }).notNull(),
    message: (0, pg_core_1.text)('message').notNull(),
    actionUrl: (0, pg_core_1.text)('action_url'),
    isRead: (0, pg_core_1.boolean)('is_read').default(false),
    readAt: (0, pg_core_1.timestamp)('read_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
});
// Practice Sessions table
exports.practiceSessions = (0, pg_core_1.pgTable)('practice_sessions', {
    sessionId: (0, pg_core_1.uuid)('session_id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.userId, { onDelete: 'cascade' }).notNull(),
    category: (0, exports.practiceCategoryEnum)('category').notNull(),
    status: (0, exports.practiceStatusEnum)('status').default('in_progress'),
    // Session details
    totalQuestions: (0, pg_core_1.integer)('total_questions').default(20),
    timeLimitMinutes: (0, pg_core_1.integer)('time_limit_minutes').default(15),
    // Timing
    startedAt: (0, pg_core_1.timestamp)('started_at').defaultNow().notNull(),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    timeSpentSeconds: (0, pg_core_1.integer)('time_spent_seconds').default(0),
    // Results
    questionsAttempted: (0, pg_core_1.integer)('questions_attempted').default(0),
    correctAnswers: (0, pg_core_1.integer)('correct_answers').default(0),
    incorrectAnswers: (0, pg_core_1.integer)('incorrect_answers').default(0),
    skippedQuestions: (0, pg_core_1.integer)('skipped_questions').default(0),
    // Score
    score: (0, pg_core_1.decimal)('score', { precision: 5, scale: 2 }).default('0'),
    percentage: (0, pg_core_1.decimal)('percentage', { precision: 5, scale: 2 }).default('0'),
    // Questions data (JSON array of question details with explanations)
    questionsData: (0, pg_core_1.json)('questions_data').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
// Dynamic Exam Sessions table
exports.dynamicExamSessions = (0, pg_core_1.pgTable)('dynamic_exam_sessions', {
    sessionId: (0, pg_core_1.uuid)('session_id').primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)('user_id').references(() => exports.users.userId).notNull(),
    // Exam Configuration
    examName: (0, pg_core_1.varchar)('exam_name', { length: 255 }).notNull(),
    totalMarks: (0, pg_core_1.integer)('total_marks').notNull(),
    durationMinutes: (0, pg_core_1.integer)('duration_minutes').notNull(),
    totalQuestions: (0, pg_core_1.integer)('total_questions').notNull(),
    negativeMarking: (0, pg_core_1.boolean)('negative_marking').default(false),
    negativeMarksRatio: (0, pg_core_1.decimal)('negative_marks_ratio', { precision: 3, scale: 2 }).default('0.25'),
    // Question Distribution
    questionDistribution: (0, pg_core_1.json)('question_distribution').$type().notNull(),
    // Session Status
    status: (0, exports.examStatusEnum)('status').default('not_started'),
    startedAt: (0, pg_core_1.timestamp)('started_at'),
    completedAt: (0, pg_core_1.timestamp)('completed_at'),
    // Results
    timeSpentSeconds: (0, pg_core_1.integer)('time_spent_seconds').default(0),
    questionsAttempted: (0, pg_core_1.integer)('questions_attempted').default(0),
    correctAnswers: (0, pg_core_1.integer)('correct_answers').default(0),
    incorrectAnswers: (0, pg_core_1.integer)('incorrect_answers').default(0),
    skippedQuestions: (0, pg_core_1.integer)('skipped_questions').default(0),
    marksObtained: (0, pg_core_1.decimal)('marks_obtained', { precision: 5, scale: 2 }).default('0'),
    percentage: (0, pg_core_1.decimal)('percentage', { precision: 5, scale: 2 }).default('0'),
    // Questions Data
    questionsData: (0, pg_core_1.json)('questions_data').$type(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow().notNull(),
});
//# sourceMappingURL=schema.js.map