DO $$ BEGIN
 CREATE TYPE "achievement_type" AS ENUM('streak', 'questions', 'tests', 'accuracy', 'special');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "category_status" AS ENUM('active', 'inactive', 'draft');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "difficulty_level" AS ENUM('easy', 'medium', 'hard');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "exam_status" AS ENUM('not_started', 'in_progress', 'completed', 'abandoned');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "gender" AS ENUM('male', 'female', 'other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "importance" AS ENUM('low', 'medium', 'high', 'critical');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "mastery_level" AS ENUM('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "material_type" AS ENUM('pdf', 'video', 'article', 'formula_sheet', 'shortcut');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "notification_type" AS ENUM('practice_reminder', 'test_available', 'achievement', 'streak_alert', 'community', 'general');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "practice_category" AS ENUM('economy', 'gk', 'history', 'geography', 'english', 'aptitude', 'agriculture', 'marathi', 'polity', 'current-affairs');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "practice_status" AS ENUM('in_progress', 'completed', 'abandoned');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "question_status" AS ENUM('active', 'inactive', 'draft');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "question_type" AS ENUM('mcq', 'numerical', 'true_false', 'fill_blank');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "session_type" AS ENUM('daily', 'custom', 'revision');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "subscription_type" AS ENUM('free', 'premium', 'premium_plus');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "test_status" AS ENUM('not_started', 'in_progress', 'completed', 'abandoned');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "test_type" AS ENUM('full_length', 'sectional', 'topic_wise', 'previous_year', 'daily_practice');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "transaction_status" AS ENUM('pending', 'success', 'failed', 'refunded');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "transaction_type" AS ENUM('subscription', 'test_purchase', 'material_purchase', 'coins');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "user_role" AS ENUM('admin', 'student', 'moderator');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "dynamic_exam_sessions" (
	"session_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exam_name" varchar(255) NOT NULL,
	"total_marks" integer NOT NULL,
	"duration_minutes" integer NOT NULL,
	"total_questions" integer NOT NULL,
	"negative_marking" boolean DEFAULT false,
	"negative_marks_ratio" numeric(3, 2) DEFAULT '0.25',
	"question_distribution" json NOT NULL,
	"status" "exam_status" DEFAULT 'not_started',
	"started_at" timestamp,
	"completed_at" timestamp,
	"time_spent_seconds" integer DEFAULT 0,
	"questions_attempted" integer DEFAULT 0,
	"correct_answers" integer DEFAULT 0,
	"incorrect_answers" integer DEFAULT 0,
	"skipped_questions" integer DEFAULT 0,
	"marks_obtained" numeric(5, 2) DEFAULT '0',
	"percentage" numeric(5, 2) DEFAULT '0',
	"questions_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "exams" (
	"exam_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_name" varchar(100) NOT NULL,
	"exam_code" varchar(20) NOT NULL,
	"description" text,
	"exam_pattern" text,
	"total_marks" integer,
	"duration_minutes" integer,
	"negative_marking" boolean DEFAULT false,
	"negative_marks_ratio" numeric(3, 2) DEFAULT '0.25',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "exams_exam_code_unique" UNIQUE("exam_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "jobs" (
	"job_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"display_name" varchar(150) NOT NULL,
	"description" text,
	"short_code" varchar(20) NOT NULL,
	"total_marks" integer DEFAULT 100,
	"duration_minutes" integer DEFAULT 120,
	"total_questions" integer DEFAULT 100,
	"min_qualification" varchar(100),
	"age_limit" integer,
	"experience_required" varchar(200),
	"status" "category_status" DEFAULT 'active',
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_name_unique" UNIQUE("name"),
	CONSTRAINT "jobs_short_code_unique" UNIQUE("short_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "json_import_logs" (
	"import_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"file_path" text NOT NULL,
	"file_size" integer,
	"total_questions" integer DEFAULT 0,
	"imported_questions" integer DEFAULT 0,
	"skipped_questions" integer DEFAULT 0,
	"error_count" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'pending',
	"error_message" text,
	"imported_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "notifications" (
	"notification_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" "notification_type",
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"action_url" text,
	"is_read" boolean DEFAULT false,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "practice_categories" (
	"category_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"slug" varchar(50) NOT NULL,
	"color" varchar(7) DEFAULT '#1890ff',
	"language" varchar(10) DEFAULT 'en',
	"icon" varchar(50),
	"total_questions" integer DEFAULT 0,
	"time_limit_minutes" integer DEFAULT 15,
	"questions_per_session" integer DEFAULT 20,
	"status" "category_status" DEFAULT 'active',
	"sort_order" integer DEFAULT 0,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "practice_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "practice_questions" (
	"question_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"job_id" uuid,
	"question_text" text NOT NULL,
	"options" json NOT NULL,
	"correct_answer" varchar(500) NOT NULL,
	"correct_option" integer,
	"explanation" text,
	"topic" varchar(100),
	"difficulty" "difficulty_level" DEFAULT 'medium',
	"marks" integer DEFAULT 1,
	"question_type" "question_type" DEFAULT 'mcq',
	"job" json DEFAULT '[]'::json,
	"original_category" varchar(100),
	"source" varchar(100) DEFAULT 'json_import',
	"status" "question_status" DEFAULT 'active',
	"usage_count" integer DEFAULT 0,
	"correct_count" integer DEFAULT 0,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "practice_sessions" (
	"session_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "practice_category" NOT NULL,
	"status" "practice_status" DEFAULT 'in_progress',
	"total_questions" integer DEFAULT 20,
	"time_limit_minutes" integer DEFAULT 15,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"time_spent_seconds" integer DEFAULT 0,
	"questions_attempted" integer DEFAULT 0,
	"correct_answers" integer DEFAULT 0,
	"incorrect_answers" integer DEFAULT 0,
	"skipped_questions" integer DEFAULT 0,
	"score" numeric(5, 2) DEFAULT '0',
	"percentage" numeric(5, 2) DEFAULT '0',
	"questions_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "practice_study_materials" (
	"material_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"topic_slug" varchar(100),
	"title" varchar(200) NOT NULL,
	"content" text NOT NULL,
	"tags" json DEFAULT '[]'::json,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "practice_topics" (
	"topic_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"description" text,
	"slug" varchar(100) NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "questions" (
	"question_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"question_text" text NOT NULL,
	"question_image_url" text,
	"question_type" "question_type" DEFAULT 'mcq',
	"difficulty_level" "difficulty_level",
	"marks" numeric(4, 2) DEFAULT '1.00',
	"negative_marks" numeric(4, 2) DEFAULT '0.25',
	"option_a" text,
	"option_b" text,
	"option_c" text,
	"option_d" text,
	"option_e" text,
	"correct_answer" varchar(10) NOT NULL,
	"detailed_solution" text,
	"solution_video_url" text,
	"hint" text,
	"year_appeared" integer,
	"source" varchar(100),
	"times_attempted" integer DEFAULT 0,
	"times_correct" integer DEFAULT 0,
	"average_time_seconds" integer,
	"language" varchar(10) DEFAULT 'en',
	"is_active" boolean DEFAULT true,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "study_materials" (
	"material_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"material_title" varchar(200) NOT NULL,
	"material_type" "material_type",
	"content_url" text,
	"file_size_mb" numeric(8, 2),
	"duration_minutes" integer,
	"description" text,
	"is_free" boolean DEFAULT false,
	"price" numeric(8, 2) DEFAULT '0',
	"view_count" integer DEFAULT 0,
	"download_count" integer DEFAULT 0,
	"rating" numeric(3, 2),
	"language" varchar(10) DEFAULT 'en',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subject_rankings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"total_points" integer NOT NULL,
	"practice_points" integer NOT NULL,
	"exam_points" integer NOT NULL,
	"accuracy_points" integer NOT NULL,
	"overall_rank" integer,
	"practice_rank" integer,
	"exam_rank" integer,
	"accuracy_rank" integer,
	"period" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subject_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"total_practice_sessions" integer DEFAULT 0 NOT NULL,
	"total_questions_attempted" integer DEFAULT 0 NOT NULL,
	"total_correct_answers" integer DEFAULT 0 NOT NULL,
	"total_incorrect_answers" integer DEFAULT 0 NOT NULL,
	"total_skipped_questions" integer DEFAULT 0 NOT NULL,
	"total_exam_sessions" integer DEFAULT 0 NOT NULL,
	"total_exam_questions_attempted" integer DEFAULT 0 NOT NULL,
	"total_exam_correct_answers" integer DEFAULT 0 NOT NULL,
	"total_exam_incorrect_answers" integer DEFAULT 0 NOT NULL,
	"total_time_spent_minutes" integer DEFAULT 0 NOT NULL,
	"average_time_per_question" numeric(5, 2) DEFAULT '0',
	"overall_accuracy" numeric(5, 2) DEFAULT '0',
	"practice_accuracy" numeric(5, 2) DEFAULT '0',
	"exam_accuracy" numeric(5, 2) DEFAULT '0',
	"ranking_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subjects" (
	"subject_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"subject_name" varchar(100) NOT NULL,
	"subject_code" varchar(20) NOT NULL,
	"weightage_percentage" numeric(5, 2),
	"total_questions" integer,
	"display_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "test_templates" (
	"template_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"template_name" varchar(200) NOT NULL,
	"test_type" "test_type",
	"total_questions" integer NOT NULL,
	"total_marks" numeric(6, 2) NOT NULL,
	"duration_minutes" integer NOT NULL,
	"is_free" boolean DEFAULT false,
	"price" numeric(8, 2) DEFAULT '0',
	"instructions" text,
	"syllabus_coverage" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "topics" (
	"topic_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" uuid NOT NULL,
	"topic_name" varchar(200) NOT NULL,
	"difficulty_level" "difficulty_level",
	"estimated_time_minutes" integer,
	"parent_topic_id" uuid,
	"display_order" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_exam_preferences" (
	"preference_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"exam_id" uuid NOT NULL,
	"target_exam_date" date,
	"daily_study_goal_minutes" integer DEFAULT 30,
	"is_primary_exam" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_notes" (
	"note_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"note_title" varchar(200) NOT NULL,
	"note_content" text NOT NULL,
	"note_color" varchar(7) DEFAULT '#FFD700',
	"topic_id" uuid,
	"subject_id" uuid,
	"question_id" uuid,
	"is_pinned" boolean DEFAULT false,
	"is_favorite" boolean DEFAULT false,
	"tags" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_progress" (
	"progress_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"topic_id" uuid NOT NULL,
	"subject_id" uuid NOT NULL,
	"total_questions_attempted" integer DEFAULT 0,
	"correct_answers" integer DEFAULT 0,
	"total_time_spent_seconds" integer DEFAULT 0,
	"mastery_level" "mastery_level" DEFAULT 'beginner',
	"mastery_percentage" numeric(5, 2) DEFAULT '0',
	"last_practiced_at" timestamp,
	"practice_count" integer DEFAULT 0,
	"average_accuracy" numeric(5, 2),
	"average_time_per_question_seconds" integer,
	"needs_revision" boolean DEFAULT false,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_rankings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_points" integer NOT NULL,
	"practice_points" integer NOT NULL,
	"exam_points" integer NOT NULL,
	"streak_points" integer NOT NULL,
	"accuracy_points" integer NOT NULL,
	"overall_rank" integer,
	"practice_rank" integer,
	"exam_rank" integer,
	"streak_rank" integer,
	"accuracy_rank" integer,
	"period" text NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_statistics" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"total_practice_sessions" integer DEFAULT 0 NOT NULL,
	"total_questions_attempted" integer DEFAULT 0 NOT NULL,
	"total_correct_answers" integer DEFAULT 0 NOT NULL,
	"total_incorrect_answers" integer DEFAULT 0 NOT NULL,
	"total_skipped_questions" integer DEFAULT 0 NOT NULL,
	"total_exam_sessions" integer DEFAULT 0 NOT NULL,
	"total_exam_questions_attempted" integer DEFAULT 0 NOT NULL,
	"total_exam_correct_answers" integer DEFAULT 0 NOT NULL,
	"total_exam_incorrect_answers" integer DEFAULT 0 NOT NULL,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"longest_streak" integer DEFAULT 0 NOT NULL,
	"last_activity_date" date,
	"total_time_spent_minutes" integer DEFAULT 0 NOT NULL,
	"average_time_per_question" numeric(5, 2) DEFAULT '0',
	"overall_accuracy" numeric(5, 2) DEFAULT '0',
	"practice_accuracy" numeric(5, 2) DEFAULT '0',
	"exam_accuracy" numeric(5, 2) DEFAULT '0',
	"ranking_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_tests" (
	"user_test_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"template_id" uuid NOT NULL,
	"test_status" "test_status" DEFAULT 'not_started',
	"started_at" timestamp,
	"completed_at" timestamp,
	"time_taken_seconds" integer,
	"total_questions_attempted" integer DEFAULT 0,
	"correct_answers" integer DEFAULT 0,
	"incorrect_answers" integer DEFAULT 0,
	"skipped_questions" integer DEFAULT 0,
	"marks_obtained" numeric(8, 2) DEFAULT '0',
	"total_marks" numeric(8, 2),
	"percentage" numeric(5, 2),
	"rank" integer,
	"total_participants" integer,
	"percentile" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(50),
	"email" varchar(255) NOT NULL,
	"phone" varchar(15),
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"role" "user_role" DEFAULT 'student',
	"profile_picture_url" text,
	"date_of_birth" date,
	"gender" "gender",
	"preferred_language" varchar(10) DEFAULT 'en',
	"subscription_type" "subscription_type" DEFAULT 'free',
	"subscription_start_date" timestamp,
	"subscription_end_date" timestamp,
	"total_points" integer DEFAULT 0,
	"level" integer DEFAULT 1,
	"coins" integer DEFAULT 0,
	"current_streak" integer DEFAULT 0,
	"longest_streak" integer DEFAULT 0,
	"last_activity_date" date,
	"total_study_time_minutes" integer DEFAULT 0,
	"total_practice_sessions" integer DEFAULT 0,
	"total_practice_score" integer DEFAULT 0,
	"weekly_practice_score" integer DEFAULT 0,
	"monthly_practice_score" integer DEFAULT 0,
	"last_practice_date" timestamp,
	"weekly_practice_count" integer DEFAULT 0,
	"monthly_practice_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_verified" boolean DEFAULT false,
	"email_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "dynamic_exam_sessions" ADD CONSTRAINT "dynamic_exam_sessions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "json_import_logs" ADD CONSTRAINT "json_import_logs_category_id_practice_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "practice_categories"("category_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "json_import_logs" ADD CONSTRAINT "json_import_logs_imported_by_users_user_id_fk" FOREIGN KEY ("imported_by") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_categories" ADD CONSTRAINT "practice_categories_created_by_users_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_categories" ADD CONSTRAINT "practice_categories_updated_by_users_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_category_id_practice_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "practice_categories"("category_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_job_id_jobs_job_id_fk" FOREIGN KEY ("job_id") REFERENCES "jobs"("job_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_created_by_users_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_questions" ADD CONSTRAINT "practice_questions_updated_by_users_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_sessions" ADD CONSTRAINT "practice_sessions_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_study_materials" ADD CONSTRAINT "practice_study_materials_category_id_practice_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "practice_categories"("category_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "practice_topics" ADD CONSTRAINT "practice_topics_category_id_practice_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "practice_categories"("category_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "topics"("topic_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("subject_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_exam_id_exams_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "exams"("exam_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "questions" ADD CONSTRAINT "questions_created_by_users_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "topics"("topic_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "study_materials" ADD CONSTRAINT "study_materials_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("subject_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subject_rankings" ADD CONSTRAINT "subject_rankings_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subject_rankings" ADD CONSTRAINT "subject_rankings_category_id_practice_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "practice_categories"("category_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subject_statistics" ADD CONSTRAINT "subject_statistics_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subject_statistics" ADD CONSTRAINT "subject_statistics_category_id_practice_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "practice_categories"("category_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subjects" ADD CONSTRAINT "subjects_exam_id_exams_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "exams"("exam_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "test_templates" ADD CONSTRAINT "test_templates_exam_id_exams_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "exams"("exam_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "topics" ADD CONSTRAINT "topics_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("subject_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_exam_preferences" ADD CONSTRAINT "user_exam_preferences_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_exam_preferences" ADD CONSTRAINT "user_exam_preferences_exam_id_exams_exam_id_fk" FOREIGN KEY ("exam_id") REFERENCES "exams"("exam_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "topics"("topic_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("subject_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_question_id_questions_question_id_fk" FOREIGN KEY ("question_id") REFERENCES "questions"("question_id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_topic_id_topics_topic_id_fk" FOREIGN KEY ("topic_id") REFERENCES "topics"("topic_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_subject_id_subjects_subject_id_fk" FOREIGN KEY ("subject_id") REFERENCES "subjects"("subject_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_rankings" ADD CONSTRAINT "user_rankings_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_statistics" ADD CONSTRAINT "user_statistics_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_tests" ADD CONSTRAINT "user_tests_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_tests" ADD CONSTRAINT "user_tests_template_id_test_templates_template_id_fk" FOREIGN KEY ("template_id") REFERENCES "test_templates"("template_id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
